'use client';

import dynamic from 'next/dynamic';
import { TripPlan } from '@/types/trip';
import WeatherCard from './WeatherCard';

const TripMap = dynamic(() => import('./TripMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-gray-200 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">טוען מפה...</span>
    </div>
  ),
});

interface TripResultProps {
  trip: TripPlan;
  onSave?: () => void;
  onNewTrip?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
}

export default function TripResult({ trip, onSave, onNewTrip, onDelete, isSaving }: TripResultProps) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img
          src={trip.imageUrl}
          alt={trip.title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{trip.title}</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              📍 {trip.city}, {trip.country}
            </span>
            <span className="flex items-center gap-1">
              📅 {trip.duration} ימים
            </span>
            <span className="flex items-center gap-1">
              🛤️ {trip.totalDistance} ק״מ
            </span>
            <span className="flex items-center gap-1">
              {trip.tripType === 'bike' ? '🚴' : '🥾'} {trip.tripType === 'bike' ? 'אופניים' : 'טרק'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">סיכום המסלול</h3>
        <p className="text-gray-600">{trip.summary}</p>
      </div>

      <TripMap days={trip.days} tripType={trip.tripType} />

      <WeatherCard weather={trip.weather} />

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-6 pb-4 border-b">
          תוכנית יומית
        </h3>
        <div className="divide-y">
          {trip.days.map((day) => (
            <div key={day.day} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {day.day}
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-900 mb-1">{day.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">{day.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      📏 {day.distance} ק״מ
                    </span>
                    {day.highlights.map((highlight, idx) => (
                      <span 
                        key={idx}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs"
                      >
                        ✨ {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-4 rounded-xl font-semibold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>שומר...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>שמור מסלול</span>
              </>
            )}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>🗑️</span>
            מחק מסלול
          </button>
        )}
        {onNewTrip && (
          <button
            onClick={onNewTrip}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            תכנן מסלול חדש
          </button>
        )}
      </div>
    </div>
  );
}
