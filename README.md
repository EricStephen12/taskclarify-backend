# TaskClarify Backend

Backend API for TaskClarify mobile app with stub integrations.

## Quick Setup

1. Copy all files from `backend-files` to `../taskclarify-backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your Supabase credentials
4. Run development server:
   ```bash
   npm run dev
   ```

Server runs on http://localhost:3001

## Update Mobile App

In `taskclarify-mobile/.env.local`, add:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints

All endpoints return stub responses for testing:

- `GET /api/health` - Health check
- `GET /api/usage` - Check user usage
- `POST /api/usage` - Increment usage
- `POST /api/integrations/canva` - Canva designs (demo)
- `POST /api/integrations/google` - Google Workspace (demo)
- `POST /api/integrations/gmail` - Gmail campaigns (demo)
- `POST /api/integrations/calendar` - Calendar events (demo)
- `POST /api/integrations/social` - Social posts (demo)
- `POST /api/integrations/invoice` - Invoices (demo)

All integration endpoints require Bearer token authentication.

## Test It

1. Start backend: `npm run dev`
2. Start mobile app: `npx expo start`
3. Try creating something in the app
4. You'll see "demo mode" responses

## Deploy to Vercel

```bash
vercel
```

Then update mobile app with production URL.
