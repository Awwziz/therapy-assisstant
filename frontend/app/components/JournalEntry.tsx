'use client';

import { useState } from 'react';
import { PencilIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface JournalResponse {
  response: string;
  timestamp: string;
}

export default function JournalEntry() {
  const [entry, setEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<JournalResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/therapeutic-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: entry }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error('Error submitting journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <PencilIcon className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-semibold">Daily Reflection</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="journal-entry" className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling today?
            </label>
            <textarea
              id="journal-entry"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Write your thoughts, feelings, or experiences here..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <SparklesIcon className="animate-spin h-5 w-5 mr-2" />
                Processing...
              </span>
            ) : (
              'Get DBT Response'
            )}
          </button>
        </form>

        {response && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Therapeutic Response</h3>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{response.response}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(response.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 