# ChatGPT Bro

A full-stack AI agent project using React, Node.js, Express, MongoDB, and the Google Gemini API.

## Folder Structure

```
/chatpati
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   ├── models/
│   │   └── Chat.js
│   └── routes/
│       └── chatRoutes.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── Chat.jsx
        ├── api.js
        └── index.css
```

## Setup Steps (Local Development)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update to your actual API keys in `.env`:
   - `MONGO_URI`
   - `GEMINI_API_KEY`
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Deployment Steps

### Backend Deployment (Render)
1. Push your code to a GitHub repository.
2. Go to [Render](https://render.com/), sign in, and click **New > Web Service**.
3. Connect your GitHub repository.
4. Set the following:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `PORT`: `5000` (Optional but good practice)
   - `MONGO_URI`: `your_production_mongo_connection_string`
   - `GEMINI_API_KEY`: `your_gemini_api_key`
6. Click **Create Web Service**. Wait for it to build and get your backend URL.

### Frontend Deployment (Vercel)
1. Go to your frontend code, specifically `frontend/src/api.js`.
2. Update the `VITE_API_URL` environment variable on Vercel to your new Render backend URL (e.g., `https://your-backend.onrender.com`). The application now handles adding the `/api` prefix automatically.
3. Push these changes to your GitHub repository.
4. Go to [Vercel](https://vercel.com/), sign in, and click **Add New > Project**.
5. Import your GitHub repository.
6. Set the following:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
7. (Optional) Under **Environment Variables**, you can add `VITE_API_URL` to point to your deployed Render URL.
8. Click **Deploy**.

## Features Supported
- **Conversation Memory**: Chat history is persistently stored in MongoDB.
- **System Personality**: Advanced AI Prompt defining standard behavior.
- **Tool Calling (Simulation)**: Type "calculate [math]" or "search [query]" to activate specific tools simulated on the backend.
- **Modern UI**: Full dark-mode responsive design mimicking a premium chat experience.
