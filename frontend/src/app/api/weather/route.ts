import { NextRequest, NextResponse } from 'next/server';
import { WeatherDay } from '@/types/trip';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const city = searchParams.get('city');

  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json({
      success: true,
      data: generateMockWeather(),
    });
  }

  try {
    let url: string;
    
    if (lat && lng) {
      url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    } else {
      return NextResponse.json(
        { success: false, message: 'Location required' },
        { status: 400 }
      );
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== '200') {
      return NextResponse.json({
        success: true,
        data: generateMockWeather(),
      });
    }

    const dailyWeather: WeatherDay[] = [];
    const seenDates = new Set<string>();

    for (const item of data.list) {
      const date = item.dt_txt.split(' ')[0];
      
      if (!seenDates.has(date) && dailyWeather.length < 3) {
        seenDates.add(date);
        dailyWeather.push({
          date,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        });
      }
    }

    return NextResponse.json({ success: true, data: dailyWeather });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({
      success: true,
      data: generateMockWeather(),
    });
  }
}

function generateMockWeather(): WeatherDay[] {
  const today = new Date();
  const weather: WeatherDay[] = [];
  
  const conditions = [
    { description: 'מעונן חלקית', icon: '02d' },
    { description: 'בהיר', icon: '01d' },
    { description: 'מעונן', icon: '03d' },
  ];

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const condition = conditions[i % conditions.length];
    const baseTemp = 15 + Math.random() * 10;
    
    weather.push({
      date: date.toISOString().split('T')[0],
      temp: Math.round(baseTemp),
      tempMin: Math.round(baseTemp - 3),
      tempMax: Math.round(baseTemp + 5),
      description: condition.description,
      icon: condition.icon,
    });
  }

  return weather;
}
