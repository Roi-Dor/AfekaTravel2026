import { NextRequest, NextResponse } from 'next/server';
import { TripRequest, TripPlan, DayPlan, Coordinates } from '@/types/trip';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  countryCode: string;  // ISO 3166-1 alpha-2, e.g. "ch", "de"
  isValid: boolean;
  suggestion?: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSimpleWaypoints(start: Coordinates, end: Coordinates, count: number): Coordinates[] {
  const waypoints: Coordinates[] = [start];
  for (let i = 1; i < count - 1; i++) {
    const ratio = i / (count - 1); 
    waypoints.push({
      lat: start.lat + (end.lat - start.lat) * ratio + (Math.random() - 0.5) * 0.01,
      lng: start.lng + (end.lng - start.lng) * ratio + (Math.random() - 0.5) * 0.01,
    });
  }
  waypoints.push(end);
  return waypoints;
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

/**
 * Resolves a country name (in any common form) to an ISO 3166-1 alpha-2 code
 * using Nominatim's built-in country search. No hardcoded mapping needed.
 */
async function resolveCountryCode(country: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(country)}&featuretype=country&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'TravelAfeka2026/1.0' } }
    );
    const data = await response.json();
    console.log(`[DEBUG] resolveCountryCode("${country}") → raw:`, JSON.stringify(data?.[0]?.address));
    if (data && data.length > 0) {
      const code = data[0].address?.country_code?.toLowerCase() || null;
      console.log(`[DEBUG] resolved country code: "${code}"`);
      return code;
    }
    console.log(`[DEBUG] resolveCountryCode: no result for "${country}"`);
  } catch (error) {
    console.error('Country code resolution error:', error);
  }
  return null;
}

/**
 * Validates that the city exists within the given country.
 * Uses Nominatim's countrycodes filter — no normalization heuristics needed.
 */
// Nominatim place types that represent actual cities/towns/villages/regions
const VALID_CITY_TYPES = new Set([
  'city', 'town', 'village', 'hamlet', 'municipality', 'borough',
  'suburb', 'quarter', 'neighbourhood', 'county', 'state_district',
  'region', 'administrative'
]);

async function geocodeLocation(city: string, country: string): Promise<GeocodingResult> {
  // Step 1: resolve country → ISO code (no hardcoded map needed)
  const countryCode = await resolveCountryCode(country);

  if (!countryCode) {
    console.log(`[DEBUG] geocodeLocation: could not resolve country code for "${country}"`);
    return {
      lat: 0, lng: 0, displayName: '', countryCode: '', isValid: false,
      suggestion: `Could not recognize the country "${country}". Try using the English country name (e.g. "Switzerland", "France").`
    };
  }

  await sleep(300);

  try {
    // Step 2: search for city constrained to the resolved country code
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&countrycodes=${countryCode}&limit=3&addressdetails=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelAfeka2026/1.0' } });
    const data = await response.json();

    console.log(`[DEBUG] geocodeLocation("${city}", "${country}") with countrycodes=${countryCode}:`);
    data?.slice(0, 3).forEach((r: {display_name: string; type: string; class: string; lat: string; lon: string}, i: number) => {
      console.log(`  [${i}] type=${r.type} class=${r.class} display=${r.display_name} lat=${r.lat}`);
    });

    // Find the first result that is actually a city/place — not just a street/park/building
    const cityResult = data?.find((r: {type: string; class: string}) =>
      VALID_CITY_TYPES.has(r.type) || r.class === 'place' || r.class === 'boundary'
    );

    if (cityResult) {
      console.log(`[DEBUG] VALID city result found: ${cityResult.display_name}`);
      return {
        lat: parseFloat(cityResult.lat),
        lng: parseFloat(cityResult.lon),
        displayName: cityResult.display_name,
        countryCode,
        isValid: true,
      };
    }

    if (data && data.length > 0) {
      console.log(`[DEBUG] Found results in ${country} but none are city-type (got type=${data[0].type}, class=${data[0].class}). Rejecting.`);
    } else {
      console.log(`[DEBUG] No results at all for "${city}" in countrycodes=${countryCode}`);
    }

    // City not found in this country — check globally for a helpful suggestion
    await sleep(300);
    const globalResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1&addressdetails=1`,
      { headers: { 'User-Agent': 'TravelAfeka2026/1.0' } }
    );
    const globalData = await globalResponse.json();
    console.log(`[DEBUG] Global search for "${city}": type=${globalData?.[0]?.type} country=${globalData?.[0]?.address?.country}`);

    if (globalData && globalData.length > 0) {
      const foundCountry = globalData[0].address?.country || 'another country';
      return {
        lat: 0, lng: 0, displayName: '', countryCode, isValid: false,
        suggestion: `"${city}" was found in ${foundCountry}, not ${country}. Did you mean to change the country?`
      };
    }

    return { lat: 0, lng: 0, displayName: '', countryCode, isValid: false };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { lat: 0, lng: 0, displayName: '', countryCode: '', isValid: false };
  }
}

/**
 * Geocodes a named place (e.g. "Harder Kulm Viewpoint") within a specific country.
 * Returns fallback coordinates if the place cannot be found.
 */
async function geocodePlace(name: string, countryCode: string, fallback: Coordinates): Promise<Coordinates> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&countrycodes=${countryCode}&limit=1`,
      { headers: { 'User-Agent': 'TravelAfeka2026/1.0' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      console.log(`  [WAYPOINT] "${name}" → lat=${data[0].lat}, lng=${data[0].lon}, type=${data[0].type}`);
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    console.log(`  [WAYPOINT] "${name}" → NOT FOUND, using fallback lat=${fallback.lat}`);
  } catch (error) {
    console.error(`Geocoding place "${name}" error:`, error);
  }
  return fallback;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

/**
 * Gets a realistic road/trail route via OSRM between a sequence of real coordinates.
 * Returns the full detailed geometry (many lat/lng points following actual roads).
 * Falls back to simplified straight-line interpolation if OSRM is unavailable.
 */
async function buildOSRMRoute(points: Coordinates[], profile: 'foot' | 'bike'): Promise<Coordinates[]> {
  if (points.length < 2) return points;

  try {
    const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsString}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lng: coord[0]
      }));
    }
  } catch (error) {
    console.error('OSRM routing error:', error);
  }

  // Graceful fallback
  return generateSimpleWaypoints(points[0], points[points.length - 1], 8);
}

