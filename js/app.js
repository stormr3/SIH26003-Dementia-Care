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

function goToPatientWithWelcome() {
  const profile = Profile.get();
  const name = profile ? profile.name : "there";
  document.getElementById("welcome-name").textContent = name;
  showScreen("welcome");
  Voice.speak(`Welcome, ${name}!`);

  let advanced = false;
  const advance = () => {
    if (advanced) return;
    advanced = true;
    showScreen("patient");
  };
  const timer = setTimeout(advance, 1800);
  const screen = document.getElementById("screen-welcome");
  const tapHandler = () => {
    clearTimeout(timer);
    advance();
    screen.removeEventListener("click", tapHandler);
  };
  screen.addEventListener("click", tapHandler);
}

function submitSetup() {
  const name = document.getElementById("setup-name").value.trim();
  const pin = document.getElementById("setup-pin").value.trim();
  const confirmPin = document.getElementById("setup-pin-confirm").value.trim();
  const errorEl = document.getElementById("setup-error");

  if (!name) return (errorEl.textContent = "Please enter the patient's name.");
  if (!/^\d{4}$/.test(pin)) return (errorEl.textContent = "PIN must be exactly 4 digits.");
  if (pin !== confirmPin) return (errorEl.textContent = "PINs do not match.");

  Profile.save(name, pin);
  errorEl.textContent = "";
  showScreen("landing");
}

function submitPin() {
  const value = document.getElementById("pin-input").value.trim();
  if (Caregiver.checkPin(value)) {
    showScreen("caregiver-dashboard");
  } else {
    document.getElementById("pin-error").textContent = "Incorrect PIN.";
    document.getElementById("pin-input").value = "";
  }
}

function wireNavigation() {
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => showScreen(el.dataset.goto));
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  document.getElementById("voice-btn").addEventListener("click", Voice.readActiveScreen);

  document.getElementById("btn-i-am-patient").addEventListener("click", goToPatientWithWelcome);

  document.getElementById("setup-submit").addEventListener("click", submitSetup);
  document.getElementById("setup-pin-confirm").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSetup();
  });

  document.getElementById("pin-submit").addEventListener("click", submitPin);
  document.getElementById("pin-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitPin();
  });

  document.getElementById("reset-profile-link").addEventListener("click", () => {
    Profile.reset();
    location.reload();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireNavigation();
  Game.init();
  Tasks.init();
  Memories.init();
  Reminders.init();
  showTab("games");
  showScreen(Profile.exists() ? "landing" : "onboarding");
});
