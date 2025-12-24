# OpenAI Server

Secure backend service for handling OpenAI API calls.

## Setup

### 1. Install Dependencies
```bash
cd openai-server
npm install
```

### 2. Configure Environment Variables
Copy the example env file and add your OpenAI API key:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
```

**⚠️ IMPORTANT**: Never commit the `.env` file. It contains your secret API key.

### 3. Run the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and OpenAI connection status.

### Analysis
```
POST /api/analyze
```
**Body**:
```json
{
  "sessionData": {
    "rawAnswers": { "q1": "answer1", "q2": "answer2" }
  },
  "analysisType": "painPoints" | "personas" | "marketSizing" | "viability"
}
```

### Translation
```
POST /api/translate
```
**Body**:
```json
{
  "text": "Text to translate",
  "targetLanguage": "es",
  "sourceLanguage": "en"
}
```

## Security Notes

- The OpenAI API key is **only** stored in `openai-server/.env`
- It is **never** exposed to the frontend or browser
- CORS is configured to only allow requests from allowed origins
- The `.env` file is git-ignored by default

## Troubleshooting

### "OPENAI_API_KEY not configured"
Make sure you've created `.env` file with your API key.

### CORS errors
Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Port already in use
Change the PORT in `.env` to a different number.
