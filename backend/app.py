from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from datetime import datetime, timedelta
import jwt
from functools import wraps
from openai import OpenAI
import logging
from logging.handlers import RotatingFileHandler
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# Load environment variables
load_dotenv()

# Initialize Sentry for error monitoring
sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0,
    environment=os.getenv('ENVIRONMENT', 'development')
)

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')

# Configure logging
if not os.path.exists('logs'):
    os.mkdir('logs')
file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Therapy Assistant startup')

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
    db = client.mental_health_db
    app.logger.info('Successfully connected to MongoDB')
except Exception as e:
    app.logger.error(f'Failed to connect to MongoDB: {str(e)}')
    sentry_sdk.capture_exception(e)
    raise

# DBT-informed system prompt
DBT_SYSTEM_PROMPT = """You are a DBT (Dialectical Behavior Therapy) informed AI assistant specializing in emotional regulation and distress tolerance. 
Your role is to analyze journal entries and provide therapeutic responses that incorporate DBT principles.

For each response, follow this structured approach:

1. EMOTIONAL ASSESSMENT:
   - Identify primary and secondary emotions
   - Note any signs of emotional dysregulation
   - Recognize emotional intensity levels
   - Point out any emotional avoidance or suppression

2. TRIGGER ANALYSIS:
   - Identify potential triggers (internal or external)
   - Note any patterns in emotional responses
   - Recognize vulnerability factors
   - Point out any cognitive distortions

3. DBT SKILL RECOMMENDATIONS:
   - Suggest 2-3 specific DBT skills from these categories:
     * Mindfulness: Observe, Describe, Participate
     * Distress Tolerance: TIPP, ACCEPTS, IMPROVE
     * Emotion Regulation: PLEASE, ABC, Opposite Action
     * Interpersonal Effectiveness: DEAR MAN, GIVE, FAST
   - Explain how to apply each skill
   - Provide concrete examples

4. RESPONSE STRUCTURE:
   - Start with validation and empathy
   - Share your observations about emotions and triggers
   - Present skill recommendations with clear instructions
   - End with encouragement and hope

Remember to:
- Use non-judgmental language
- Keep responses concise and focused
- Provide practical, actionable steps
- Maintain a supportive and professional tone
- Avoid making diagnoses or medical recommendations"""

# Crisis keywords and corresponding grounding exercises
CRISIS_KEYWORDS = {
    'suicide': ['5-4-3-2-1 Grounding Exercise', 'Box Breathing', 'Progressive Muscle Relaxation'],
    'self-harm': ['5-4-3-2-1 Grounding Exercise', 'Temperature Change', 'Safe Place Visualization'],
    'overwhelmed': ['Box Breathing', 'Body Scan', 'Mindful Walking'],
    'panic': ['5-4-3-2-1 Grounding Exercise', 'Box Breathing', 'Grounding Through Touch'],
    'hopeless': ['Gratitude List', 'Future Visualization', 'Positive Affirmations'],
    'worthless': ['Self-Compassion Exercise', 'Strengths Inventory', 'Positive Affirmations']
}

GROUNDING_EXERCISES = {
    '5-4-3-2-1 Grounding Exercise': {
        'steps': [
            'Name 5 things you can see',
            'Name 4 things you can touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell',
            'Name 1 thing you can taste'
        ],
        'description': 'A sensory-based grounding technique to bring you back to the present moment'
    },
    'Box Breathing': {
        'steps': [
            'Inhale for 4 seconds',
            'Hold breath for 4 seconds',
            'Exhale for 4 seconds',
            'Hold breath for 4 seconds',
            'Repeat 4 times'
        ],
        'description': 'A breathing technique to calm the nervous system'
    },
    'Progressive Muscle Relaxation': {
        'steps': [
            'Tense and release each muscle group',
            'Start from toes and work up to head',
            'Hold tension for 5 seconds',
            'Release and notice the difference'
        ],
        'description': 'A technique to release physical tension'
    },
    'Temperature Change': {
        'steps': [
            'Hold an ice cube',
            'Splash cold water on face',
            'Take a warm shower',
            'Use a heating pad'
        ],
        'description': 'Using temperature to ground yourself in the present'
    },
    'Safe Place Visualization': {
        'steps': [
            'Close your eyes',
            'Imagine a safe, peaceful place',
            'Engage all senses in the visualization',
            'Stay there for a few minutes'
        ],
        'description': 'A visualization technique to create a mental safe space'
    },
    'Body Scan': {
        'steps': [
            'Start at the top of your head',
            'Notice sensations in each body part',
            'Move slowly down to your toes',
            'Release any tension you find'
        ],
        'description': 'A mindfulness technique to connect with your body'
    },
    'Mindful Walking': {
        'steps': [
            'Walk slowly and deliberately',
            'Notice each step',
            'Feel the ground beneath you',
            'Observe your surroundings'
        ],
        'description': 'A movement-based grounding technique'
    },
    'Grounding Through Touch': {
        'steps': [
            'Find different textures around you',
            'Describe how each feels',
            'Focus on the sensations',
            'Notice temperature and pressure'
        ],
        'description': 'Using touch to ground yourself in the present'
    },
    'Gratitude List': {
        'steps': [
            'List 3 things you're grateful for',
            'Be specific and detailed',
            'Focus on small, everyday things',
            'Write them down if possible'
        ],
        'description': 'A technique to shift focus to positive aspects of life'
    },
    'Future Visualization': {
        'steps': [
            'Imagine a positive future moment',
            'Include specific details',
            'Engage all senses',
            'Focus on feelings of hope'
        ],
        'description': 'A visualization technique to cultivate hope'
    },
    'Positive Affirmations': {
        'steps': [
            'Choose 3 positive statements',
            'Repeat them out loud',
            'Write them down',
            'Believe in their truth'
        ],
        'description': 'Using positive statements to counter negative thoughts'
    },
    'Self-Compassion Exercise': {
        'steps': [
            'Acknowledge your suffering',
            'Recognize it\'s part of being human',
            'Offer yourself kindness',
            'Use gentle, supportive language'
        ],
        'description': 'A technique to cultivate self-compassion'
    },
    'Strengths Inventory': {
        'steps': [
            'List your personal strengths',
            'Recall times you used them',
            'Identify how they help you',
            'Plan to use them today'
        ],
        'description': 'A technique to build self-esteem'
    }
}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.users.find_one({'_id': data['user_id']})
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    if db.users.find_one({'username': username}):
        return jsonify({'message': 'Username already exists'}), 400
    
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    user = {
        'username': username,
        'password': hashed_password,
        'created_at': datetime.utcnow()
    }
    
    result = db.users.insert_one(user)
    user['_id'] = str(result.inserted_id)
    del user['password']
    
    return jsonify({'message': 'User created successfully', 'user': user}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = db.users.find_one({'username': username})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username']
        }
    })

