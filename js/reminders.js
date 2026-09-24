// reminders.js — fires a reminder when a task's scheduled time arrives.
// Checked every 20s against the current HH:MM. Each task only fires once
// per day (tracked in reminderLog:<date>), and never fires for a task
// already marked done. If the app is open and visible we show an in-app
// toast (most reliable for a live demo); otherwise, if permission was
// granted, we fall back to a real OS notification.

const Reminders = (() => {
  const CHECK_INTERVAL_MS = 20000;
  let timer = null;

  function todayKey() {
    return `reminderLog:${new Date().toISOString().slice(0, 10)}`;
  }

  function getFiredToday() {
    return JSON.parse(localStorage.getItem(todayKey()) || "[]");
  }

  function markFired(taskId) {
    const fired = getFiredToday();
    fired.push(taskId);
    localStorage.setItem(todayKey(), JSON.stringify(fired));
  }

  function currentHHMM() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function checkDue() {
    const nowHHMM = currentHHMM();
    const fired = getFiredToday();
    const tasks = Tasks.getAllTaskDefs();

    tasks.forEach((task) => {
      if (!task.time) return;
      if (task.time !== nowHHMM) return;
      if (fired.includes(task.id)) return;
      if (Tasks.isDone(task.id)) return;

      fire(task);
      markFired(task.id);
    });
  }

  function fire(task) {
    const message = `Time for: ${task.label}`;
    Voice.speak(message);

    if (document.visibilityState === "visible") {
      showToast(`${task.icon} ${message}`);
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Smriti Reminder", { body: message, icon: "icons/icon-192.png" });
    }
  }

  function showToast(text) {
    const toast = document.getElementById("reminder-toast");
    const textEl = document.getElementById("reminder-toast-text");
    if (!toast || !textEl) return;
    textEl.textContent = text;
    toast.classList.remove("hidden");
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.add("hidden"), 6000);
  }

  function wireDismiss() {
    const dismissBtn = document.getElementById("reminder-toast-dismiss");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        document.getElementById("reminder-toast").classList.add("hidden");
      });
    }
  }

  function requestPermissionIfNeeded() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function init() {
    wireDismiss();
    requestPermissionIfNeeded();
    if (timer) clearInterval(timer);
    timer = setInterval(checkDue, CHECK_INTERVAL_MS);
    checkDue(); // catch anything due right at load
  }

  return { init };
})();
