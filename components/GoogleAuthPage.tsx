"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import RedDotWave from './RedDotWave';

export default function GoogleAuthPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-black relative">
      {/* Optional brand mark bottom-left (replace with your logo or remove) */}
      <div className="absolute bottom-6 left-6 z-50 pointer-events-none select-none">
        <div className="w-6 h-6 rounded-full bg-red-600" title="Logo" />
      </div>

      <div className="flex w-full h-full">
        {/* Left side - RedDotWave */}
        <div className="hidden lg:flex w-1/2 h-full overflow-hidden">
          <RedDotWave
            showControls={false}
            color="#ff2d20"
            background="#000000"
            amplitude={4}
            speed={0.8}
            gridSize={80}
          />
        </div>

        {/* Right side - Google-only */}
        <div className="w-full lg:w-1/2 h-full flex items-center justify-center py-8 overflow-auto">
          <div className="max-w-lg w-full space-y-6 px-8">
            <div>
              <h2 className="mt-0 text-2xl lg:text-3xl font-extrabold text-white text-left whitespace-nowrap">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-300 text-left">
                Continue securely with Google.
              </p>
            </div>

            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-2.5 px-3 border border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800 shadow-sm text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">{isLoading ? 'Signing in…' : 'Sign in with Google'}</span>
              </button>

              {/* Optional terms/help text */}
              <p className="text-xs text-gray-400">
                By continuing, you agree to our Terms and acknowledge our Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
