# GLAVOX_SERVER – Advanced Fluency & Speaking Analytics Backend

## Project Purpose

GLAVOX_SERVER is a robust backend system designed to help users improve their spoken English (or any language) fluency. It analyzes user speech and provides actionable feedback on:
- **Confidence**
- **Clarity**
- **Words per minute**
- **Total speaking time**
- **Session analytics** (start/end, speaking attempts, etc.)
- **Conversational AI responses** (powered by Groq API)
- **Text-to-Speech (TTS) using Amazon Polly**
- **Speech-to-Text (STT) using a custom in-house model**

This empowers users to track and accelerate their speaking skill development with real-time, AI-driven insights.

---

## Key Features & Architecture

- **Real-time AI Conversation:** Uses Groq API for fast, context-aware conversational responses.
- **Advanced Speech Analytics:** Custom ML models extract confidence, clarity, WPM, and more from user audio.
- **Session & Progress Tracking:** Every user session is logged and analyzed for deep insights.
- **Text-to-Speech (TTS):** Utilizes Amazon Polly for high-quality, natural-sounding speech synthesis.
- **Speech-to-Text (STT):** Employs a custom-built in-house model for converting speech to text.
- **Scalable, Modular Design:** Built for easy expansion and high concurrency.
- **Performance Optimized:** Implements Nginx load balancing, asynchronous processing, and efficient data pipelines for low-latency user experience.

---

## System Workflow

1. **User speaks or uploads audio.**
2. **Audio is uploaded and processed asynchronously** (using Multer and ffmpeg for fast, non-blocking I/O).
3. **Speech-to-Text (STT) is performed using OpenAI Whisper Local model.**
4. **Speech analytics are performed** (confidence, clarity, WPM, etc. via Python ML models).{
  scores
  Object
  pronunciation-70
  confidence-50
  clarity-43
  responseTime-80
  interactionFlow-92
  combined-70
  Metrics Object
  wordAccuracy-60
  phonemeAccuracy-50
  volumeLevel-100
  speakingRate-30
  pauseFrequency-2
  noiseLevel-25
  contextRelevance-100
}

5. **User message is sent to Groq API** for instant, context-aware AI response.
6. **Text-to-Speech (TTS) is generated using Amazon Polly** for natural audio feedback.
7. **Both analytics and AI response are returned to the user** in real-time.
8. **All session data and metrics are stored in MongoDB** for analytics and progress tracking.
9. **System is horizontally scalable** (multiple Node.js/Python workers, Nginx load balancer ready).

---

## Why These Technologies? (With Advanced Justification)

| Component         | What It Does                        | Why Used / Performance Benefit                                  |
|-------------------|-------------------------------------|-----------------------------------------------------------------|
| **Groq API**      | Generates AI chat responses         | fast, scalable, context-rich conversational AI            |
| **Amazon Polly (TTS)** | Text-to-speech synthesis       | High-quality, natural-sounding speech, reliable cloud service   |
| **Whisper STT Model** | Speech-to-text conversion        | Full control, privacy, and adaptability for speech recognition  |
| **Python (ML)**   | Audio analysis, extracts metrics    | Efficient, GPU-accelerated ML for real-time analytics           |
| **Node.js/Express**| API server, orchestrates workflow  | Non-blocking, event-driven, ideal for high-concurrency APIs     |
| **MongoDB**       | Stores all data                     | NoSQL, horizontally scalable, handles large analytics datasets  |
| **Multer**        | Handles audio uploads               | Streams files, prevents memory bottlenecks                      |
| **ffmpeg**        | Gets audio duration, quality        | Fast, reliable, works with large files asynchronously           |
| **Custom Scripts**| Extracts confidence, clarity, WPM   | Tailored, optimized for project needs                           |
| **Nginx Load Balancer** | Distributes API traffic        | Ensures high availability and low latency under heavy load      |
| **Async Processing**| Handles heavy tasks in background | Keeps API responses fast, user never waits for analysis         |

---

## Performance & Scalability

- **Nginx Load Balancing:**  
  The system is designed to run behind an Nginx load balancer, distributing incoming API requests across multiple Node.js and Python workers. This ensures high availability and consistent low-latency responses, even under heavy user load.

