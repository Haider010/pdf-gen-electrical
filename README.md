# Electrical Proposal Builder MVP

A small Next.js MVP for electrical contractors to generate editable proposal documents from a structured questionnaire.

## What is included

- Multi-step job questionnaire
- OpenAI proposal generation with a trade-specific prompt
- Local demo generation when no API key is configured
- Editable proposal draft
- Word and PDF downloads
- Simple email/password login
- Saved proposal history
- Prompt and questionnaire editing from the Settings screen
- File-backed storage for easy local iteration

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Add your OpenAI key to `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
SESSION_SECRET=replace-with-a-long-random-secret
```

The app still works without `OPENAI_API_KEY`; it generates a local demo draft so you can test the workflow immediately.

## Editable content

- `config/prompt.md` controls the main proposal-writing instructions.
- `config/questionnaire.json` controls the form steps, questions, domain notes, and proposal example tone.
- The same values are editable in the app under Settings.

## Data

Runtime data is stored in `data/db.json`, which is intentionally ignored by Git. `data/db.template.json` is used to create the database file on first run.
