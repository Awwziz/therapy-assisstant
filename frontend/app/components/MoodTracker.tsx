'use client';

import { useState, useEffect } from 'react';
import { FaceSmileIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Happy', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙁', label: 'Sad', value: 2 },
  { emoji: '😢', label: 'Very Sad', value: 1 }
];

interface MoodEntry {
  mood: number;
  timestamp: string;
  note?: string;
}

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load mood history from localStorage
    const savedHistory = localStorage.getItem('moodHistory');
    if (savedHistory) {
      setMoodHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleMoodSubmit = () => {
    if (selectedMood === null) return;

    const newEntry: MoodEntry = {
      mood: selectedMood,
      timestamp: new Date().toISOString(),
      note: note.trim() || undefined
    };

    const updatedHistory = [...moodHistory, newEntry];
    setMoodHistory(updatedHistory);
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
    
    setSelectedMood(null);
    setNote('');
  };

  const chartData = {
    labels: moodHistory.map(entry => 
      new Date(entry.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Mood Level',
        data: moodHistory.map(entry => entry.mood),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <FaceSmileIcon className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-semibold">Mood Tracker</h2>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">How are you feeling today?</h3>
            <div className="flex justify-center space-x-4 mb-4">
              {MOOD_EMOJIS.map(({ emoji, label, value }) => (
                <button
                  key={value}
                  onClick={() => setSelectedMood(value)}
                  className={`text-4xl p-2 rounded-full transition-colors ${
                    selectedMood === value ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-gray-100'
                  }`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mood-note" className="block text-sm font-medium text-gray-700 mb-2">
              Add a note (optional)
            </label>
            <textarea
              id="mood-note"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="What's contributing to your mood today?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            onClick={handleMoodSubmit}
            disabled={selectedMood === null}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Record Mood
          </button>

          {moodHistory.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center space-x-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Mood Trends</h3>
              </div>
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 