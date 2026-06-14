# PrepMate

A single-page React interview prep app with Groq-backed question generation and feedback evaluation.

## Local dev
```bash
npm install
npm run dev
```

## Production deploy on Vercel
1. Import this folder as a Git repository in Vercel.
2. Set environment variable `GROQ_API_KEY` in the Vercel dashboard.
3. Optionally set `GROQ_MODEL` if you want a different Groq model.
4. Deploy and use the generated public URL.

## Notes
- The Groq API key stays on the server in `/api/groq.js`.
- No Anthropic / Claude code remains in this project.
