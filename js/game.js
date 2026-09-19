// game.js — Audio-Visual Memory Match
// POC note: difficulty adaptation here is a simple hardcoded rule
// (accuracy threshold -> round change). Production version replaces
// this with the Adaptive Behaviour Engine (tap latency, hesitation,
// error clustering) described in the problem statement.
//
// ACCURACY DEFINITION:
// A wrong guess only counts against you if you'd already seen the
// matching tile at some earlier point in the round — i.e. you had
// the information and failed to recall it. A wrong guess on tiles
// you're seeing for the very first time is exploration, not a
// memory failure, and does not lower accuracy.
//
// PERSONALIZATION:
// If a caregiver has uploaded 4+ photos (see caregiver.js), the game
// uses those instead of the default cultural-icon set. Both card
// "flavours" are normalised to the same {key, name} shape so the
// rest of the game logic doesn't need to know which one is active.

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

  const MIN_CUSTOM_PHOTOS = 4;
  const MAX_ROUND = 2;
  let round = parseInt(localStorage.getItem("gameRound") || "1", 10);

  let board = [];
  let flippedIndices = [];
  let seenIndices = new Set();
  let matchedCount = 0;
  let moves = 0;
  let recallMisses = 0;
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

  function getCustomPhotos() {
    try {
      return JSON.parse(localStorage.getItem("customPhotos") || "[]");
    } catch {
      return [];
    }
  }

  function buildSourceSet(pairCount) {
    const photos = getCustomPhotos();
    if (photos.length >= MIN_CUSTOM_PHOTOS) {
      const chosen = shuffle([...photos]).slice(0, pairCount);
      return chosen.map((dataUrl, i) => ({
        type: "photo",
        key: dataUrl,
        name: `Family photo ${i + 1}`,
      }));
    }
    const chosen = shuffle([...ICON_POOL]).slice(0, pairCount);
    return chosen.map((item) => ({ type: "emoji", key: item.icon, name: item.name }));
  }

  function buildDeck() {
    const pairCount = round >= 2 ? 6 : 4;
    const source = buildSourceSet(pairCount);
    const deck = shuffle([...source, ...source]).map((item, idx) => ({
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
      tile.addEventListener("click", () => handleFlip(idx));
      el.appendChild(tile);
    });
    roundEl().textContent = round;
    statusEl().textContent = "";
  }

  function setTileContent(tile, card) {
    if (card.type === "photo") {
      tile.innerHTML = `<img src="${card.key}" alt="${card.name}" class="tile-photo" />`;
    } else {
      tile.textContent = card.key;
    }
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
      const isMatch = board[a].key === board[b].key;

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
        const knewA = seenIndices.has(a) || wasKeySeenElsewhere(board[a].key, a);
        const knewB = seenIndices.has(b) || wasKeySeenElsewhere(board[b].key, b);
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

  function wasKeySeenElsewhere(key, excludeIdx) {
    for (const seenIdx of seenIndices) {
      if (seenIdx !== excludeIdx && board[seenIdx].key === key) return true;
    }
    return false;
  }

  function revealTile(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.remove("face-down");
    setTileContent(tile, board[idx]);
  }

  function hideTile(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.add("face-down", "wrong");
    tile.innerHTML = "";
    setTimeout(() => tile.classList.remove("wrong"), 300);
  }

  function markMatched(idx) {
    const tile = boardEl().querySelector(`[data-idx="${idx}"]`);
    tile.classList.add("matched");
    board[idx].matched = true;
  }

  function finishRound() {
    const pairs = board.length / 2;
    const accuracy = Math.round((pairs / (pairs + recallMisses)) * 100);

    logSession(accuracy, pairs);
    Voice.speak(`Well done! You matched everything. Accuracy ${accuracy} percent.`);
    statusEl().textContent = `Well done! Accuracy: ${accuracy}%`;

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

  // Called by the caregiver dashboard after photos are added/cleared,
  // so a fresh round picks up the change immediately if a patient
  // navigates back into the Games tab.
  function refresh() {
    if (boardEl()) startRound();
  }

  return { init, refresh };
})();
