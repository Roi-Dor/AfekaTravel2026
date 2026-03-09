'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold hover:text-blue-200 transition-colors">
              מסלול טיולים אפקה 2026
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/" 
                  className="hover:text-blue-200 transition-colors font-medium"
                >
                  בית
                </Link>
                <Link 
                  href="/planning" 
                  className="hover:text-blue-200 transition-colors font-medium"
                >
                  תכנון מסלול
                </Link>
                <Link 
                  href="/history" 
                  className="hover:text-blue-200 transition-colors font-medium"
                >
                  היסטוריה
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-blue-100">
                  שלום, {user?.firstName}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  התנתק
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition-colors font-medium"
                >
                  התחבר
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  הרשמה
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
