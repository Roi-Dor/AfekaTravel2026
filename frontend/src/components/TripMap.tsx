'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DayPlan, Coordinates } from '@/types/trip';

interface TripMapProps {
  days: DayPlan[];
  tripType: 'trek' | 'bike';
}

const dayColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
];

export default function TripMap({ days, tripType }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || days.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const allCoords: Coordinates[] = [];
    
    days.forEach((day, dayIndex) => {
      const color = dayColors[dayIndex % dayColors.length];
      
      const routePoints: L.LatLngExpression[] = day.waypoints && day.waypoints.length > 0
        ? day.waypoints.map(wp => [wp.lat, wp.lng] as L.LatLngExpression)
        : [
            [day.startPoint.lat, day.startPoint.lng],
            [day.endPoint.lat, day.endPoint.lng],
          ];

      allCoords.push(day.startPoint, ...day.waypoints, day.endPoint);

      const polyline = L.polyline(routePoints, {
        color,
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(map);

      polyline.bindPopup(`<strong>יום ${day.day}</strong><br>${day.title}<br>${day.distance} ק"מ`);

      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${day.day}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([day.startPoint.lat, day.startPoint.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<strong>יום ${day.day} - התחלה</strong><br>${day.title}`);

      if (tripType === 'bike' && (day.startPoint.lat !== day.endPoint.lat || day.startPoint.lng !== day.endPoint.lng)) {
        const endIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${color}; color: white; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([day.endPoint.lat, day.endPoint.lng], { icon: endIcon })
          .addTo(map)
          .bindPopup(`<strong>יום ${day.day} - סיום</strong>`);
      }
    });

    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [days, tripType]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg"
      style={{ zIndex: 1 }}
    />
  );
}
