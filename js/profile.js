// profile.js — first-run patient profile (name + caregiver PIN)

const Profile = (() => {
  const KEY = "sahayakProfile";

  function get() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function exists() {
    return !!get();
  }

  function save(name, pin) {
    localStorage.setItem(KEY, JSON.stringify({ name, pin, createdAt: new Date().toISOString() }));
  }

  function reset() {
    localStorage.removeItem(KEY);
    localStorage.removeItem("taskDefs");
    localStorage.removeItem("gameHistory");
    localStorage.removeItem("gameRound");
    localStorage.removeItem("customPhotos");
    localStorage.removeItem("moodLog");
  }

  return { get, exists, save, reset };
})();
