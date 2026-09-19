// memories.js — Memories & Songs hub + mood check-in
// POC note: memory cards speak a placeholder line instead of playing
// real audio/photos. Production version wires these to actual family
// uploads (photos, voice notes) and a regional-music library.

const Memories = (() => {
  function initMemoryCards() {
    document.querySelectorAll(".memory-card").forEach((card) => {
      card.addEventListener("click", () => Voice.speak(card.dataset.say));
    });
  }

  function initMoodCheckin() {
    const confirmEl = document.getElementById("mood-confirm");
    document.querySelectorAll(".mood-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mood = btn.dataset.mood;
        const log = JSON.parse(localStorage.getItem("moodLog") || "[]");
        log.push({ date: new Date().toISOString(), mood });
        localStorage.setItem("moodLog", JSON.stringify(log.slice(-30)));

        const messages = {
          happy: "Glad to hear you're feeling happy today!",
          okay: "Thanks for letting us know. Take it easy today.",
          low: "Thank you for sharing. Your caregiver has been notified.",
        };
        confirmEl.textContent = "Thank you — mood recorded.";
        Voice.speak(messages[mood]);
      });
    });
  }

  function getTodayMood() {
    const log = JSON.parse(localStorage.getItem("moodLog") || "[]");
    const today = new Date().toISOString().slice(0, 10);
    const todays = log.filter((e) => e.date.slice(0, 10) === today);
    if (!todays.length) return null;
    return todays[todays.length - 1].mood;
  }

  function init() {
    initMemoryCards();
    initMoodCheckin();
  }

  return { init, getTodayMood };
})();