// ─── AI Integration ───────────────────────────────────────────────────────────

async function callGeminiAPI(prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    let attempt = 0;

    while (attempt < 2) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4096 }
        }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`[DEBUG] Gemini success with model: ${model}`);
        return text;
      }

      if (response.status === 429) {
        // Extract the retry delay from the response (in seconds)
        const retryDelaySec: string | null =
          data.error?.details?.find((d: {retryDelay?: string}) => d.retryDelay)?.retryDelay
            ?.replace('s', '') ?? null;
        const waitMs = retryDelaySec ? Math.min(parseFloat(retryDelaySec) * 1000, 65000) : 0;

        if (attempt === 0 && waitMs > 0 && waitMs <= 65000) {
          console.log(`[DEBUG] Gemini 429 on ${model}, retrying after ${(waitMs / 1000).toFixed(1)}s...`);
          await sleep(waitMs);
          attempt++;
          continue;
        } else {
          console.log(`[DEBUG] Gemini quota exhausted on ${model}, trying next model...`);
          break; // move to next model
        }
      }

      // Non-429 failure
      console.error(`[DEBUG] Gemini error on ${model} (HTTP ${response.status}):`, JSON.stringify(data.error));
      break; // try next model
    }
  }

  console.error('[DEBUG] All Gemini models failed or quota exhausted.');
  return '';
}

async function generateWithGemini(prompt: string): Promise<string> {
  return callGeminiAPI(prompt);
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function generateWithGroq(prompt: string): Promise<string> {
  // Groq is OpenAI-compatible with a generous free tier (~14,400 req/day).
  // Get a free key at https://console.groq.com
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });
  const data = await response.json();
  if (data.error) {
    console.error('[DEBUG] Groq error:', JSON.stringify(data.error));
    return '';
  }
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Generates a full trip plan using an AI model.
 *
 * Key change vs. previous version:
 * - The AI is asked to return "route_places": a list of 3 real, searchable
 *   place names per day (e.g. ["Harder Kulm", "Interlaken Ost station", "Unterseen"]).
 * - We geocode each name to get real lat/lng, then route via OSRM.
 * - This produces routes that follow actual roads/trails and day descriptions
 *   that name distinct, real locations.
 */
