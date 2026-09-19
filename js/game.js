// game.js — Audio-Visual Memory Match
// POC note: difficulty adaptation here is a simple hardcoded rule
// (accuracy threshold -> round change). Production version replaces
// this with the Adaptive Behaviour Engine (tap latency, hesitation,
// error clustering) described in the problem statement.
//
// ACCURACY DEFINITION (important):
// A wrong guess only counts against you if you'd already seen the
// matching tile at some earlier point in the round — i.e. you had
// the information and failed to recall it. A wrong guess on tiles
// you're seeing for the very first time is exploration, not a
// memory failure, and does not lower accuracy.

const Game = (() => {
  const ICON_POOL = [
    { icon: "🪘", name: "Dhol drum" },
    { icon: "🦚", name: "Peacock" },
    { icon: "🌾", name: "Paddy field" },
    { icon: "🐘", name: "Elephant" },
    { icon: "🎭", name: "Bihu mask" },
    { icon: "🧵", name: "Handloom thread" },
    { icon: "🍵", name: "Tea leaves" },
    { icon: "🏔️", name: "Hills" },
  ];

  const MAX_ROUND = 2;
  let round = parseInt(localStorage.getItem("gameRound") || "1", 10);

  let board = [];
  let flippedIndices = [];
  let seenIndices = new Set(); // tiles revealed at least once in a PREVIOUS turn
  let matchedCount = 0;
  let moves = 0;
  let recallMisses = 0; // wrong guesses where the match was already known
  let lockBoard = false;

  const boardEl = () => document.getElementById("game-board");
  const statusEl = () => document.getElementById("game-status");
  const roundEl = () => document.getElementById("game-round");

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildDeck() {
    const pairCount = round >= 2 ? 6 : 4;
    const chosen = shuffle([...ICON_POOL]).slice(0, pairCount);
    const deck = shuffle([...chosen, ...chosen]).map((item, idx) => ({
      ...item,
      id: idx,
      matched: false,
    }));
    return deck;
  }

  function render() {
    const el = boardEl();
    el.innerHTML = "";
    board.forEach((card, idx) => {
      const tile = document.createElement("button");
      tile.className = "card-tile face-down";
      tile.dataset.idx = idx;
      tile.textContent = "";
      tile.addEventListener("click", () => handleFlip(idx));
      el.appendChild(tile);
    });
    roundEl().textContent = round;
    statusEl().textContent = "";
  }

  function handleFlip(idx) {
    if (lockBoard) return;
    const card = board[idx];
    if (card.matched || flippedIndices.includes(idx)) return;

    revealTile(idx);
    Voice.speak(card.name);
    flippedIndices.push(idx);

    if (flippedIndices.length === 2) {
      moves++;
      lockBoard = true;
      const [a, b] = flippedIndices;
      const isMatch = board[a].icon === board[b].icon;

      if (isMatch) {
        setTimeout(() => {
          markMatched(a);
          markMatched(b);
          matchedCount += 2;
          seenIndices.add(a);
          seenIndices.add(b);
          flippedIndices = [];
          lockBoard = false;
          if (matchedCount === board.length) finishRound();
        }, 350);
      } else {
        // Was the match for EITHER flipped card already known from a
        // previous turn? If so, this wrong guess is a real recall miss.
        const knewA = seenIndices.has(a) || wasIconSeenElsewhere(board[a].icon, a);
        const knewB = seenIndices.has(b) || wasIconSeenElsewhere(board[b].icon, b);
        if (knewA || knewB) recallMisses++;

        setTimeout(() => {
          hideTile(a);
          hideTile(b);
          seenIndices.add(a);
          seenIndices.add(b);
          flippedIndices = [];
          lockBoard = false;
        }, 700);
      }
    }
  }

  // True if some OTHER tile with the same icon was already revealed
  // in an earlier turn (i.e. the player had a chance to remember it).
  function wasIconSeenElsewhere(icon, excludeIdx) {
    for (const seenIdx of seenIndices) {
      if (seenIdx !== excludeIdx && board[seenIdx].icon === icon) return true;
    }
    return false;
  }

  function revealTile(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.remove("face-down");
    tile.textContent = board[idx].icon;
  }

  function hideTile(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.add("face-down", "wrong");
    tile.textContent = "";
    setTimeout(() => tile.classList.remove("wrong"), 300);
  }

  function markMatched(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.add("matched");
    board[idx].matched = true;
  }

  function finishRound() {
    const pairs = board.length / 2;
    // Accuracy now reflects recall quality, not raw guess count:
    // every pair you matched counts as a success; every recall miss
    // (a wrong guess where you'd already seen the match) counts against it.
    const accuracy = Math.round((pairs / (pairs + recallMisses)) * 100);

    logSession(accuracy, pairs);
    Voice.speak(`Well done! You matched everything. Accuracy ${accuracy} percent.`);
    statusEl().textContent = `Well done! Accuracy: ${accuracy}%`;

    // Hardcoded adaptive rule: strong recall -> harder next round.
    if (accuracy >= 70 && round < MAX_ROUND) {
      round++;
    } else if (accuracy < 40 && round > 1) {
      round--;
    }
    localStorage.setItem("gameRound", String(round));

    setTimeout(startRound, 2200);
  }

  function logSession(accuracy, pairs) {
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    history.push({
      date: new Date().toISOString(),
      round,
      moves,
      pairs,
      recallMisses,
      accuracy,
    });
    localStorage.setItem("gameHistory", JSON.stringify(history.slice(-14)));
  }

  function startRound() {
    board = buildDeck();
    flippedIndices = [];
    seenIndices = new Set();
    matchedCount = 0;
    moves = 0;
    recallMisses = 0;
    lockBoard = false;
    render();
  }

  function init() {
    if (!boardEl()) return;
    startRound();
  }

  return { init };
})();
