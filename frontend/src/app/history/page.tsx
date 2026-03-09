'use client';

import { useState, useEffect, useCallback } from 'react';
import { TripPlan } from '@/types/trip';
import TripResult from '@/components/TripResult';

interface SavedTrip extends TripPlan {
  _id: string;
}

export default function HistoryPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/trips');
      const data = await response.json();
      if (data.success) {
        setTrips(data.data);
      } else {
        setError(data.message || 'שגיאה בטעינת המסלולים');
      }
    } catch {
      setError('שגיאה בטעינת המסלולים');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleSelectTrip = async (trip: SavedTrip) => {
    setWeatherLoading(true);
    setSelectedTrip({ ...trip, weather: [] });

    try {
      const weatherResponse = await fetch(
        `/api/weather?city=${encodeURIComponent(trip.city)},${encodeURIComponent(trip.country)}`
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.success) {
        setSelectedTrip(prev => prev ? { ...prev, weather: weatherData.data } : null);
      }
    } catch {
      // Weather is optional — trip still shows without it
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המסלול?')) return;

    try {
      const response = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setSelectedTrip(null);
        fetchTrips();
      } else {
        alert(data.message || 'שגיאה במחיקה');
      }
    } catch {
      alert('שגיאה במחיקת המסלול');
    }
  };

  const handleBack = () => {
    setSelectedTrip(null);
  };

  // ─── Detail View ────────────────────────────────────────────────────────────
  if (selectedTrip) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <span>→</span> חזרה לרשימה
        </button>

        {weatherLoading && (
          <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg text-center text-sm">
            ⏳ טוען תחזית מזג אוויר עדכנית...
          </div>
        )}

        <TripResult
          trip={selectedTrip}
          onDelete={() => handleDelete(selectedTrip._id)}
        />
      </div>
    );
  }

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">היסטוריית טיולים</h1>
          <p className="text-gray-600">כל המסלולים שתכננת ושמרת</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">היסטוריית טיולים</h1>
        </div>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center max-w-2xl mx-auto">
          <p>{error}</p>
          <button
            onClick={fetchTrips}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // ─── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">היסטוריית טיולים</h1>
        <p className="text-gray-600">כל המסלולים שתכננת ושמרת</p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-2xl mx-auto">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            אין מסלולים שמורים
          </h2>
          <p className="text-gray-600 mb-6">
            עדיין לא שמרת אף מסלול. תכנן מסלול חדש ושמור אותו כדי שיופיע כאן.
          </p>
          <a
            href="/planning"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            תכנן מסלול חדש
          </a>
        </div>
      ) : (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {trips.map((trip) => (
            <button
              key={trip._id}
              onClick={() => handleSelectTrip(trip)}
              className="w-full text-right bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden group"
            >
              <div className="flex">
                <div className="w-40 h-40 flex-shrink-0 overflow-hidden">
                  <img
                    src={trip.imageUrl}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-grow p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {trip.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {trip.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      📍 {trip.city}, {trip.country}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      📅 {trip.duration} ימים
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      🛤️ {trip.totalDistance} ק״מ
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      {trip.tripType === 'bike' ? '🚴 אופניים' : '🥾 טרק'}
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                      {new Date(trip.createdAt || '').toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