async function generateTripWithAI(
  request: TripRequest,
  baseCoords: Coordinates,
  locationName: string,
  countryCode: string
): Promise<Partial<TripPlan>> {
  const isBike = request.tripType === 'bike';
  const distanceRange = isBike ? '30-70' : '5-10';
  const activityType = isBike ? 'cycling/biking' : 'hiking/trekking';
  const routeStyle = isBike
    ? 'point-to-point: each day starts and ends at DIFFERENT locations, and day N+1 starts near where day N ended'
    : 'circular loop: each day starts and returns to the same trailhead — but a DIFFERENT trailhead each day';

  const prompt = `You are an expert local outdoor guide for ${request.city}, ${request.country}. Plan a detailed ${request.duration}-day ${activityType} itinerary.

STRICT RULES — READ CAREFULLY:
1. Every day must cover a COMPLETELY DIFFERENT area, trail, or route. No day may repeat a location from another day.
2. Daily distance: ${distanceRange} km. Route style: ${routeStyle}.
3. "route_places" MUST list exactly 3 real, specific, searchable place names IN ORDER from start to finish.
   - Use precise names that can be found on a map: "Harder Kulm Viewpoint", "Interlaken West Railway Station", "Aare River Gorge".
   - Do NOT use vague names like "scenic viewpoint", "local trail", or "mountain peak".
   - For circular (trek) days: the 1st and 3rd places should be the same trailhead or very close to each other.
   - For point-to-point (bike) days: the 3rd place of day N should be geographically close to the 1st place of day N+1.
4. Write 3 sentences for each description. Each sentence must name a specific, real location (trail, river, peak, village, viewpoint).
5. Highlights must be 3 real named POIs along the route.

OUTPUT ONLY VALID JSON — no markdown, no code blocks, no commentary before or after:
{
  "title": "Creative trip title that includes ${request.city}",
  "summary": "Exactly 2 sentences. Both must name specific geographic features or landscapes of ${request.city}.",
  "days": [
    {
      "day": 1,
      "title": "Day 1: [Unique trail or area name specific to ${request.city}]",
      "description": "Sentence naming departure point. Sentence naming key landmark or terrain feature en route. Sentence naming arrival point or highlight.",
      "distance": ${isBike ? 40 : 7},
      "highlights": ["Real named POI 1", "Real named POI 2", "Real named POI 3"],
      "route_places": ["Exact Start Place Name", "Exact Middle Landmark Name", "Exact End Place Name"]
    }
  ]
}

The "days" array must contain exactly ${request.duration} objects, one per day. Vary the daily distance within the allowed range.`;

  let aiResponse = '';
  console.log(`[DEBUG] AI generation starting for ${request.duration}-day ${request.tripType} in ${request.city}, ${request.country}`);

  if (GROQ_API_KEY) {
    console.log('[DEBUG] Trying Groq (llama-3.3-70b)...');
    aiResponse = await generateWithGroq(prompt);
  }
  if (!aiResponse && OPENAI_API_KEY) {
    console.log('[DEBUG] Trying OpenAI...');
    aiResponse = await generateWithOpenAI(prompt);
  }
  if (!aiResponse && GEMINI_API_KEY) {
    console.log('[DEBUG] Trying Gemini...');
    aiResponse = await generateWithGemini(prompt);
  }
  if (!aiResponse) {
    console.log('[DEBUG] No AI provider succeeded — using fallback trip');
    return generateFallbackTrip(request, baseCoords);
  }
  console.log('[DEBUG] Raw AI response (first 500 chars):', aiResponse.slice(0, 500));

  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.days || parsed.days.length === 0) throw new Error('AI returned no days');

    const days: DayPlan[] = [];

    for (let index = 0; index < parsed.days.length; index++) {
      const dayData = parsed.days[index];
      const routePlaces: string[] = Array.isArray(dayData.route_places) ? dayData.route_places : [];

      // Build a small offset fallback so days don't all collapse to the same point
      const dayFallback: Coordinates = {
        lat: baseCoords.lat + index * 0.018,
        lng: baseCoords.lng + index * 0.012,
      };

      // Geocode each named place sequentially (respecting Nominatim rate limit)
      const geocodedPoints: Coordinates[] = [];
      for (const placeName of routePlaces.slice(0, 3)) {
        await sleep(250); // stay under Nominatim's 1 req/sec limit
        const coords = await geocodePlace(`${placeName}, ${request.city}, ${request.country}`, countryCode, dayFallback);
        geocodedPoints.push(coords);
      }

      // Ensure we have at least 2 usable points for routing
      if (geocodedPoints.length < 2) {
        const endFallback: Coordinates = isBike
          ? { lat: dayFallback.lat + 0.04, lng: dayFallback.lng + 0.04 }
          : dayFallback;
        geocodedPoints.push(dayFallback, endFallback);
      }

      const startPoint = geocodedPoints[0];
      const endPoint = isBike ? geocodedPoints[geocodedPoints.length - 1] : geocodedPoints[0];

      // For trek (circular): close the loop by appending the start at the end
      const routeInputPoints = isBike
        ? geocodedPoints
        : [...geocodedPoints, geocodedPoints[0]];

      // Build road/trail-following route via OSRM
      const profile: 'foot' | 'bike' = isBike ? 'bike' : 'foot';
      const waypoints = await buildOSRMRoute(routeInputPoints, profile);

      days.push({
        day: dayData.day || index + 1,
        title: dayData.title || `Day ${index + 1}`,
        description: dayData.description || `Exploring the ${activityType} routes around ${request.city}.`,
        distance: typeof dayData.distance === 'number' ? dayData.distance : (isBike ? 45 : 7),
        startPoint,
        endPoint,
        waypoints,
        highlights: Array.isArray(dayData.highlights) ? dayData.highlights : [],
      });
    }

    return { title: parsed.title, summary: parsed.summary, days };
  } catch (error) {
    console.error('AI response parsing/geocoding error:', error, '\nRaw AI response:', aiResponse);
    return generateFallbackTrip(request, baseCoords);
  }
}

