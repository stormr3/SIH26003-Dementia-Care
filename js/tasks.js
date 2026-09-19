// tasks.js — Daily routine / reminder checklist

const Tasks = (() => {
  const DEFAULT_TASKS = [
    { id: "medicine", label: "Take morning medicine", icon: "💊" },
    { id: "water", label: "Drink a glass of water", icon: "💧" },
    { id: "walk", label: "Afternoon walk", icon: "🚶" },
    { id: "appointment", label: "Doctor's appointment reminder", icon: "🩺" },
  ];

  function todayKey() {
    return `taskLog:${new Date().toISOString().slice(0, 10)}`;
  }

  function getDoneMap() {
    return JSON.parse(localStorage.getItem(todayKey()) || "{}");
  }

  function saveDoneMap(map) {
    localStorage.setItem(todayKey(), JSON.stringify(map));
  }

  function render() {
    const list = document.getElementById("task-list");
    if (!list) return;
    const done = getDoneMap();
    list.innerHTML = "";

    DEFAULT_TASKS.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (done[task.id] ? " done" : "");
      li.innerHTML = `
        <span class="task-check">${done[task.id] ? "✓" : ""}</span>
        <span class="task-label">${task.icon} ${task.label}</span>
      `;
      li.addEventListener("click", () => toggle(task));
      list.appendChild(li);
    });
  }

  function toggle(task) {
    const done = getDoneMap();
    done[task.id] = !done[task.id];
    saveDoneMap(done);
    if (done[task.id]) Voice.speak(`${task.label} marked done. Well done!`);
    render();
  }

  // Used by the caregiver dashboard.
  function getTodaySummary() {
    const done = getDoneMap();
    const completed = DEFAULT_TASKS.filter((t) => done[t.id]);
    const missed = DEFAULT_TASKS.filter((t) => !done[t.id]);
    return { total: DEFAULT_TASKS.length, completed: completed.length, missed };
  }

  function init() {
    render();
  }

  return { init, getTodaySummary };
})();
