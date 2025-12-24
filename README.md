# Product Clarity Workspace

A guided interview and documentation generation tool that helps product teams articulate their product vision through a structured Q&A process, automatic analysis, and multi-language document generation.

## Overview

Product Clarity Workspace streamlines the product definition process by:
- **Guided Interview**: Step-by-step questions to capture product insights
- **AI-Powered Analysis**: Automatic extraction of pain points, personas, market sizing, and viability
- **Live Preview**: Real-time document generation as you answer questions
- **Multi-Language Support**: Generate documents in English, Spanish, French, and German
- **Export Options**: Export to Markdown, DOCX, or PDF formats
- **Provenance Tracking**: See which answers informed each insight with hover tooltips

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
```bash
cd /Volumes/S Drive/Projects/fortune_planner/FortunePlanner
```

2. **Install frontend dependencies**
```bash
cd product-clarity-workspace
npm install
```

3. **Install backend dependencies** (for AI features)
```bash
cd ../openai-server
npm install
```

4. **Configure environment variables**

**Frontend** (`.env.local`):
```bash
cd product-clarity-workspace
cp .env.local.example .env.local
# Edit .env.local if needed (default: http://localhost:4000)
```

**Backend** (`.env`):
```bash
cd openai-server
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### Running the Application

**Option 1: Run Everything**
```bash
# Terminal 1 - Frontend
cd product-clarity-workspace
npm run dev

# Terminal 2 - Backend (optional, for AI features)
cd openai-server
npm run dev
```

**Option 2: Frontend Only**
```bash
cd product-clarity-workspace
npm run dev
```

Then open **http://localhost:5173** in your browser.

## How to Use

### 1. Start the Interview
- The app loads with a guided interview panel on the left
- Questions are organized by category (Problem, Solution, Market, etc.)
- Answer questions one by one - required fields are marked

### 2. Answer Questions
- Type your answers in the input fields
- Use the validation hints to ensure answers meet requirements
- Click **Next** to proceed or **Skip** for optional questions
- Click **Back** to review previous answers

### 3. Watch the Preview Update
- The right panel shows a live preview of your product brief
- Updates automatically as you answer questions
- Hover over insights to see their provenance (which answers they came from)
- Underlined text indicates AI-generated content with low/medium confidence

### 4. Complete the Interview
- On the last question, click **Finish**
- See the completion screen confirming your interview is done
- Your session is automatically saved to localStorage

### 5. Export Your Document
- Choose your preferred language from the dropdown (EN, ES, FR, DE)
- Click **Export As...** and select format:
  - **Markdown (.md)**: Plain text with formatting
  - **Word (.docx)**: Coming soon
  - **PDF (.pdf)**: Coming soon

## Features

### Guided Interview
- **Smart Question Flow**: Questions adapt based on your answers
- **Validation**: Real-time feedback on required fields
- **Progress Tracking**: Visual progress bar and completion counter
- **Session Persistence**: Answers saved automatically to localStorage

### AI Analysis (with OpenAI backend)
- **Pain Points**: Identifies key problems from your answers
- **Personas**: Extracts target user profiles
- **Market Sizing**: Estimates TAM/SAM/SOM
- **Viability**: Assesses feasibility and risks

### Document Generation
- **Live Preview**: See your document update in real-time
- **Multi-Language**: Switch between languages instantly
- **Fallback Translation**: Auto-translates templates that don't exist in target language
- **User Overrides**: Edit any section and preserve your changes

### Provenance & Uncertainty
- **Visual Indicators**: Dotted underlines show uncertain content
- **Hover Tooltips**: See which answers and assumptions informed each insight
- **Confidence Levels**: High/medium/low confidence indicators

### Performance & Security
- **Fast**: < 500ms regeneration time, < 2s initial load
- **Secure**: XSS protection with HTML sanitization
- **Dev Logging**: Performance metrics in browser console (dev mode only)

## Architecture

```
FortunePlanner/
├── product-clarity-workspace/    # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── interview/        # Guided interview panel
│   │   │   └── preview/          # Document preview panel
│   │   ├── config/               # Questions, blueprints, types
│   │   ├── engine/               # Analysis, validation, translation
│   │   ├── services/             # API clients
│   │   ├── state/                # Zustand store
│   │   ├── templates/            # Handlebars templates
│   │   └── utils/                # Helpers (sanitize, perf monitor)
│   └── public/
│       └── config/               # Template files (.hbs)
│
└── openai-server/                # Backend (Express + OpenAI)
    └── src/
        ├── server.ts             # Express server
        └── types.ts              # Request/response types
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Vite, Zustand, Handlebars
- **Backend**: Express, OpenAI SDK, TypeScript
- **Styling**: Tailwind CSS
- **Storage**: localStorage for session persistence

## Development

### Frontend Development
```bash
cd product-clarity-workspace
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd openai-server
npm run dev          # Start with ts-node (hot reload)
npm run build        # Compile TypeScript
npm start            # Run compiled JavaScript
```

### Adding New Questions
1. Edit `public/config/questions/index.json`
2. Add question definition with validation rules
3. Questions auto-appear in the interview flow

### Creating New Templates
1. Create `.hbs` file in `public/config/templates/`
2. Add entry to `public/config/templates/index.json`
3. Use Handlebars syntax: `{{variable}}` for escaped, `{{{html}}}` for raw HTML

### Adding New Languages
1. Create localized template: `template-name.{locale}.hbs`
2. Add to `index.json` with `locale` field
3. Add language option to preview panel dropdown

## Troubleshooting

### Frontend won't start
- Check Node version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### Backend connection errors
- Ensure backend is running on port 4000
- Check `VITE_API_BASE_URL` in frontend `.env.local`
- Verify `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL

### OpenAI API errors
- Verify API key in `openai-server/.env`
- Check account has credits: https://platform.openai.com/usage
- Review backend logs for detailed error messages

### Preview not updating
- Check browser console for errors
- Verify answers are being saved (check Application > LocalStorage)
- Try refreshing the page to reload state

### Export not working
- DOCX/PDF export are placeholder implementations currently
- Use Markdown export which is fully functional
- Check browser console for export errors

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:4000
```

**Backend** (`.env`):
```
OPENAI_API_KEY=sk-your-key-here
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
```

### Customization

**Change App Title**: Edit `index.html` and `App.tsx`

**Modify Styling**: Edit `src/index.css` or component-specific Tailwind classes

**Adjust Performance Targets**: See `src/utils/perfMonitor.ts`

## Security

- **API Key Safety**: OpenAI key never exposed to frontend
- **XSS Protection**: All user input sanitized before rendering
- **CORS**: Backend only accepts requests from allowed origins
- **No External Calls**: All data stays on your machine except OpenAI API calls

## License

This project is not proprietary software. 

## Contributing

For internal development only. See development guide above.

## 📞 Support

For issues or questions, contact the development team.

---

**Version**: 0.6.0  
**Last Updated**: December 2025
