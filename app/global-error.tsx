'use client';

import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="fixed inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
          <div className="relative z-10 w-full max-w-2xl">
            <div className="bg-linear-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-3xl p-8 md:p-12 backdrop-blur-sm shadow-2xl">
              <div className="text-center">
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <AlertTriangle className="h-16 w-16 text-red-400" />
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Critical Error
                </h1>
                <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                  A critical error occurred in the application. Please try refreshing the page.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Try Again</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Home className="h-5 w-5" />
                    <span>Go Home</span>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700/50">
                  <p className="text-gray-400 text-sm">
                    If the problem persists, please contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
