// app.js — routing shell that ties the modules together

const TAB_HEADINGS = {
  games: "Play Games",
  tasks: "My Tasks",
  memories: "Memories & Songs",
};

const TAB_SPEAK = {
  games: "Memory match game. Tap two cards to find a matching pair.",
  tasks: "Your daily tasks. Tap a task when you have completed it.",
  memories: "Memories and songs. Tap a card to play, or tell us how you feel.",
};

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(`screen-${id}`).classList.add("active");

  const voiceBtn = document.getElementById("voice-btn");
  voiceBtn.classList.toggle("hidden", id !== "patient");

  if (id === "caregiver-dashboard") {
    Caregiver.renderDashboard();
  }
  if (id === "caregiver-pin") {
    const input = document.getElementById("pin-input");
    input.value = "";
    document.getElementById("pin-error").textContent = "";
    setTimeout(() => input.focus(), 50);
  }
}

function showTab(tabName) {
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.getElementById(`tab-${tabName}`).classList.add("active");
  document.getElementById(`tab-${tabName}`).setAttribute("data-speak", TAB_SPEAK[tabName]);

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.getElementById("patient-heading").textContent = TAB_HEADINGS[tabName];
}

function wireNavigation() {
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => showScreen(el.dataset.goto));
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  document.getElementById("voice-btn").addEventListener("click", Voice.readActiveScreen);

  document.getElementById("pin-submit").addEventListener("click", submitPin);
  document.getElementById("pin-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitPin();
  });
}

function submitPin() {
  const value = document.getElementById("pin-input").value.trim();
  if (Caregiver.checkPin(value)) {
    showScreen("caregiver-dashboard");
  } else {
    document.getElementById("pin-error").textContent = "Incorrect PIN. Try 1234 for this demo.";
    document.getElementById("pin-input").value = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  wireNavigation();
  Game.init();
  Tasks.init();
  Memories.init();
  showTab("games"); // sets initial heading + data-speak
});
