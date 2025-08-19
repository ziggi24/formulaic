(() => {
    "use strict";

    // Configuration
    const EMOJI_PALETTE = ['🍓', '🚚', '🌼', '🌲', '🧵', '☂️', '💕', '💍'];
    const NUM_SLOTS = 5;
    const MAX_GUESSES = 9;
    const STORAGE_KEYS = {
        stats: "formulaic_stats",
        dailyPrefix: "formulaic_daily_", // + dayIndex
        seenHowTo: "formulaic_seenHowTo"
    };

    // Start date for puzzle number (#1 on start date)
    const START_DATE = new Date(2025, 0, 1); // Local time Jan 1, 2025

    // Utilities
    function startOfDayLocal(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function daysBetweenLocal(a, b) {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((startOfDayLocal(a) - startOfDayLocal(b)) / msPerDay);
    }

    function getTodayInfo() {
        const today = new Date();
        const dayIndex = Math.max(0, daysBetweenLocal(today, START_DATE));
        const puzzleNumber = dayIndex + 1;
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateSeed = `${yyyy}-${mm}-${dd}`;
        return { today, dayIndex, puzzleNumber, dateSeed };
    }

    // Seeded PRNG (xmur3 + sfc32)
    function xmur3(str) {
        let h = 1779033703 ^ str.length;
        for (let i = 0; i < str.length; i++) {
            h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return function() {
            h = Math.imul(h ^ (h >>> 16), 2246822507);
            h = Math.imul(h ^ (h >>> 13), 3266489909);
            h ^= h >>> 16;
            return h >>> 0;
        };
    }

    function sfc32(a, b, c, d) {
        return function() {
            a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
            let t = (a + b) | 0;
            a = b ^ (b >>> 9);
            b = (c + (c << 3)) | 0;
            c = (c << 21) | (c >>> 11);
            d = (d + 1) | 0;
            t = (t + d) | 0;
            c = (c + t) | 0;
            return (t >>> 0) / 4294967296;
        };
    }

    function rngFromSeed(seedStr) {
        const seed = xmur3(seedStr);
        return sfc32(seed(), seed(), seed(), seed());
    }

    function generateSecret(rng) {
        const secret = [];
        for (let i = 0; i < NUM_SLOTS; i++) {
            const idx = Math.floor(rng() * EMOJI_PALETTE.length);
            secret.push(EMOJI_PALETTE[idx]);
        }
        return secret;
    }

    function evaluateGuess(secret, guess) {
        let black = 0;
        const secretCounts = new Map();
        const guessCounts = new Map();
        for (let i = 0; i < NUM_SLOTS; i++) {
            if (guess[i] === secret[i]) {
                black++;
            } else {
                secretCounts.set(secret[i], (secretCounts.get(secret[i]) || 0) + 1);
                guessCounts.set(guess[i], (guessCounts.get(guess[i]) || 0) + 1);
            }
        }
        let white = 0;
        for (const [emoji, cnt] of guessCounts.entries()) {
            const sCnt = secretCounts.get(emoji) || 0;
            white += Math.min(cnt, sCnt);
        }
        return { black, white };
    }

    function feedbackToString(fb) {
        if (!fb) return "";
        return "⚫".repeat(fb.black) + "⚪".repeat(fb.white);
    }

    // Storage helpers
    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (_) {
            // ignore
        }
    }

    function getDailyKey(dayIndex) {
        return `${STORAGE_KEYS.dailyPrefix}${dayIndex}`;
    }

    // Stats model
    function defaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
    }

    // State
    const todayInfo = getTodayInfo();
    const rng = rngFromSeed(todayInfo.dateSeed);
    const secret = generateSecret(rng);

    const els = {
        puzzleNumber: document.getElementById("puzzleNumber"),
        board: document.getElementById("board"),
        palette: document.getElementById("palette"),
        enterBtn: document.getElementById("enterBtn"),
        deleteBtn: document.getElementById("deleteBtn"),
        infoBtn: document.getElementById("infoBtn"),
        howToModal: document.getElementById("howToModal"),
        howToCloseBtn: document.getElementById("howToCloseBtn"),
        resultModal: document.getElementById("resultModal"),
        resultTitle: document.getElementById("resultTitle"),
        solutionReveal: document.getElementById("solutionReveal"),
        gamesPlayed: document.getElementById("gamesPlayed"),
        winRate: document.getElementById("winRate"),
        currentStreak: document.getElementById("currentStreak"),
        maxStreak: document.getElementById("maxStreak"),
        guessDistribution: document.getElementById("guessDistribution"),
        countdownTimer: document.getElementById("countdownTimer"),
        shareBtn: document.getElementById("shareBtn"),
        resultCloseBtn: document.getElementById("resultCloseBtn"),
        winCelebration: document.getElementById("winCelebration"),
        winEmojis: document.getElementById("winEmojis"),
        winShareText: document.getElementById("winShareText"),
        winCloseBtn: document.getElementById("winCloseBtn"),
        toast: document.getElementById("toast")
    };

    els.puzzleNumber.textContent = `#${todayInfo.puzzleNumber}`;

    function validateState(state) {
        if (!state || typeof state !== 'object') return false;
        if (state.dayIndex !== todayInfo.dayIndex) return false;
        if (!Array.isArray(state.guesses)) return false;
        if (!Array.isArray(state.feedbacks)) return false;
        if (!Array.isArray(state.currentGuess)) return false;
        if (state.guesses.length !== state.feedbacks.length) return false;
        return true;
    }

    const saved = loadJSON(getDailyKey(todayInfo.dayIndex), null);
    const state = validateState(saved) ? saved : {
        dayIndex: todayInfo.dayIndex,
        guesses: [],
        feedbacks: [],
        currentGuess: [],
        isComplete: false,
        isWin: false,
        statsCounted: false
    };

    const stats = loadJSON(STORAGE_KEYS.stats, defaultStats());

    // Track user interaction to prevent auto-showing modals on page load
    let hasUserInteracted = false;

    // Rendering
    function renderBoard() {
        els.board.innerHTML = "";
        for (let rowIdx = 0; rowIdx < MAX_GUESSES; rowIdx++) {
            const row = document.createElement("div");
            row.className = "row";
            
            // Determine what to show in this row
            let guess = [];
            if (rowIdx < state.guesses.length) {
                // This row shows a completed guess
                guess = state.guesses[rowIdx];
            } else if (rowIdx === state.guesses.length && !state.isComplete) {
                // This row shows the current guess in progress
                guess = state.currentGuess;
            }
            // Otherwise, this row is empty
            
            // Render exactly NUM_SLOTS cells
            for (let col = 0; col < NUM_SLOTS; col++) {
                const cell = document.createElement("div");
                cell.className = "cell" + (guess[col] ? " filled" : "");
                cell.textContent = guess[col] || "";
                row.appendChild(cell);
            }
            
            // Add feedback
            const feedbackEl = document.createElement("div");
            feedbackEl.className = "feedback";
            const fb = state.feedbacks[rowIdx];
            feedbackEl.textContent = fb ? feedbackToString(fb) : "";
            row.appendChild(feedbackEl);
            els.board.appendChild(row);
        }
    }

    function renderPalette() {
        els.palette.innerHTML = "";
        EMOJI_PALETTE.forEach((emoji, idx) => {
            const btn = document.createElement("button");
            btn.className = "emoji-btn";
            btn.type = "button";
            btn.textContent = emoji;
            btn.setAttribute("aria-label", `Insert ${emoji}`);
            btn.addEventListener("click", () => addEmoji(emoji));
            els.palette.appendChild(btn);
        });
    }

    function addEmoji(emoji) {
        hasUserInteracted = true;
        
        // Prevent adding emojis when game is complete
        if (state.isComplete) return;
        
        // Ensure currentGuess is an array
        if (!Array.isArray(state.currentGuess)) {
            state.currentGuess = [];
        }
        
        // Prevent adding more than 5 emojis
        if (state.currentGuess.length >= NUM_SLOTS) return;
        
        // Add the emoji to current guess
        state.currentGuess.push(emoji);
        persistState();
        renderBoard();
    }

    function deleteEmoji() {
        hasUserInteracted = true;
        
        if (state.isComplete) return;
        
        // Ensure currentGuess is an array
        if (!Array.isArray(state.currentGuess)) {
            state.currentGuess = [];
            return;
        }
        
        // Only delete if there's something to delete
        if (state.currentGuess.length > 0) {
            state.currentGuess.pop();
            persistState();
            renderBoard();
        }
    }

    async function submitGuess() {
        hasUserInteracted = true;
        
        if (state.isComplete) return;
        
        // Ensure currentGuess is an array
        if (!Array.isArray(state.currentGuess)) {
            state.currentGuess = [];
        }
        
        if (state.currentGuess.length !== NUM_SLOTS) {
            flashToast("Enter 5 emojis");
            return;
        }
        
        // Animate the bounce effect
        await animateGuessSubmission();
        
        const guess = state.currentGuess.slice();
        const fb = evaluateGuess(secret, guess);
        state.guesses.push(guess);
        state.feedbacks.push(fb);
        state.currentGuess = [];

        if (fb.black === NUM_SLOTS) {
            state.isComplete = true;
            state.isWin = true;
        } else if (state.guesses.length >= MAX_GUESSES) {
            state.isComplete = true;
            state.isWin = false;
        }

        persistState();
        renderBoard();
        
        // Show feedback with slide animation
        animateFeedback();

        if (state.isComplete) {
            if (state.isWin) {
                // Add celebration effect for winning (only for fresh wins)
                setTimeout(() => {
                    showWinCelebration();
                }, 500);
            } else {
                // Show game over for losses
                setTimeout(() => {
                    onGameComplete();
                }, 500);
            }
        }
    }

    function persistState() {
        saveJSON(getDailyKey(todayInfo.dayIndex), state);
    }

    async function animateGuessSubmission() {
        const currentRowIndex = state.guesses.length;
        const rows = els.board.children;
        if (currentRowIndex >= rows.length) return;
        
        const row = rows[currentRowIndex];
        const cells = row.querySelectorAll('.cell');
        
        // Animate each cell bouncing from left to right
        for (let i = 0; i < cells.length; i++) {
            cells[i].classList.add('bounce');
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between each bounce
        }
        
        // Clean up animation classes after animation completes
        setTimeout(() => {
            cells.forEach(cell => cell.classList.remove('bounce'));
        }, 300);
    }

    function animateFeedback() {
        const lastRowIndex = state.guesses.length - 1;
        const rows = els.board.children;
        if (lastRowIndex >= rows.length || lastRowIndex < 0) return;
        
        const row = rows[lastRowIndex];
        const feedbackEl = row.querySelector('.feedback');
        if (feedbackEl) {
            feedbackEl.classList.add('slide-in');
            setTimeout(() => {
                feedbackEl.classList.remove('slide-in');
            }, 400);
        }
    }

    function showWinCelebration() {
        // First, animate all the winning guess cells
        const winningRowIndex = state.guesses.length - 1;
        const rows = els.board.children;
        if (winningRowIndex >= 0 && winningRowIndex < rows.length) {
            const row = rows[winningRowIndex];
            const cells = row.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
                setTimeout(() => {
                    cell.classList.add('celebrate');
                    setTimeout(() => cell.classList.remove('celebrate'), 600);
                }, index * 100);
            });
        }
        
        // Show the win celebration overlay after the cell animations
        setTimeout(() => {
            const shareText = buildShareText();
            els.winShareText.textContent = shareText;
            els.winCelebration.hidden = false;
        }, 800);
    }

    // Modals & UX
    function ensureHowTo() {
        const seen = loadJSON(STORAGE_KEYS.seenHowTo, false);
        if (!seen) {
            try { els.howToModal.showModal(); } catch (_) { /* fallback */ }
        }
    }

    function closeHowTo() {
        saveJSON(STORAGE_KEYS.seenHowTo, true);
        try { els.howToModal.close(); } catch (_) { /* ignore */ }
    }

    function onGameComplete() {
        if (!state.statsCounted) {
            // Update stats once per completed game
            stats.gamesPlayed += 1;
            if (state.isWin) {
                stats.gamesWon += 1;
                stats.currentStreak += 1;
                if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
                const attempts = state.guesses.length;
                if (attempts >= 1 && attempts <= 9) {
                    stats.guessDistribution[attempts - 1] += 1;
                }
            } else {
                stats.currentStreak = 0;
            }
            saveJSON(STORAGE_KEYS.stats, stats);
            state.statsCounted = true;
            persistState();
        }

        // Populate result modal
        els.resultTitle.textContent = state.isWin ? "You Win!" : "So Close!";
        els.solutionReveal.textContent = `Solution: ${secret.join(" ")}`;
        els.gamesPlayed.textContent = String(stats.gamesPlayed);
        const winPct = stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
        els.winRate.textContent = `${winPct}%`;
        els.currentStreak.textContent = String(stats.currentStreak);
        els.maxStreak.textContent = String(stats.maxStreak);
        renderDistribution();
        try { els.resultModal.showModal(); } catch (_) { /* fallback */ }
    }

    function renderDistribution() {
        const max = Math.max(1, ...stats.guessDistribution);
        els.guessDistribution.innerHTML = "";
        for (let i = 0; i < 9; i++) {
            const row = document.createElement("div");
            row.className = "dist-row";
            const label = document.createElement("div");
            label.textContent = String(i + 1);
            const bar = document.createElement("div");
            bar.className = "dist-bar";
            const fill = document.createElement("div");
            fill.className = "fill";
            const count = stats.guessDistribution[i] || 0;
            const pct = Math.max(6, Math.round((count / max) * 100));
            fill.style.width = `${pct}%`;
            bar.appendChild(fill);
            const countEl = document.createElement("div");
            countEl.className = "dist-count";
            countEl.textContent = String(count);
            row.appendChild(label);
            row.appendChild(bar);
            row.appendChild(countEl);
            els.guessDistribution.appendChild(row);
        }
    }

    function formatCountdown(ms) {
        const total = Math.max(0, Math.floor(ms / 1000));
        const h = String(Math.floor(total / 3600)).padStart(2, '0');
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
        const s = String(total % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0); // next local midnight
        const ms = tomorrow - now;
        els.countdownTimer.textContent = formatCountdown(ms);
    }

    function buildShareText() {
        const attemptsText = state.isWin ? `${state.guesses.length}/9` : "X/9";
        const lines = [];
        lines.push(`Formulaic #${todayInfo.puzzleNumber} - ${attemptsText}`);
        lines.push("");
        state.feedbacks.forEach((fb, i) => {
            lines.push(`Guess ${i + 1}: ${feedbackToString(fb)}`);
        });
        if (!state.isComplete && state.currentGuess.length > 0) {
            const fb = evaluateGuess(secret, state.currentGuess.concat(Array(NUM_SLOTS - state.currentGuess.length).fill("")));
            lines.push(`Guess ${state.feedbacks.length + 1}: ${feedbackToString(fb)}`);
        }
        lines.push("");
        const origin = (location && location.origin && location.origin !== "null") ? location.origin : "play.yourgamesite.com";
        lines.push(origin);
        return lines.join("\n");
    }

    async function shareResults() {
        const text = buildShareText();
        try {
            await navigator.clipboard.writeText(text);
            flashToast("Copied to clipboard");
        } catch (_) {
            // Fallback for insecure context
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            flashToast("Copied to clipboard");
        }
    }

    let toastTimer = null;
    function flashToast(message) {
        if (!els.toast) return;
        els.toast.textContent = message;
        els.toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { els.toast.hidden = true; }, 1400);
    }

    // Input bindings
    els.enterBtn.addEventListener("click", submitGuess);
    els.deleteBtn.addEventListener("click", deleteEmoji);
    els.infoBtn.addEventListener("click", () => {
        try { 
            els.howToModal.showModal();
            // Scroll to top when modal opens
            els.howToModal.scrollTop = 0;
        } catch (_) { /* fallback */ }
    });
    els.howToCloseBtn.addEventListener("click", closeHowTo);
    
    // Close modal when clicking outside of it
    els.howToModal.addEventListener("click", (e) => {
        if (e.target === els.howToModal) {
            closeHowTo();
        }
    });
    els.resultCloseBtn.addEventListener("click", () => { try { els.resultModal.close(); } catch (_) {} });
    
    // Close result modal when clicking outside of it
    els.resultModal.addEventListener("click", (e) => {
        if (e.target === els.resultModal) {
            try { els.resultModal.close(); } catch (_) {}
        }
    });
    els.shareBtn.addEventListener("click", shareResults);
    els.winCloseBtn.addEventListener("click", () => {
        els.winCelebration.hidden = true;
        onGameComplete(); // Show the regular results modal
    });

    // Keyboard support: digits 1-8 map to emojis, Backspace, Enter
    window.addEventListener("keydown", (e) => {
        if (state.isComplete) return;
        if (e.key === "Enter") { e.preventDefault(); submitGuess(); return; }
        if (e.key === "Backspace") { e.preventDefault(); deleteEmoji(); return; }
        const idx = parseInt(e.key, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= EMOJI_PALETTE.length) {
            addEmoji(EMOJI_PALETTE[idx - 1]);
        }
    });

    // Initial render
    renderBoard();
    renderPalette();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Ensure win celebration is hidden on load
    if (els.winCelebration) {
        els.winCelebration.hidden = true;
    }
    
    // Only show how-to for new games
    if (!state.isComplete) {
        ensureHowTo();
    }
})();
