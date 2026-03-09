'use client';

import { WeatherDay } from '@/types/trip';

interface WeatherCardProps {
  weather: WeatherDay[];
}

const weatherIcons: Record<string, string> = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayName = days[date.getDay()];
  return `יום ${dayName}`;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  if (!weather || weather.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🌤️</span>
        תחזית מזג אוויר - 3 ימים
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {weather.map((day, index) => (
          <div 
            key={index}
            className="bg-white/20 rounded-lg p-4 text-center backdrop-blur-sm"
          >
            <div className="text-sm opacity-90 mb-1">{formatDate(day.date)}</div>
            <div className="text-3xl my-2">
              {weatherIcons[day.icon] || '🌡️'}
            </div>
            <div className="text-2xl font-bold">{day.temp}°</div>
            <div className="text-xs opacity-80 mt-1">
              {day.tempMin}° / {day.tempMax}°
            </div>
            <div className="text-xs mt-2 opacity-90">{day.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
