# SMARTSTUDY AI 🧠🚀

**Learn. Understand. Solve.**

SmartStudy AI is a premium, full-stack AI-powered educational platform designed specifically for school students (Classes 1–12). It provides an interactive, state-of-the-art learning experience featuring AI chat tutoring, homework assistance, dynamic quiz generation, and detailed progress tracking.

---

## 🌟 Key Features

1. **AI Chat Tutor**: Context-aware AI persona that adapts its explanation complexity based on the student's class level.
2. **Homework Solver**: Multi-modal homework help (text & image). Solves problems step-by-step using the Gemini API.
3. **Dynamic AI Quizzes**: Automatically generates quizzes based on subject, topic, and difficulty.
4. **Progress Dashboard**: Tracks quiz performance and overall study metrics.
5. **Premium UI/UX**: State-of-the-art Single Page Application (SPA) design featuring glassmorphism, dynamic gradients, responsive layouts, and smooth micro-animations.
6. **Authentication & Data Persistence**: Secure Supabase backend for user accounts, chat histories, and progress tracking.

---

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript (SPA), HTML5, Premium Custom CSS (CSS Variables, Flexbox/Grid, Animations). No heavy frontend frameworks to maintain high performance and simplicity.
- **Backend**: Node.js, Express.js.
- **Database / Auth**: Supabase (PostgreSQL).
- **AI Engine**: Google Gemini API (`@google/genai` Node.js SDK).

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18+)
- A Google Gemini API Key (Get it from [Google AI Studio](https://aistudio.google.com/))
- A Supabase Project (Get it from [Supabase](https://supabase.com/))

### 2. Setup

Clone or download the project, then install dependencies:

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example`):

```env
PORT=3000

# GEMINI API (Required)
GEMINI_API_KEY="your_gemini_api_key_here"

# SUPABASE (Required)
SUPABASE_URL="your_supabase_project_url"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
```

> **Important**: The application uses the Supabase **Service Role Key** on the backend to manage users securely via the `@supabase/supabase-js` client.

### 4. Database Setup

Go to your Supabase project dashboard -> **SQL Editor**, and run the SQL provided in:

`supabase/migrations/001_initial_schema.sql`

This will create all the necessary tables (`users`, `chats`, `messages`, `quizzes`, `progress`).

### 5. Running the Application

Start the development server:

```bash
npm run dev
```

Or start the production server:

```bash
npm start
```

Visit `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```text
SMARTKIDS-AI/
├── public/                 # Frontend assets (served statically)
│   ├── index.html          # Main SPA entry point
│   ├── style.css           # Premium Design System
│   └── script.js           # SPA Engine and logic
├── src/                    # Backend Source Code
│   ├── config/             # Environment and external service config
│   │   ├── env.config.js
│   │   └── supabase.config.js
│   ├── controllers/        # Route logic handlers
│   ├── middleware/         # Express middlewares (Auth, Uploads, Errors)
│   ├── routes/             # API Route definitions
│   ├── services/           # Core business logic (Gemini, Supabase, Prompts)
│   └── utils/              # Utility helpers
├── supabase/               # Database files
│   └── migrations/         # SQL migration scripts
├── .env.example            # Example environment variables
├── package.json            # Node.js dependencies
└── server.js               # Express application entry point
```

---

## 🔒 Security Features Built-in

- **Helmet**: Secures HTTP headers.
- **CORS**: Restricted Cross-Origin Resource Sharing.
- **Rate Limiting**: Prevents API abuse and brute-force attacks.
- **Centralized Error Handling**: Ensures safe error output without leaking stack traces to the client.
- **Multer Constraints**: Limits file uploads to 5MB and enforces specific image mime-types for multimodal homework processing.

---

*Designed and engineered as a production-ready educational startup platform.*