// ─── Fallback Trip Generator ──────────────────────────────────────────────────

function generateFallbackTrip(request: TripRequest, baseCoords: Coordinates): Partial<TripPlan> {
  const days: DayPlan[] = [];
  const isBike = request.tripType === 'bike';

  const dayActivities = isBike ? [
    {
      title: 'Scenic Valley Route',
      description: `Begin your cycling adventure with a gentle valley route near ${request.city}. The path follows along the riverside, passing through charming villages and crossing historic stone bridges. You'll enjoy flat terrain ideal for warming up your legs.`,
      highlights: ['River trail', 'Historic bridge', 'Local vineyard']
    },
    {
      title: 'Mountain Pass Adventure',
      description: `Today's ride tackles the mountain passes surrounding ${request.city}. Expect challenging climbs rewarded with breathtaking alpine views. The descent winds through dense forests before opening to panoramic mountain lake vistas.`,
      highlights: ['Alpine viewpoint', 'Mountain lake', 'Forest path']
    },
    {
      title: 'Coastal/Lakeside Journey',
      description: `A picturesque route along the waterfront awaits. Starting from the promenade, you'll cycle through fishing villages with colorful harbors. Time your arrival at the sunset viewpoint for stunning golden hour photography.`,
      highlights: ['Waterfront promenade', 'Fishing village', 'Sunset point']
    },
    {
      title: 'Rolling Hills Circuit',
      description: `Navigate the rolling countryside around ${request.city} on this varied terrain route. Gentle ascents lead to farmland plateaus with 360-degree views. Stop at local farm stands to sample regional produce.`,
      highlights: ['Farmland views', 'Country lanes', 'Local farm stops']
    },
    {
      title: 'Historic Path Ride',
      description: `Follow an ancient trading route that connects historic landmarks near ${request.city}. The well-maintained path passes medieval ruins and traditional architecture. History buffs will appreciate the cultural richness.`,
      highlights: ['Medieval ruins', 'Traditional architecture', 'Cultural museum']
    },
  ] : [
    {
      title: 'Forest Discovery Trail',
      description: `Immerse yourself in the ancient woodland surrounding ${request.city}. The circular trail weaves through towering trees, crosses babbling brooks, and leads to a secluded waterfall. Keep your eyes open for local wildlife.`,
      highlights: ['Ancient trees', 'Wildlife observation', 'Hidden waterfall']
    },
    {
      title: 'Summit Loop Hike',
      description: `Ascend to one of the highest viewpoints near ${request.city}. The trail traverses unique rock formations before reaching the summit meadow. On clear days, you can see for miles across the surrounding landscape.`,
      highlights: ['Panoramic views', 'Rock formations', 'Alpine meadow']
    },
    {
      title: 'Valley Circuit Walk',
      description: `A gentler loop through the pastoral valley floor. Wade across shallow river crossings, explore atmospheric ruins covered in moss, and walk through fields of seasonal wildflowers. Perfect for nature photography.`,
      highlights: ['River crossing', 'Historic ruins', 'Wildflower fields']
    },
    {
      title: 'Ridge Walk Adventure',
      description: `Follow the dramatic ridge line offering views in all directions near ${request.city}. The exposed path requires good weather but rewards with unforgettable vistas. Watch for soaring birds of prey riding the thermals.`,
      highlights: ['Ridge views', 'Bird watching', 'Mountain panorama']
    },
    {
      title: 'Lake Circuit Path',
      description: `Circle the pristine lake near ${request.city} on this peaceful trail. The path alternates between shaded forest and open lakeside stretches. Perfect spots for picnicking and swimming in summer months.`,
      highlights: ['Lakeside path', 'Forest shade', 'Picnic spots']
    },
  ];

  for (let i = 0; i < request.duration; i++) {
    const activity = dayActivities[i % dayActivities.length];
    const dayDistance = isBike ? 30 + Math.random() * 40 : 5 + Math.random() * 5;
    const startOffset = i * (isBike ? 0.1 : 0.02);

    const startPoint: Coordinates = {
      lat: baseCoords.lat + startOffset,
      lng: baseCoords.lng + startOffset * 0.5,
    };

    let endPoint: Coordinates;
    if (!isBike) {
      endPoint = { ...startPoint };
    } else {
      const angle = (Math.PI / 4) + (i * 0.3);
      const distDegrees = dayDistance / 111;
      endPoint = {
        lat: startPoint.lat + distDegrees * Math.cos(angle),
        lng: startPoint.lng + (distDegrees * Math.sin(angle)) / Math.cos(startPoint.lat * Math.PI / 180),
      };
    }

    days.push({
      day: i + 1,
      title: `Day ${i + 1}: ${activity.title}`,
      description: activity.description,
      distance: Math.round(dayDistance * 10) / 10,
      startPoint,
      endPoint,
      waypoints: generateSimpleWaypoints(startPoint, endPoint, 6),
      highlights: activity.highlights,
    });
  }

  return {
    title: `${isBike ? 'Cycling Adventure' : 'Hiking Expedition'} in ${request.city}, ${request.country}`,
    summary: `A ${request.duration}-day ${isBike ? 'cycling' : 'hiking'} journey through ${request.city}, featuring diverse landscapes from valley floors to mountain ridges, local culture, and unforgettable natural scenery.`,
    days,
  };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: TripRequest = await req.json();
    const { country, city, tripType, duration } = body;

    if (!country || !city || !tripType || !duration) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate city/country combination using Nominatim's countrycodes filter
    const geoResult = await geocodeLocation(city, country);

    if (!geoResult.isValid && geoResult.lat === 0) {
      return NextResponse.json(
        {
          success: false,
          message: geoResult.suggestion || `Could not find "${city}" in ${country}. Please check the city and country names.`,
        },
        { status: 400 }
      );
    }

    if (!geoResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `"${city}" was not found in ${country}.`,
          suggestion: geoResult.suggestion,
        },
        { status: 400 }
      );
    }

    const baseCoords: Coordinates = { lat: geoResult.lat, lng: geoResult.lng };

    // Generate the trip — now passing countryCode so waypoint geocoding is country-scoped
    const tripData = await generateTripWithAI(body, baseCoords, geoResult.displayName, geoResult.countryCode);

    const totalDistance = tripData.days?.reduce((sum, day) => sum + day.distance, 0) || 0;

    const trip: TripPlan = {
      country,
      city,
      tripType,
      duration,
      title: tripData.title || `${tripType === 'bike' ? 'Bike Tour' : 'Trek'} in ${city}`,
      summary: tripData.summary || '',
      totalDistance: Math.round(totalDistance * 10) / 10,
      days: tripData.days || [],
      weather: [],
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(city)}/800/400`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error('Trip generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Error generating trip. Please try again.' },
      { status: 500 }
    );
  }
}
