from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import whisper
import uuid
from flask import send_from_directory

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load Whisper model once
model = whisper.load_model("base")  # You can use "tiny", "base", "small", "medium", or "large"

@app.route('/api/ai/transcribe', methods=['POST'])
def transcribe_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    if not audio_file:
        return jsonify({'error': 'Empty file'}), 400

    # Save audio temporarily
    filename = f"{uuid.uuid4().hex}.m4a"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    audio_file.save(filepath)

    try:
        result = model.transcribe(filepath)
        return jsonify({'text': result['text']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        os.remove(filepath)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