@app.route('/api/journal', methods=['POST'])
@token_required
def create_journal_entry(current_user):
    data = request.json
    entry = {
        'user_id': current_user['_id'],
        'content': data.get('content', ''),
        'timestamp': datetime.utcnow().isoformat(),
        'mood': data.get('mood', 'neutral')
    }
    
    result = db.journal_entries.insert_one(entry)
    return jsonify({"id": str(result.inserted_id), "status": "success"})

@app.route('/api/journal', methods=['GET'])
@token_required
def get_journal_entries(current_user):
    entries = list(db.journal_entries.find({'user_id': current_user['_id']}).sort("timestamp", -1))
    for entry in entries:
        entry['_id'] = str(entry['_id'])
    return jsonify(entries)

@app.route('/api/mood', methods=['POST'])
@token_required
def record_mood(current_user):
    data = request.json
    mood_entry = {
        'user_id': current_user['_id'],
        'mood': data.get('mood'),
        'note': data.get('note', ''),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    result = db.mood_entries.insert_one(mood_entry)
    return jsonify({"id": str(result.inserted_id), "status": "success"})

@app.route('/api/mood', methods=['GET'])
@token_required
def get_mood_history(current_user):
    entries = list(db.mood_entries.find({'user_id': current_user['_id']}).sort("timestamp", -1))
    for entry in entries:
        entry['_id'] = str(entry['_id'])
    return jsonify(entries)

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    data = request.json
    message = data.get('message', '')
    
    # TODO: Implement AI response logic
    response = {
        "message": "I'm here to listen and help. Could you tell me more about how you're feeling?",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return jsonify(response)

@app.route('/api/therapeutic-response', methods=['POST'])
def generate_therapeutic_response():
    try:
        data = request.json
        journal_entry = data.get('content', '')
        
        if not journal_entry:
            return jsonify({"error": "No journal entry provided"}), 400

        # Generate response using GPT-4
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": DBT_SYSTEM_PROMPT},
                {"role": "user", "content": f"Please provide a DBT-informed response to this journal entry: {journal_entry}"}
            ],
            temperature=0.7,
            max_tokens=500
        )

        # Store the interaction in the database
        interaction = {
            "journal_entry": journal_entry,
            "therapeutic_response": response.choices[0].message.content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        db.therapeutic_responses.insert_one(interaction)

        return jsonify({
            "response": response.choices[0].message.content,
            "timestamp": interaction["timestamp"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/crisis-check', methods=['POST'])
@token_required
def check_crisis_keywords(current_user):
    try:
        data = request.json
        journal_entry = data.get('content', '').lower()
        
        if not journal_entry:
            return jsonify({"error": "No journal entry provided"}), 400

        # Check for crisis keywords
        detected_keywords = []
        recommended_exercises = set()
        
        for keyword, exercises in CRISIS_KEYWORDS.items():
            if keyword in journal_entry:
                detected_keywords.append(keyword)
                recommended_exercises.update(exercises)
        
        # Get detailed exercise information
        exercise_details = []
        for exercise in recommended_exercises:
            if exercise in GROUNDING_EXERCISES:
                exercise_details.append({
                    'name': exercise,
                    'description': GROUNDING_EXERCISES[exercise]['description'],
                    'steps': GROUNDING_EXERCISES[exercise]['steps']
                })

        response = {
            'crisis_detected': len(detected_keywords) > 0,
            'detected_keywords': detected_keywords,
            'recommended_exercises': exercise_details,
            'timestamp': datetime.utcnow().isoformat()
        }

        # If crisis is detected, store the interaction
        if response['crisis_detected']:
            crisis_interaction = {
                'user_id': current_user['_id'],
                'keywords_detected': detected_keywords,
                'exercises_recommended': [ex['name'] for ex in exercise_details],
                'timestamp': response['timestamp']
            }
            db.crisis_interactions.insert_one(crisis_interaction)

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    app.logger.error(f'Unhandled exception: {str(error)}')
    sentry_sdk.capture_exception(error)
    return jsonify({
        'error': 'An unexpected error occurred',
        'message': str(error)
    }), 500

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true', port=int(os.getenv('PORT', 5000))) 