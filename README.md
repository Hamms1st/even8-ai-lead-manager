# Even8 AI Event Lead Manager

A small full-stack application for capturing, managing, and following up with leads collected at business events.

Built as part of the Even8 AI Native Full Stack Intern technical assignment.

## Features

- Add, edit, and delete event leads
- Search leads by name, company, email, or event
- Filter leads by follow-up status
- Sort leads by date, name, or company
- Track lead status through:
  - New
  - Contacted
  - Qualified
  - Follow-up
  - Converted
  - Lost
- Dashboard metrics for lead pipeline status
- AI-generated lead summaries and recommended next actions
- AI analysis for individual leads
- AI-generated follow-up email drafts
- AI-generated engagement strategies
- Responsive dark-mode interface

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- Google Gemini API
- Vercel for deployment

## Local Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd ai_native
npm install
```

Create a `.env.local` file in the project root and configure the required environment variables:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
GEMINI_API_KEY=
```

Then start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Key Decisions

**Next.js full-stack architecture**  
Next.js App Router is used for both the frontend and API routes so the application can remain simple and contained in a single project.

**Supabase PostgreSQL**  
Supabase provides persistent PostgreSQL storage for lead information while keeping database integration straightforward.

**Server-side AI requests**  
AI requests are handled through a server-side API route so the AI API key is never exposed to the browser.

**Server-side database credentials**  
Sensitive Supabase credentials are kept in environment variables and are not exposed to the client.

**Simple lead workflow**  
Lead statuses represent the main stages of an event follow-up workflow without introducing unnecessary CRM complexity.

## API Routes

- `GET /api/leads` — retrieve leads
- `POST /api/leads` — create a lead
- `PATCH /api/leads` — update a lead
- `DELETE /api/leads` — delete a lead
- `POST /api/ai` — generate AI-assisted responses

## Deployment

The application is deployed on Vercel.

**Live Application:** https://even8-ai-lead-manager.vercel.app