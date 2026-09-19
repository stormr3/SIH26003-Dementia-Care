# Sahayak — SIH26003 Proof of Concept

Cognitive care companion for elderly dementia patients in the North Eastern Region — patient portal (games, tasks, memories) + caregiver dashboard.

This is the **internal-hackathon POC**: one working game, core navigation, and a caregiver dashboard, built to demonstrate the full concept described in the problem statement without building all four games / full backend / real ML in one night.

## Run it

No build step, no dependencies. Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Caregiver PIN for the demo: **1234**

## Structure

```
sih26003-poc/
├── index.html          All screens (landing, patient tabs, caregiver PIN + dashboard)
├── css/
│   └── style.css        Design tokens + layout
└── js/
    ├── voice.js          Web Speech API wrapper (voice-guidance button)
    ├── game.js           Memory-match game + hardcoded adaptive difficulty
    ├── tasks.js           Daily routine checklist (localStorage-backed)
    ├── memories.js        Memories/Songs hub + mood check-in
    ├── caregiver.js        PIN check + dashboard rendering
    └── app.js             Screen/tab routing, wires all modules together
```

## What's real vs. mocked in this POC

| Feature | POC | Full build (see tech stack doc) |
|---|---|---|
| Cognitive games | 1 of 4 (Memory Match) | All 4 games |
| Adaptive difficulty | Hardcoded accuracy threshold | ML-based Adaptive Behaviour Engine (latency, hesitation, error clustering) |
| Voice guidance | Web Speech API (English) | Pre-recorded native audio in Assamese/Bengali/Khasi/Manipuri |
| Multilingual UI | English only | i18next-driven, NER languages |
| Data storage | Browser localStorage | IndexedDB (Dexie) on-device + PostgreSQL backend sync |
| Caregiver auth | Static 4-digit PIN | Proper account auth (Firebase/JWT) |
| Memories/Songs content | Placeholder cards, spoken confirmation | Real family-uploaded photos/audio, regional music library |
| Dashboard trend | Mock 6-day history + today's real session | Full historical analytics from backend |

## Why this scope

The internal hackathon deadline meant picking depth over breadth: every core *screen and interaction pattern* from the problem statement exists and works end-to-end (patient/caregiver split, bottom nav, one full game loop, task tracking, mood check-in, dashboard with a real chart), so the judges can see the actual product shape — while the repeated content (3 more games, more languages) is explicitly scoped as next-phase work in the pitch deck.
