# Kaam Ka Sathi

**A community-powered platform for sharing useful items, finding local help, and connecting neighbors.**

Kaam Ka Sathi brings item sharing, community needs, local services, smart suggestions, and member-to-member coordination into one place. AI assists members with drafting and discovery while people stay in control of every post, conversation, and handover.

## Features

- **Share items:** Create listings with descriptions, categories, photos, and location details.
- **Post a need:** Tell the community what you are looking for and discover relevant listings.
- **Offer local services:** Publish services and help neighbors find a suitable provider.
- **Discover matches:** Browse suggested item and need matches, with optional AI ranking.
- **Coordinate safely:** Chat with members, receive notifications, and track item handovers.
- **Manage an account:** Register, sign in, update a profile, recover access, and use member/admin views.
- **Responsive interface:** Use the app on desktop or mobile, with reduced-motion preferences respected.

## AI assistance

AI features use the Gemini API from server-side routes and require a signed-in member and a configured API key:

| Feature | What it does | Member control |
| --- | --- | --- |
| Draft with AI | Turns a member's notes into a suggested title, description, and category for item, need, or service forms. | Review and edit the draft before using it. |
| Rank with AI | Reorders up to five item/need candidates using semantic relevance. | Choose which suggestion, if any, to open. |
| Check with AI | Compares a resized item photo with the entered title/category and suggests possible edits. | Review the result; it does not verify ownership, condition, authenticity, credentials, or safety. |

AI does not publish or reject content, contact members, or complete a handover. Its suggestions may be inaccurate. When a member invokes an AI feature, the relevant notes, selected match details, or resized photo are sent to Gemini. Do not include sensitive personal information. AI endpoints require authentication and apply per-user rate limits; the Gemini key stays on the server.

## Technology

- [Next.js](https://nextjs.org/) 16 App Router
- React 19, TypeScript, and Tailwind CSS
- [Supabase](https://supabase.com/) Auth, PostgreSQL, Row Level Security, Storage, and Realtime
- [Gemini API](https://ai.google.dev/) for optional AI assistance
- Leaflet and React Leaflet for location maps

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project
- A Gemini API key to enable AI assistance (optional for running the rest of the app)

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Tanya-gupta-21/Kaam-Ka-Sathi.git
   cd Kaam-Ka-Sathi
   npm ci
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local` instead. Fill in the Supabase values and, if desired, the Gemini values below.

3. Apply all SQL migrations in `supabase/migrations/` in filename order. Use the Supabase SQL editor, or link the Supabase CLI to your project and run `supabase db push`.

   **Important:** `202610200001_initial_schema.sql` is for a new, empty project. It creates the app schema, policies, storage buckets, auth/profile and notification triggers, handover and role-management functions, and Realtime publication entries. Do not apply it to a project that already has app tables until you have backed up and reviewed that database.

4. In Supabase Auth, set the local site URL to `http://localhost:3000` and configure the redirect URLs and verification options for your deployment.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key used by browser and server clients. |
| `GEMINI_API_KEY` | No | Enables authenticated AI drafting, ranking, and item-photo checks. |
| `GEMINI_MODEL` | No | Gemini model name; defaults to `gemini-flash-latest`. |

Keep secret keys out of `NEXT_PUBLIC_*` variables and out of source control. `.env.local` is ignored by Git.

## Create the first administrator

Register through the app, then promote your account from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-account@example.com';
```

Public signup metadata cannot set the admin role. In-app role changes use a protected database function.

## Development commands

```bash
npm run dev          # Start the development server
npm run lint         # Run ESLint
npx tsc --noEmit     # Check TypeScript types
npm run build        # Create a production build
npm start            # Serve a production build
```

## Data and live updates

Item images and avatars use the `item-images` and `avatars` Supabase Storage buckets. Their write policies scope uploads and deletes to the signed-in member's own folder. Chat and notification updates use Supabase Realtime.

## Contributing

Issues and pull requests are welcome. Please describe the problem or proposed change and include steps to reproduce or verify it where applicable.
