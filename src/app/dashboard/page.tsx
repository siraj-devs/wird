'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  provider: 'discord' | 'telegram';
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-gray-800">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8">
          <div className="flex items-center gap-6 mb-8">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full border-4 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
              {user.email && (
                <p className="text-gray-400 mb-2">{user.email}</p>
              )}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm capitalize">
                  {user.provider}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Account ID</h3>
              <p className="text-gray-300 font-mono text-sm break-all">{user.id}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Member Since</h3>
              <p className="text-gray-300">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-2">Welcome to Your Dashboard!</h3>
            <p className="text-gray-300">
              You've successfully authenticated using {user.provider}. This is a secure area protected by custom OAuth implementation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
