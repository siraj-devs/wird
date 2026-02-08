'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function TelegramAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authId = searchParams.get('auth_id');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authId) {
      setError('Invalid authentication request');
      return;
    }

    // Define the callback function
    window.onTelegramAuth = async (user: any) => {
      try {
        const response = await fetch('/api/auth/callback/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          router.push(data.redirect || '/dashboard');
        } else {
          setError(data.error || 'Authentication failed');
        }
      } catch (err) {
        setError('Failed to authenticate with Telegram');
      }
    };

    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '');
    script.setAttribute('data-size', 'large');
    // script.setAttribute('data-auth-url', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [authId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800">
        <div className="max-w-md w-full p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Telegram Login</h1>
        <p className="text-gray-400 mb-8">Click the button below to authenticate with Telegram</p>
        
        <div id="telegram-login-container" className="flex justify-center mb-6"></div>
        
        <p className="text-sm text-gray-500">
          Make sure you have Telegram installed and are logged in
        </p>
        
        <div className="mt-6">
          <a
            href="/login"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
