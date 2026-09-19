// caregiver.js — PIN gate + dashboard rendering + task/photo management
// POC note: the 7-day trend mixes mock historical points (no real
// multi-day data exists yet on a fresh install) with today's real
// figure pulled from gameHistory/taskLog/moodLog in localStorage.

const Caregiver = (() => {
  const MOOD_EMOJI = { happy: "😊", okay: "😐", low: "😔" };
  const MAX_PHOTOS = 6;

  function checkPin(value) {
    const profile = Profile.get();
    return !!profile && value === profile.pin;
  }

  function buildTrend() {
    const mock = [62, 58, 67, 71, 65, 74];
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
        .map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="4" fill="#D9A441" />`)
        .join("")}
    `;
  }

  function renderCards() {
    const profile = Profile.get();
    document.getElementById("dash-patient-name").textContent = profile ? profile.name : "Patient";

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

  function renderTaskManager() {
    const list = document.getElementById("task-manager");
    if (!list) return;
    const defs = Tasks.getAllTaskDefs();
    list.innerHTML = "";
    defs.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-manager-item";
      li.innerHTML = `
        <span>${task.icon} ${task.label}${task.time ? ` <span class="task-time">· ${task.time}</span>` : ""}</span>
        <button class="remove-task-btn" data-id="${task.id}" aria-label="Remove task">✕</button>
      `;
      list.appendChild(li);
    });
    list.querySelectorAll(".remove-task-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        Tasks.removeTaskDef(btn.dataset.id);
        renderTaskManager();
        Tasks.render();
      });
    });
  }

  function wireAddTask() {
    const btn = document.getElementById("add-task-btn");
    if (!btn || btn._wired) return;
    btn._wired = true;
    btn.addEventListener("click", () => {
      const labelInput = document.getElementById("new-task-label");
      const iconInput = document.getElementById("new-task-icon");
      const timeInput = document.getElementById("new-task-time");
      const label = labelInput.value.trim();
      if (!label) return;
      Tasks.addTaskDef(label, iconInput.value, timeInput.value);
      labelInput.value = "";
      timeInput.value = "";
      renderTaskManager();
      Tasks.render();
    });
  }

  // ---- Photo personalization ----

  function resizeImage(file, maxDim) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function getPhotos() {
    return JSON.parse(localStorage.getItem("customPhotos") || "[]");
  }

  function savePhotos(photos) {
    localStorage.setItem("customPhotos", JSON.stringify(photos.slice(0, MAX_PHOTOS)));
  }

  function renderPhotoPreview() {
    const grid = document.getElementById("photo-preview");
    if (!grid) return;
    const photos = getPhotos();
    grid.innerHTML = "";
    if (photos.length === 0) {
      grid.innerHTML = `<p class="photo-empty">Using default cultural icons — no photos uploaded yet.</p>`;
      return;
    }
    photos.forEach((src, i) => {
      const wrap = document.createElement("div");
      wrap.className = "photo-thumb";
      wrap.innerHTML = `<img src="${src}" alt="Uploaded photo ${i + 1}" />`;
      grid.appendChild(wrap);
    });
    const status = document.createElement("p");
    status.className = "photo-status";
    status.textContent =
      photos.length >= 4
        ? `${photos.length} photo${photos.length > 1 ? "s" : ""} active in the game.`
        : `${photos.length} uploaded — need at least 4 to activate.`;
    grid.appendChild(status);
  }

  function wirePhotoUpload() {
    const input = document.getElementById("photo-upload-input");
    const clearBtn = document.getElementById("clear-photos-btn");
    if (!input || input._wired) return;
    input._wired = true;

    input.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files).slice(0, MAX_PHOTOS);
      const resized = await Promise.all(files.map((f) => resizeImage(f, 300)));
      savePhotos(resized);
      renderPhotoPreview();
      Game.refresh();
      input.value = "";
    });

    clearBtn.addEventListener("click", () => {
      localStorage.removeItem("customPhotos");
      renderPhotoPreview();
      Game.refresh();
    });
  }

  function renderDashboard() {
    renderCards();
    renderChart();
    renderTaskManager();
    wireAddTask();
    renderPhotoPreview();
    wirePhotoUpload();
  }

  return { checkPin, renderDashboard };
})();
