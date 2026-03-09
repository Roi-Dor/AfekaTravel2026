'use client';

import { useState } from 'react';
import { TripPlan, TripRequest } from '@/types/trip';
import TripResult from '@/components/TripResult';

export default function PlanningPage() {
  const [formData, setFormData] = useState<TripRequest>({
    country: '',
    city: '',
    tripType: 'trek',
    duration: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [trip, setTrip] = useState<TripPlan | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestion('');
    setIsLoading(true);
    setTrip(null);
    setSaveMessage('');

    try {
      const tripResponse = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const tripData = await tripResponse.json();

      if (!tripData.success) {
        if (tripData.suggestion) {
          setSuggestion(tripData.suggestion);
        }
        throw new Error(tripData.message || 'Failed to generate trip');
      }

      const generatedTrip = tripData.data;

      const weatherResponse = await fetch(
        `/api/weather?city=${encodeURIComponent(formData.city)},${encodeURIComponent(formData.country)}`
      );
      const weatherData = await weatherResponse.json();

      if (weatherData.success) {
        generatedTrip.weather = weatherData.data;
      }

      setTrip(generatedTrip);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת המסלול');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!trip || isSaving) return;
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage('✅ המסלול נשמר בהצלחה!');
      } else {
        setSaveMessage(`❌ ${data.message || 'שגיאה בשמירה'}`);
      }
    } catch {
      setSaveMessage('❌ שגיאה בשמירת המסלול');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewTrip = () => {
    setTrip(null);
    setError('');
    setSaveMessage('');
  };

  if (trip) {
    return (
      <div className="max-w-4xl mx-auto">
        {saveMessage && (
          <div className={`mb-4 p-4 rounded-xl text-center font-medium ${
            saveMessage.startsWith('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        )}
        <TripResult 
          trip={trip} 
          onSave={!saveMessage?.startsWith('✅') ? handleSave : undefined}
          isSaving={isSaving}
          onNewTrip={handleNewTrip}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">תכנון מסלול</h1>
        <p className="text-gray-600">מלא את הפרטים וקבל מסלול מותאם אישית באמצעות AI</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-center">
            <p>{error}</p>
            {suggestion && (
              <p className="mt-2 text-red-500 font-medium">{suggestion}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                מדינה
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="לדוגמה: Switzerland"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                עיר / אזור
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="לדוגמה: Interlaken"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              סוג הטיול
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.tripType === 'trek'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="tripType"
                  value="trek"
                  checked={formData.tripType === 'trek'}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="sr-only"
                />
                <span className="text-2xl">🥾</span>
                <div>
                  <div className="font-semibold">טרק</div>
                  <div className="text-xs text-gray-500">5-10 ק״מ ליום, מסלול מעגלי</div>
                </div>
              </label>
              <label
                className={`flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.tripType === 'bike'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="tripType"
                  value="bike"
                  checked={formData.tripType === 'bike'}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="sr-only"
                />
                <span className="text-2xl">🚴</span>
                <div>
                  <div className="font-semibold">אופניים</div>
                  <div className="text-xs text-gray-500">30-70 ק״מ ליום, נקודה לנקודה</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              משך הטיול: <span className="font-bold text-blue-600">{formData.duration} ימים</span>
            </label>
            <input
              type="range"
              id="duration"
              name="duration"
              min="1"
              max="14"
              value={formData.duration}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>יום אחד</span>
              <span>שבועיים</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-semibold text-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>יוצר מסלול...</span>
              </>
            ) : (
              <>
                <span>🤖</span>
                <span>צור מסלול עם AI</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="text-sm font-medium text-blue-800">מפה אינטראקטיבית</div>
            <div className="text-xs text-blue-600">עם מסלולים ריאליסטיים</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🌤️</div>
            <div className="text-sm font-medium text-green-800">תחזית מזג אוויר</div>
            <div className="text-xs text-green-600">ל-3 ימים הקרובים</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="text-sm font-medium text-purple-800">יצירת תוכן AI</div>
            <div className="text-xs text-purple-600">מסלולים מותאמים אישית</div>
          </div>
        </div>
      </div>
    </div>
  );
}
