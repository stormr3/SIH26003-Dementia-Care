// caregiver.js — PIN gate + dashboard rendering
// POC note: the 7-day trend mixes mock historical points (no real
// multi-day data exists yet on a fresh install) with today's real
// figure pulled from gameHistory/taskLog/moodLog in localStorage.

const Caregiver = (() => {
  const PIN = "1234";
  const MOOD_EMOJI = { happy: "😊", okay: "😐", low: "😔" };

  function checkPin(value) {
    return value === PIN;
  }

  function buildTrend() {
    // Deterministic-looking mock history for the last 6 days...
    const mock = [62, 58, 67, 71, 65, 74];
    // ...plus today's real accuracy if the patient has played.
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const todayScore = history.length ? history[history.length - 1].accuracy : 70;
    return [...mock, todayScore];
  }

  function renderChart() {
    const svg = document.getElementById("dash-chart");
    if (!svg) return;
    const data = buildTrend();
    const w = 320, h = 140, pad = 18;
    const max = 100, min = 0;
    const stepX = (w - pad * 2) / (data.length - 1);

    const points = data.map((val, i) => {
      const x = pad + i * stepX;
      const y = h - pad - ((val - min) / (max - min)) * (h - pad * 2);
      return `${x},${y}`;
    });

    svg.innerHTML = `
      <polyline points="${points.join(" ")}" fill="none" stroke="#4A5B8C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      ${points
        .map(
          (p) =>
            `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="4" fill="#D9A441" />`
        )
        .join("")}
    `;
  }

  function renderCards() {
    const summary = Tasks.getTodaySummary();
    document.getElementById("dash-tasks").textContent = `${summary.completed} / ${summary.total}`;

    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    const lastAccuracy = history.length ? `${history[history.length - 1].accuracy}%` : "No session yet";
    document.getElementById("dash-accuracy").textContent = lastAccuracy;

    const mood = Memories.getTodayMood();
    document.getElementById("dash-mood").textContent = mood ? MOOD_EMOJI[mood] : "—";

    const missedList = document.getElementById("dash-missed");
    missedList.innerHTML = "";
    if (summary.missed.length === 0) {
      missedList.innerHTML = `<li class="none-missed">Nothing missed today 🎉</li>`;
    } else {
      summary.missed.forEach((task) => {
        const li = document.createElement("li");
        li.textContent = `${task.icon} ${task.label}`;
        missedList.appendChild(li);
      });
    }
  }

  function renderDashboard() {
    renderCards();
    renderChart();
  }

  return { checkPin, renderDashboard };
})();
