'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import TherapyDashboard from './components/TherapyDashboard';
import MoodTracker from './components/MoodTracker';
import JournalEntry from './components/JournalEntry';
import TherapyChat from './components/TherapyChat';

export default function Home(): React.ReactElement {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Mental Health AI Assistant
          </h1>
          <p className="text-xl text-gray-600">
            Your personal AI companion for mental well-being
          </p>
        </header>

        <div className="space-y-8">
          <TherapyDashboard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <MoodTracker />
              <JournalEntry />
            </div>
            <TherapyChat />
          </div>
        </div>
      </div>
    </div>
  );
} 