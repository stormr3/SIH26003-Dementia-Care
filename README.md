# Smriti — SIH26003 Proof of Concept

**Team:** CTRL_FREAKS

Cognitive care companion for elderly dementia patients in the North Eastern Region — patient portal (games, tasks, memories) + caregiver dashboard.

This is the **internal-hackathon POC**: one working game, core navigation, and a caregiver dashboard, built to demonstrate the full concept described in the problem statement without building all four games / full backend / real ML in one night.

## Run it

No build step, no dependencies. Just open `index.html` in a browser, or serve the folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

First launch asks for the patient's name and a caregiver PIN (this is now real, not hardcoded). Use the "Reset demo profile" link on the landing screen to re-run onboarding for repeat demos.

## Structure

```
sih26003-poc/
├── index.html          All screens (onboarding, welcome, landing, patient tabs, caregiver PIN + dashboard)
├── manifest.json        PWA install config
├── sw.js                Service worker — cache-first offline support
├── icons/                App icons (svg + png, 192/512)
├── css/
│   └── style.css        Design tokens + layout
└── js/
    ├── profile.js         First-run patient name + caregiver PIN
    ├── voice.js           Web Speech API wrapper (voice-guidance button)
    ├── game.js            Memory-match game + recall-based adaptive difficulty + photo personalization
    ├── tasks.js           Caregiver-editable task list (localStorage-backed)
    ├── reminders.js        Time-based task reminders (in-app toast / OS notification)
    ├── memories.js        Memories/Songs hub + mood check-in
    ├── caregiver.js        PIN check, dashboard, task manager, photo upload
    └── app.js             Screen/tab routing, onboarding + welcome flow, wires all modules together
```

**Note on testing offline/install:** service workers and "Add to Home Screen" only work over `https://` or true `localhost` — a LAN IP like `http://192.168.x.x` will silently fail both. Use `http://localhost:PORT` on the same machine, or deploy to GitHub Pages for phone testing.

## What's real vs. mocked in this POC

| Feature | POC | Full build (see tech stack doc) |
|---|---|---|
| Cognitive games | 1 of 4 (Memory Match), with optional photo personalization | All 4 games |
| Adaptive difficulty | Hardcoded accuracy threshold, using a real recall-vs-guess accuracy metric | ML-based Adaptive Behaviour Engine (latency, hesitation, error clustering) |
| Voice guidance | Web Speech API (English) | Pre-recorded native audio in Assamese/Bengali/Bodo/Manipuri via Bhashini TTS |
| Multilingual UI | English only | Bhashini-translated static UI strings, NER languages |
| Data storage | Browser localStorage | IndexedDB (Dexie) on-device + PostgreSQL backend sync |
| Caregiver auth | PIN set during first-run onboarding | Proper account auth (Firebase/JWT) |
| Task reminders | In-app toast (or OS notification if backgrounded), checked every 20s | Push notifications via backend scheduler |
| Offline support | Service worker caches full app shell — works with no connectivity after first load | Same principle, extended to full data sync on reconnect |
| Memories/Songs content | Placeholder cards, spoken confirmation | Real family-uploaded photos/audio, regional music library |
| Dashboard trend | Mock 6-day history + today's real session | Full historical analytics from backend |
| Multi-device sync | None — single device/browser only | Backend sync layer, deliberately out of scope for this POC |

## Why this scope

The internal hackathon deadline meant picking depth over breadth: every core *screen and interaction pattern* from the problem statement exists and works end-to-end (patient/caregiver split, bottom nav, one full game loop, task tracking, mood check-in, dashboard with a real chart), so the judges can see the actual product shape — while the repeated content (3 more games, more languages) is explicitly scoped as next-phase work in the pitch deck.
