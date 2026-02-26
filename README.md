# Smart Farm Intelligence Dashboard

A **Next.js 14** dashboard application featuring a dark, modern industrial UI and Firebase authentication.

## Pages

- Dashboard
- Nodes
- Market Intelligence
- Storage
- Alerts

## Features

- Next.js 14 App Router + TypeScript
- Tailwind CSS with industrial dark dashboard styling
- Sidebar layout with active navigation states
- Firebase Authentication (Google sign-in)
- Node assignment form (crop type + storage date) saved to Firestore
- Shared command header with auth status/actions

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with Firebase Web app credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Start development server:

```bash
npm run dev
```

Then open `http://localhost:3000` (redirects to `/dashboard`).

## Firestore data

Node assignment form writes to collection `nodeAssignments` with document id equal to `nodeId`.
