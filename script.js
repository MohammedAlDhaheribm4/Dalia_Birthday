document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let currentStage = 1;
    let score = 0;
    const stages = [
        { id: 1, title: "The Elusive Box! 🎁", desc: "The gift is shy. Catch it 3 times!", target: 3, label: "Catches:" },
        { id: 2, title: "Paradox Password! 🧩", desc: "Tap the emojis in this EXACT nonsensical order: 🍍 -> 🦆 -> 🦄 -> 🍕", target: 4, label: "Correct Taps:" },
        { id: 3, title: "The Speed Challenge! ⚡", desc: "Catch 7 stars before they vanish! They're moving fast!", target: 7, label: "Stars Caught:" }
    ];

    const elements = {
        app: document.getElementById('app'),
        welcome: document.getElementById('welcome'),
        game: document.getElementById('game'),
        success: document.getElementById('success'),
        birthday: document.getElementById('birthday'),
        gameArea: document.getElementById('game-area'),
        scoreDisplay: document.getElementById('score'),
        totalScoreDisplay: document.getElementById('total-score'),
        gameTitle: document.getElementById('game-title'),
        gameDesc: document.getElementById('game-desc'),
        scoreLabel: document.getElementById('score-label'),
        startBtn: document.getElementById('start-btn'),
        revealBtn: document.getElementById('reveal-btn')
    };

    // --- Audio Synthesis ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(freq, type = 'sine', duration = 0.1) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    const sounds = {
        click: () => playSound(440, 'sine', 0.1),
        success: () => { playSound(523, 'triangle', 0.2); setTimeout(() => playSound(659, 'triangle', 0.2), 100); },
        finish: () => { [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => playSound(f, 'sine', 0.4), i * 150)); }
    };

    // --- Mouse Trail ---
    document.addEventListener('mousemove', (e) => {
        if (Math.random() > 0.15) return;
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.innerHTML = '✨';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 800);
    });

    // --- Screen Transitions ---
    function showSection(sectionId) {
        Object.values(elements).forEach(el => {
            if (el && el.tagName === 'SECTION') el.classList.remove('active');
        });
        elements[sectionId].classList.add('active');

        if (sectionId === 'game') startStage(1);
        if (sectionId === 'birthday') {
            sounds.finish();
            celebrate();
        }
    }

    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', () => {
            audioCtx.resume();
            showSection('game');
        });
    }

    if (elements.revealBtn) {
        elements.revealBtn.addEventListener('click', () => showSection('birthday'));
    }

    // --- Game Logic ---
    function startStage(stageNum) {
        currentStage = stageNum;
        score = 0;
        const stageData = stages[stageNum - 1];

        elements.gameTitle.textContent = stageData.title;
        elements.gameDesc.textContent = stageData.desc;
        elements.scoreLabel.textContent = stageData.label;
        elements.scoreDisplay.textContent = score;
        elements.totalScoreDisplay.textContent = stageData.target;
        elements.gameArea.innerHTML = '';

        document.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === stageNum - 1);
        });

        if (stageNum === 1) initStage1();
        else if (stageNum === 2) initStage2();
        else if (stageNum === 3) initStage3();
    }

    function initStage1() {
        const spawnBox = () => {
            const box = createGameItem('toy', '🎁');
            box.onclick = () => {
                score++;
                elements.scoreDisplay.textContent = score;
                sounds.click();
                addClickFeedback(box);
                box.remove();
                if (score < 3) spawnBox();
                else nextStage();
            };
        };
        spawnBox();
    }

    function initStage2() {
        const order = ['🍍', '🦆', '🦄', '🍕'];
        order.forEach((icon, i) => {
            const item = createGameItem('paw-print', icon);
            item.dataset.icon = icon;
            item.onclick = () => {
                if (item.dataset.icon === order[score]) {
                    score++;
                    elements.scoreDisplay.textContent = score;
                    item.classList.add('active');
                    sounds.click();
                    addClickFeedback(item, true);
                    if (score === order.length) setTimeout(nextStage, 500);
                } else {
                    item.style.animation = 'shake 0.3s';
                    setTimeout(() => item.style.animation = '', 300);
                }
            };
        });
    }

    function initStage3() {
        const spawnStar = () => {
            if (score >= 7 || currentStage !== 3) return;
            const star = createGameItem('star', '⭐');
            const lifeTime = Math.random() * 600 + 400;
            star.style.transition = `all ${lifeTime}ms cubic-bezier(0.4, 0, 0.2, 1)`;

            setTimeout(() => {
                const nextX = Math.random() * (elements.gameArea.clientWidth - 50);
                const nextY = Math.random() * (elements.gameArea.clientHeight - 50);
                star.style.left = `${nextX}px`;
                star.style.top = `${nextY}px`;
            }, 10);

            star.onclick = () => {
                score++;
                elements.scoreDisplay.textContent = score;
                sounds.click();
                addClickFeedback(star, true);
                star.remove();
                if (score === 7) nextStage();
                else spawnStar();
            };

            setTimeout(() => {
                if (star.parentNode) {
                    star.remove();
                    if (score < 7) spawnStar();
                }
            }, lifeTime + 100);
        };
        for (let i = 0; i < 3; i++) setTimeout(spawnStar, i * 300);
    }

    function createGameItem(className, content) {
        const item = document.createElement('div');
        item.className = className;
        item.innerHTML = content;
        const x = Math.random() * (elements.gameArea.clientWidth - 60);
        const y = Math.random() * (elements.gameArea.clientHeight - 60);
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        elements.gameArea.appendChild(item);
        return item;
    }

    function addClickFeedback(el, isEmoji = false) {
        const burst = document.createElement('div');
        burst.className = 'click-effect';
        burst.style.left = el.style.left;
        burst.style.top = el.style.top;
        elements.gameArea.appendChild(burst);
        setTimeout(() => burst.remove(), 600);

        if (isEmoji) {
            el.style.transform = 'scale(1.5) rotate(10deg)';
            el.style.filter = 'drop-shadow(0 0 10px gold)';
        }
    }

    function nextStage() {
        sounds.success();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });

        if (currentStage < 3) {
            setTimeout(() => startStage(currentStage + 1), 800);
        } else {
            setTimeout(() => showSection('success'), 1000);
        }
    }

    document.querySelectorAll('.decor-item').forEach(item => {
        item.addEventListener('click', () => {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
            sounds.click();
        });
    });

    function celebrate() {
        const end = Date.now() + (15 * 1000);
        const colors = ['#ff85a2', '#9d50bb', '#6e7ff3', '#ffcf33', '#ffffff'];

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
});