- **How Nginx Load Balancer Works:**  
  - Multiple backend instances (Node.js API servers and Python ML workers) run in parallel.
  - Nginx receives all incoming requests.
  - It checks which backend server is least busy or available and forwards the request there.
  - If a server is overloaded or fails, Nginx automatically routes new requests to healthy servers.
  - This setup allows the system to scale horizontally (add more servers as needed) and ensures zero downtime.

  **Example Setup:**
  ```
  User Request
      |
      v
  [Nginx Load Balancer]
     /   |   \
  [API1][API2][API3]   (Node.js/Express servers)
     \   |   /
   [Python ML Workers]  (for heavy ML tasks)
  ```

- **Asynchronous Processing:**  
  All heavy tasks (audio upload, ML inference, Groq API calls) are handled asynchronously. This means the server can process multiple requests in parallel, maximizing throughput and minimizing user wait time.

- **Horizontal Scalability:**  
  Both the Node.js API and Python ML services can be scaled horizontally (run on multiple servers/containers). MongoDB's sharding and replica sets further support scaling and data reliability.

- **Optimized Data Pipelines:**  
  Audio files are streamed and processed in chunks, preventing memory overload. Analytics and AI responses are generated in parallel, ensuring the user gets feedback and conversation instantly.

- **Caching & Rate Limiting:**  
  Frequently requested analytics or AI responses can be cached (e.g., Redis), and rate limiting is implemented to prevent abuse and ensure fair usage.

---

## AI Response Generation (Groq API)

- **How it works:**  
  When a user sends a message or speaks, the backend forwards this input to the Groq API. Groq's advanced LLM generates a fast, context-aware response, which is sent back to the user in real-time.
- **Why Groq?**  
  Groq is chosen for its ultra-low latency, high throughput, and ability to handle complex, multi-turn conversations at scale.
- **Integration:**  
  The Groq API is called from the Node.js backend, and its responses are combined with the user's speech analytics for a seamless, interactive experience.

---

## Model Training & Dataset Details

### How Models Are Trained

