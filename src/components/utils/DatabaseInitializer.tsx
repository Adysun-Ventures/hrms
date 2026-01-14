'use client';

import { useState, useEffect } from 'react';
import { initializeDatabase } from '@/firebase/firestore-setup';

export default function DatabaseInitializer() {
  const [status, setStatus] = useState<'idle' | 'initializing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleInitialize = async () => {
    try {
      setStatus('initializing');
      setMessage('Initializing database...');
      await initializeDatabase();
      setStatus('success');
      setMessage('Database initialized successfully!');
    } catch (error: any) {
      setStatus('error');
      setMessage(`Error initializing database: ${error.message}`);
      console.error('Error initializing database:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg max-w-md">
      <h3 className="text-lg font-semibold mb-2">Database Initialization</h3>
      
      {status === 'idle' && (
        <p className="mb-3 text-sm text-gray-600">
          Initialize the database with sample data if collections are empty.
        </p>
      )}
      
      {status !== 'idle' && (
        <div className={`mb-3 text-sm ${
          status === 'error' ? 'text-red-600' : 
          status === 'success' ? 'text-green-600' : 
          'text-blue-600'
        }`}>
          {message}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleInitialize}
          disabled={status === 'initializing'}
          className={`px-4 py-2 rounded-md text-white ${
            status === 'initializing' ? 'bg-gray-400 cursor-not-allowed' : 
            status === 'success' ? 'bg-green-600 hover:bg-green-700' : 
            status === 'error' ? 'bg-red-600 hover:bg-red-700' : 
            'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {status === 'initializing' ? 'Initializing...' : 
           status === 'success' ? 'Initialized' : 
           status === 'error' ? 'Try Again' : 
           'Initialize Database'}
        </button>
      </div>
    </div>
  );
} 