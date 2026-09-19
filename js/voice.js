// voice.js
// POC uses the browser's built-in Web Speech API for spoken feedback.
// Production version: swap `speak()` internals for pre-recorded regional
// audio clips (Assamese / Bengali / Khasi / Manipuri) with this same
// function signature, so nothing else in the app needs to change.

const Voice = (() => {
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // don't stack overlapping lines
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // slightly slower — easier for elderly users to follow
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  // Reads out whatever the currently active screen says it should say.
  // Each screen sets `data-speak` on its root element (see app.js).
  function readActiveScreen() {
    const active = document.querySelector(".screen.active");
    if (!active) return;
    const activePane = active.querySelector(".tab-pane.active");
    const text =
      (activePane && activePane.getAttribute("data-speak")) ||
      active.getAttribute("data-speak") ||
      active.querySelector("h2")?.textContent ||
      "";
    if (text) speak(text);
  }

  return { speak, readActiveScreen };
})();
