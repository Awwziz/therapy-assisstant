'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/react/24/outline';
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

const DBT_SKILLS = [
  {
    name: "Mindfulness",
    description: "Practice observing your thoughts and feelings without judgment",
    example: "Take 5 minutes to focus on your breath and notice sensations in your body"
  },
  {
    name: "Distress Tolerance",
    description: "Use TIPP skills to manage intense emotions",
    example: "Try Temperature change, Intense exercise, Paced breathing, or Paired muscle relaxation"
  },
  {
    name: "Emotion Regulation",
    description: "Build positive experiences to increase positive emotions",
    example: "Plan and engage in one pleasant activity today"
  },
  {
    name: "Interpersonal Effectiveness",
    description: "Practice DEAR MAN for effective communication",
    example: "Describe the situation, Express your feelings, Assert your needs, Reinforce the relationship"
  }
];

interface MoodEntry {
  mood: number;
  timestamp: string;
  note?: string;
}

interface JournalEntry {
  content: string;
  response: string;
  timestamp: string;
}

export default function TherapyDashboard() {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [lastJournalEntry, setLastJournalEntry] = useState<JournalEntry | null>(null);
  const [skillOfTheDay, setSkillOfTheDay] = useState(DBT_SKILLS[0]);

  useEffect(() => {
    // Load mood history from localStorage
    const savedHistory = localStorage.getItem('moodHistory');
    if (savedHistory) {
      setMoodHistory(JSON.parse(savedHistory));
    }

    // Load last journal entry from localStorage
    const savedJournal = localStorage.getItem('lastJournalEntry');
    if (savedJournal) {
      setLastJournalEntry(JSON.parse(savedJournal));
    }

    // Set random skill of the day
    const randomSkill = DBT_SKILLS[Math.floor(Math.random() * DBT_SKILLS.length)];
    setSkillOfTheDay(randomSkill);
  }, []);

  const chartData = {
    labels: moodHistory.slice(-7).map(entry => 
      new Date(entry.timestamp).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Mood Level',
        data: moodHistory.slice(-7).map(entry => entry.mood),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DBT Skill of the Day */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Skill of the Day</h2>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-indigo-700">{skillOfTheDay.name}</h3>
            <p className="text-gray-600">{skillOfTheDay.description}</p>
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-700 italic">"{skillOfTheDay.example}"</p>
            </div>
          </div>
        </div>

        {/* Mood Trends */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Mood Trends</h2>
          </div>
          <div className="h-48">
            {moodHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <p className="text-gray-500 text-center mt-16">No mood data available yet</p>
            )}
          </div>
        </div>

        {/* Last Journal Response */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpenIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Last Journal Response</h2>
          </div>
          {lastJournalEntry ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">Your entry:</p>
                <p className="text-gray-600 italic">"{lastJournalEntry.content.substring(0, 100)}..."</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">Therapeutic response:</p>
                <p className="text-gray-600">"{lastJournalEntry.response.substring(0, 150)}..."</p>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(lastJournalEntry.timestamp).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-16">No journal entries yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 