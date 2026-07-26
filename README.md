<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1a4e3ed7-9bb4-4bb8-88f1-c0e113e21ad3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Vocabulary Dataset

The full library of 10,793 words (with definitions, CEFR level, part of speech,
synonym/antonym, category, difficulty, and Lao/Thai translations) lives at
`src/data/vocabulary_full.json` and is loaded as `INITIAL_VOCABULARY` from
`src/lib/sampleData.ts`. It becomes the default word list on first load
(before any localStorage/Firestore data exists) and is what gets auto-seeded
into the `words` collection in Firestore the first time the app runs against
an empty database.

## Deploying to Vercel via GitHub

1. Push this repository to GitHub (see steps in the chat response).
2. Go to https://vercel.com/new and choose "Import Git Repository".
3. Select this GitHub repo. Vercel will auto-detect the Vite framework preset.
4. Add any required environment variables from `.env.example` (Firebase config,
   Gemini API key, etc.) in the Vercel project's Settings → Environment Variables.
5. Deploy. `vercel.json` already contains the SPA rewrite rule so client-side
   routing works correctly on Vercel.
