# Mental Health AI Assistant

A full-stack application for mental health support using AI technology.

## Project Structure

```
.
├── frontend/           # Next.js frontend
│   ├── app/           # Next.js app directory
│   ├── public/        # Static files
│   ├── types/         # TypeScript type definitions
│   └── package.json   # Frontend dependencies
└── backend/           # Flask backend
    ├── app.py         # Main Flask application
    ├── requirements.txt # Python dependencies
    ├── .env           # Environment variables
    └── .env.example   # Example environment configuration
```

## Prerequisites

- Node.js (v18 or later)
- Python (v3.8 or later)
- MongoDB
- OpenAI API key

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy the example environment file and update with your credentials:
   ```bash
   cp .env.example .env
   ```
   Then update the `.env` file with your MongoDB URI and OpenAI API key.

6. Start the Flask server:
   ```bash
   python app.py
   ```

## Features

- AI-powered chat interface for mental health support
- Interactive therapy dashboard for progress tracking
- Mood tracking system
- Journal entry system for tracking thoughts and emotions
- Real-time chat with AI therapist
- Secure user authentication
- Responsive and modern UI with Tailwind CSS
- TypeScript support for enhanced development experience

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/chat` - Chat with the AI assistant
- `POST /api/journal` - Create a new journal entry
- `GET /api/journal` - Get all journal entries
- `POST /api/mood` - Record mood entry
- `GET /api/mood` - Get mood history

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 