'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          מסלול טיולים אפקה 2026
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          תכנן את הטיול המושלם שלך בעזרת בינה מלאכותית. 
          קבל מסלולים מותאמים אישית לטרקים ולרכיבת אופניים.
        </p>
      </section>

      {isAuthenticated ? (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              שלום, {user?.firstName}! 👋
            </h2>
            <p className="text-gray-600 mb-6">
              מה תרצה לעשות היום?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/planning"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-md hover:shadow-lg"
              >
                🗺️ תכנן מסלול חדש
              </Link>
              <Link
                href="/history"
                className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
              >
                📜 צפה בהיסטוריה
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">🥾</div>
              <h3 className="text-xl font-semibold mb-2">טרקים</h3>
              <p className="text-green-100">
                מסלולים מעגליים של 5-10 ק״מ ליום, מותאמים להליכה רגלית בטבע.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="text-4xl mb-3">🚴</div>
              <h3 className="text-xl font-semibold mb-2">רכיבת אופניים</h3>
              <p className="text-orange-100">
                מסלולים מנקודה לנקודה של 30-70 ק״מ ליום, לרוכבים מתחילים ומתקדמים.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            התחל לתכנן את הטיול שלך
          </h2>
          <p className="text-gray-600 mb-6">
            הירשם או התחבר כדי ליצור מסלולי טיולים מותאמים אישית
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-md"
            >
              הרשמה
            </Link>
            <Link
              href="/login"
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              התחברות
            </Link>
          </div>
        </div>
      )}

      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md text-center">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="font-semibold text-lg mb-2">בינה מלאכותית</h3>
          <p className="text-gray-600 text-sm">
            מסלולים נוצרים באמצעות AI מתקדם המתאים את הטיול לצרכים שלך
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md text-center">
          <div className="text-3xl mb-3">🗺️</div>
          <h3 className="font-semibold text-lg mb-2">מפות אינטראקטיביות</h3>
          <p className="text-gray-600 text-sm">
            צפה במסלול על גבי מפה עם נתיבים ריאליסטיים ונקודות עניין
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md text-center">
          <div className="text-3xl mb-3">🌤️</div>
          <h3 className="font-semibold text-lg mb-2">תחזית מזג אוויר</h3>
          <p className="text-gray-600 text-sm">
            קבל תחזית ל-3 ימים הקרובים כדי לתכנן את הטיול בצורה מושלמת
          </p>
        </div>
      </section>
    </div>
  );
}
