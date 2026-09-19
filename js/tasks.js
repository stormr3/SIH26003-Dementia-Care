// tasks.js — Daily routine / reminder checklist
// Tasks are now caregiver-editable, not hardcoded. Definitions live in
// localStorage ("taskDefs"); today's completion state is tracked
// separately per day so history isn't lost when a day rolls over.

const Tasks = (() => {
  const DEFAULT_TASKS = [
    { id: "medicine", label: "Take morning medicine", icon: "💊", time: "08:00" },
    { id: "water", label: "Drink a glass of water", icon: "💧", time: "" },
    { id: "walk", label: "Afternoon walk", icon: "🚶", time: "16:00" },
    { id: "appointment", label: "Doctor's appointment reminder", icon: "🩺", time: "" },
  ];

  function ensureSeeded() {
    if (!localStorage.getItem("taskDefs")) {
      localStorage.setItem("taskDefs", JSON.stringify(DEFAULT_TASKS));
    }
  }

  function getAllTaskDefs() {
    ensureSeeded();
    return JSON.parse(localStorage.getItem("taskDefs") || "[]");
  }

  function saveTaskDefs(defs) {
    localStorage.setItem("taskDefs", JSON.stringify(defs));
  }

  function addTaskDef(label, icon, time) {
    const defs = getAllTaskDefs();
    defs.push({ id: `task-${Date.now()}`, label, icon: icon || "🗒️", time: time || "" });
    saveTaskDefs(defs);
  }

  function removeTaskDef(id) {
    saveTaskDefs(getAllTaskDefs().filter((t) => t.id !== id));
  }

  function todayKey() {
    return `taskLog:${new Date().toISOString().slice(0, 10)}`;
  }

  function getDoneMap() {
    return JSON.parse(localStorage.getItem(todayKey()) || "{}");
  }

  function saveDoneMap(map) {
    localStorage.setItem(todayKey(), JSON.stringify(map));
  }

  function isDone(taskId) {
    return !!getDoneMap()[taskId];
  }

  function render() {
    const list = document.getElementById("task-list");
    if (!list) return;
    const done = getDoneMap();
    const defs = getAllTaskDefs();
    list.innerHTML = "";

    if (defs.length === 0) {
      list.innerHTML = `<li class="task-empty">No tasks yet — your caregiver can add some.</li>`;
      return;
    }

    defs.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (done[task.id] ? " done" : "");
      li.innerHTML = `
        <span class="task-check">${done[task.id] ? "✓" : ""}</span>
        <span class="task-label">${task.icon} ${task.label}${task.time ? ` <span class="task-time">· ${task.time}</span>` : ""}</span>
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

  function getTodaySummary() {
    const done = getDoneMap();
    const defs = getAllTaskDefs();
    const completed = defs.filter((t) => done[t.id]);
    const missed = defs.filter((t) => !done[t.id]);
    return { total: defs.length, completed: completed.length, missed };
  }

  function init() {
    render();
  }

  return { init, getTodaySummary, getAllTaskDefs, addTaskDef, removeTaskDef, isDone, render };
})();
