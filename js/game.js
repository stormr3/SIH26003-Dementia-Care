// game.js — Audio-Visual Memory Match
// POC note: difficulty adaptation here is a simple hardcoded rule
// (accuracy threshold -> round change). Production version replaces
// this with the Adaptive Behaviour Engine (tap latency, hesitation,
// error clustering) described in the problem statement.

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
  let matchedCount = 0;
  let moves = 0;
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
    el.style.gridTemplateColumns = round >= 2 ? "repeat(4, 1fr)" : "repeat(4, 1fr)";
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
      if (board[a].icon === board[b].icon) {
        setTimeout(() => {
          markMatched(a);
          markMatched(b);
          matchedCount += 2;
          flippedIndices = [];
          lockBoard = false;
          if (matchedCount === board.length) finishRound();
        }, 350);
      } else {
        setTimeout(() => {
          hideTile(a);
          hideTile(b);
          flippedIndices = [];
          lockBoard = false;
        }, 700);
      }
    }
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
    const accuracy = Math.max(0, Math.min(100, Math.round((pairs / moves) * 100)));

    logSession(accuracy);
    Voice.speak(`Well done! You matched everything. Accuracy ${accuracy} percent.`);
    statusEl().textContent = `Well done! Accuracy: ${accuracy}%`;

    // Hardcoded adaptive rule: strong performance -> harder next round.
    if (accuracy >= 70 && round < MAX_ROUND) {
      round++;
    } else if (accuracy < 40 && round > 1) {
      round--;
    }
    localStorage.setItem("gameRound", String(round));

    setTimeout(startRound, 2200);
  }

  function logSession(accuracy) {
    const history = JSON.parse(localStorage.getItem("gameHistory") || "[]");
    history.push({ date: new Date().toISOString(), round, moves, accuracy });
    localStorage.setItem("gameHistory", JSON.stringify(history.slice(-14)));
  }

  function startRound() {
    board = buildDeck();
    flippedIndices = [];
    matchedCount = 0;
    moves = 0;
    lockBoard = false;
    render();
  }

  function init() {
    if (!boardEl()) return;
    startRound();
  }

  return { init };
})();