- **Sign Language Recognition Model (CNN):**
  - **Dataset Source:**  
    - [ASL Alphabet Dataset (Kaggle)](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)
    - [Sign Language MNIST](https://www.kaggle.com/datasets/danrasband/asl-alphabet-test)
  - **Training Process:**  
    - Images of hand gestures (A-Z) are preprocessed (resized, normalized).
    - A custom Convolutional Neural Network (CNN) is trained using PyTorch.
    - The model learns to classify each image into the correct letter.
    - Training scripts: `ml_models/sign_language_cnn/train.py` and `train_cnn.py`
    - After training, the model is saved in `ml_models/sign_language_cnn/model.py`.

- **Text-to-Speech (TTS) Model:**
  - **Service Used:**  
    - Amazon Polly (cloud-based TTS)
  - **Why:**  
    - Provides high-quality, natural-sounding speech output with support for multiple languages and voices.
    - Scalable and reliable for production use.

- **Speech-to-Text (STT) Model:**
  - **Model Type:**  
    - Custom in-house model built and trained specifically for this project.
  - **Why:**  
    - Offers full control over the speech recognition pipeline, ensures privacy, and allows for custom tuning and improvements.

- **Speech Analytics (Confidence, Clarity, WPM):**
  - **How:**  
    - Audio is processed using ffmpeg and custom Python scripts.
    - Speech-to-text is performed using the in-house STT model.
    - Confidence and clarity are calculated based on audio features and ML models.
    - Words per minute is calculated from the transcript and duration.

### Why This Approach?

- **Open Datasets:**  
  - Public datasets ensure reproducibility and allow for further improvement.
- **Custom Training:**  
  - Models are trained in-house for full control, privacy, and adaptability.
- **Easy Retraining:**  
  - If new data is available, models can be retrained using the same scripts.

---

## Project Structure (Key Parts)

```
GLAVOX_SERVER/
│
├── ml_models/                # AI models (sign language, TTS, speech analytics)
│   ├── sign_language_cnn/
│   └── tts_model/
│
├── video_processing/         # Hand/gesture detection scripts
├── text_to_speech/           # Speech synthesis code
├── src/
│   ├── controllers/          # API logic (analytics, auth, Groq integration)
│   ├── models/               # Database models (User, Session, Analytics)
│   ├── routes/               # API endpoints
│   └── utils/                # Helper functions
│
├── uploads/                  # Uploaded audio files
├── public/                   # Static files (e.g., generated audio)
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
├── main.py                   # Python entry point
├── server.js                 # Node.js entry point
```

---

## How to Set Up & Run

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/glavox.git
cd glavox/GLAVOX_SERVER
```

### 2. Install Python Dependencies

```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Install Node.js Dependencies

```bash
npm install
```

### 4. Train the AI Models

- **Sign Language Model:**
  ```bash
  python train_cnn.py
  ```
- **Text-to-Speech Model:**
  ```bash
  python train_tts.py
  ```

### 5. Start the Backend Server

```bash
# For Python backend (AI models, etc.)
python main.py

# For Node.js backend (APIs, session tracking, Groq integration, etc.)
node server.js
```

### 6. (Optional) Deploy with Nginx Load Balancer

- Use **Nginx** to distribute traffic across multiple backend instances for high availability and fast response.

#### Example: Simple Nginx Load Balancer Setup

1. **Install Nginx** (Linux example):
   ```bash
   sudo apt update
   sudo apt install nginx
   ```
2. **Edit Nginx config** (e.g., `/etc/nginx/nginx.conf`):
   ```nginx
   http {
       upstream glavox_backend {
           server 127.0.0.1:3000;
           server 127.0.0.1:3001;
           # Add more backend servers as needed
       }

       server {
           listen 80;
           location / {
               proxy_pass http://glavox_backend;
               proxy_set_header Host $host;
               proxy_set_header X-Real-IP $remote_addr;
           }
       }
   }
   ```
3. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

Now, Nginx will automatically distribute incoming requests to your running backend servers (e.g., Node.js on ports 3000, 3001, etc.).

---

## Datasets Used

- **Sign Language:** [ASL Alphabet Dataset](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)
- **Sign Language MNIST:** [Sign Language MNIST](https://www.kaggle.com/datasets/danrasband/asl-alphabet-test)
- **Audio for TTS:** [LibriSpeech](https://www.openslr.org/12/)
- **Audio for TTS:** [VCTK Corpus](https://datashare.ed.ac.uk/handle/10283/3443)

---

## Need Help?

- Check code comments for more details.
- For model/data questions, see the `ml_models/` and `video_processing/` folders.
- For API usage, see the `src/routes/` and `src/controllers/` folders.

---

## Scaling the System

To ensure the backend can handle high traffic and many users at once, I implemented horizontal scaling using multiple backend instances and Nginx load balancing. Here's how I did it:

### 1. Running Multiple Backend Instances

I run several Node.js servers on different ports (or machines/containers):
```bash
node server.js --port=3000
node server.js --port=3001
# ...add more as needed
```
Similarly, I can run multiple Python ML service instances for heavy processing.

### 2. Nginx Load Balancer

I use Nginx as a load balancer. My `nginx.conf` lists all backend servers in the `upstream` block. Nginx automatically distributes incoming requests to all available servers, keeping the system fast and reliable.

### 3. Scaling Python ML Services

For ML-heavy tasks, I run multiple Python (main.py) instances. Node.js can send requests to any available Python worker, distributing the load.

### 4. (Optional) Docker & Kubernetes

For even easier scaling and deployment, I use Docker Compose or Kubernetes. This lets me spin up as many containers as needed, and manage them efficiently.

### 5. Database Scaling

I run MongoDB in replica set or sharded mode, so the database can handle more requests and stay highly available.

### 6. Monitoring & Auto-Scaling

I use tools like PM2, Docker Swarm, or Kubernetes HPA for process management and auto-scaling. For monitoring, Grafana and Prometheus help me track system health and performance.

---

### Example: Local Scaling with Nginx

1. Start 2-3 Node.js servers (e.g., on ports 3000, 3001, 3002).
2. Add all server addresses to the Nginx config (`nginx.conf`).
3. Restart Nginx.
4. Now, Nginx will distribute all incoming requests across your backend servers automatically.

---

### Scaling Summary Table

| Step                | Tool/Tech         | Purpose                        |
|---------------------|------------------|--------------------------------|
| Multiple servers    | Node.js, Python  | Handle more requests           |
| Load balancing      | Nginx            | Distribute traffic             |
| Containerization    | Docker/K8s       | Easy deployment & scaling      |
| DB scaling          | MongoDB Replica  | High availability, no bottlenecks |
| Monitoring          | Grafana/Prometheus| Track health, auto-scale      |

---

This approach keeps the system fast, reliable, and ready for growth. If you want to see a Docker Compose or PM2 example, just let me know!

---
