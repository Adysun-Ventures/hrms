import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">Error</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Something went wrong!</h2>
        <p className="text-gray-600 mb-8">We've encountered an error while loading this page.</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-block bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
