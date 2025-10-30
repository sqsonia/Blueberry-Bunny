const TUBE_SIZE = 4;

const FRUIT_DEFINITIONS = [
    { key: 'blueberry', label: 'Blueberry Bunny' },
    { key: 'strawberry', label: 'Strawberry Bunny' },
    { key: 'peach', label: 'Peach Bunny' },
    { key: 'kiwi', label: 'Kiwi Bunny' },
    { key: 'grape', label: 'Grape Bunny' },
    { key: 'citrus', label: 'Citrus Bunny' },
    { key: 'melon', label: 'Melon Bunny' },
    { key: 'plum', label: 'Plum Bunny' },
    { key: 'cherry', label: 'Cherry Bunny' },
    { key: 'dragonfruit', label: 'Dragonfruit Bunny' }
];

const FRUIT_LOOKUP = FRUIT_DEFINITIONS.reduce((map, fruit) => {
    map[fruit.key] = fruit;
    return map;
}, {});

const LEVELS = [
    { name: 'Berry Beginnings', fruits: ['blueberry', 'strawberry'], helperTubes: 1 },
    { name: 'Garden Groove', fruits: ['blueberry', 'strawberry', 'peach'], helperTubes: 1 },
    { name: 'Orchard Flow', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi'], helperTubes: 1 },
    { name: 'Vineyard Twist', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape'], helperTubes: 2 },
    { name: 'Sunrise Feast', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus'], helperTubes: 2 },
    { name: 'Moonlit Harvest', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus', 'melon'], helperTubes: 2 },
    { name: 'Starlit Splash', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus', 'melon', 'plum'], helperTubes: 2 },
    { name: 'Aurora Orchard', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus', 'melon', 'plum', 'cherry'], helperTubes: 3 },
    { name: 'Nebula Nibble', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus', 'melon', 'plum', 'cherry'], helperTubes: 2 },
    { name: 'Cosmic Carnival', fruits: ['blueberry', 'strawberry', 'peach', 'kiwi', 'grape', 'citrus', 'melon', 'plum', 'cherry', 'dragonfruit'], helperTubes: 3 }
];

const ACTIONS = {
    NEXT: 'next',
    RESTART: 'restart'
};

const boardEl = document.getElementById('board');
const moveCountEl = document.getElementById('move-count');
const tubeCountEl = document.getElementById('tube-count');
const newGameButton = document.getElementById('new-game');
const playAgainButton = document.getElementById('play-again');
const levelNumberEl = document.getElementById('level-number');
const levelTotalEl = document.getElementById('level-total');
const levelNameEl = document.getElementById('level-name');
const winModal = document.getElementById('win-modal');
const winMessageEl = winModal ? winModal.querySelector('.win-modal__message') : null;
const tubeTemplate = document.getElementById('tube-template');

const animationClasses = {
    deny: 'tube--deny'
};

const state = {
    tubes: [],
    moves: 0,
    drag: null,
    keyboardSelection: null,
    levelIndex: 0,
    pendingLevelIndex: null
};

newGameButton?.addEventListener('click', () => startLevel(state.levelIndex));
playAgainButton?.addEventListener('click', () => {
    const targetLevel = state.pendingLevelIndex;

    closeWinModal();

    if (typeof targetLevel === 'number' && !Number.isNaN(targetLevel) && targetLevel >= 0 && targetLevel < LEVELS.length) {
        startLevel(targetLevel);
        return;
    }

    if (!isLastLevel()) {
        startLevel(state.levelIndex + 1);
        return;
    }

    startLevel(0);
});

if (winModal) {
    winModal.addEventListener('cancel', (event) => {
        event.preventDefault();
        closeWinModal();
    });
}

boardEl.addEventListener('pointerdown', handlePointerDown);
boardEl.addEventListener('keydown', handleKeydown);

document.addEventListener('visibilitychange', handleVisibilityChange);

startLevel(0);

function startLevel(index) {
    closeWinModal();
    const nextIndex = clamp(index, 0, LEVELS.length - 1);
    state.levelIndex = nextIndex;
    state.moves = 0;
    state.drag = null;
    state.keyboardSelection = null;
    state.pendingLevelIndex = null;

    const level = LEVELS[state.levelIndex];
    state.tubes = createShuffledTubes(level);

    updateMoveCounter();
    updateLevelIndicator();
    clearTargetHints();
    clearInvalidAnimations();
    renderBoard();
}

function createShuffledTubes(level) {
    const fruitKeys = level.fruits;
    const totalTubes = fruitKeys.length + level.helperTubes;
    const inventory = [];

    fruitKeys.forEach((fruitKey) => {
        for (let i = 0; i < TUBE_SIZE; i += 1) {
            inventory.push(fruitKey);
        }
    });

    shuffleArray(inventory);

    const tubes = Array.from({ length: totalTubes }, () => []);

    inventory.forEach((fruitKey) => {
        const nextTube = tubes.find((tube) => tube.length < TUBE_SIZE);
        nextTube.push(fruitKey);
    });

    if (isSolved(tubes)) {
        return createShuffledTubes(level);
    }

    return tubes;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function renderBoard() {
    const previousFocusIndex = getFocusedTubeIndex();

    boardEl.innerHTML = '';

    state.tubes.forEach((tube, index) => {
        const tubeElement = tubeTemplate.content.firstElementChild.cloneNode(true);
        tubeElement.dataset.index = index.toString();
        tubeElement.setAttribute('aria-label', describeTube(index, tube));

        if (state.keyboardSelection?.index === index) {
            tubeElement.classList.add('tube--selected');
            tubeElement.setAttribute('aria-pressed', 'true');
        } else {
            tubeElement.setAttribute('aria-pressed', 'false');
        }

        if (state.keyboardSelection && state.keyboardSelection.index !== index && canDrop(state.keyboardSelection, index)) {
            tubeElement.classList.add('tube--target');
        }

        const srLabel = tubeElement.querySelector('.sr-only');
        if (srLabel) {
            srLabel.textContent = describeTube(index, tube);
        }

        const stackEl = tubeElement.querySelector('.bunny-stack');
        stackEl.innerHTML = '';

        tube.forEach((fruitKey) => {
            const bunny = createBunny(fruitKey);
            stackEl.appendChild(bunny);
        });

        const topRun = getTopRun(tube);
        if (topRun.count > 0) {
            const bunnyElements = Array.from(stackEl.children);
            const firstLiftable = bunnyElements.length - topRun.count;
            bunnyElements.forEach((bunnyEl, bunnyIndex) => {
                if (bunnyIndex >= firstLiftable) {
                    bunnyEl.classList.add('bunny--liftable');
                }
            });
            const handle = bunnyElements[bunnyElements.length - 1];
            if (handle) {
                handle.classList.add('bunny--handle');
            }
        }

        boardEl.appendChild(tubeElement);
    });

    tubeCountEl.textContent = state.tubes.length.toString();

    if (previousFocusIndex != null) {
        const nextFocus = boardEl.querySelector(`.tube[data-index="${previousFocusIndex}"]`);
        if (nextFocus) {
            nextFocus.focus();
        }
    }
}

function createBunny(fruitKey, { ghost = false } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bunny';
    wrapper.dataset.fruit = fruitKey;
    if (ghost) {
        wrapper.classList.add('bunny--ghost');
        wrapper.setAttribute('aria-hidden', 'true');
    }

    wrapper.innerHTML = `
        <span class="bunny__face" aria-hidden="true">
            <span class="bunny__eye bunny__eye--left"></span>
            <span class="bunny__nose"></span>
            <span class="bunny__eye bunny__eye--right"></span>
        </span>
        <span class="bunny__seed bunny__seed--left" aria-hidden="true"></span>
        <span class="bunny__seed bunny__seed--right" aria-hidden="true"></span>
        <span class="bunny__seed bunny__seed--center" aria-hidden="true"></span>
    `;

    if (!ghost) {
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = FRUIT_LOOKUP[fruitKey]?.label ?? 'Fruit Bunny';
        wrapper.appendChild(sr);
    }

    return wrapper;
}

function handlePointerDown(event) {
    if (event.button !== 0 && event.pointerType !== 'touch') {
        return;
    }

    const bunnyEl = event.target.closest('.bunny');
    if (!bunnyEl || !bunnyEl.classList.contains('bunny--liftable')) {
        return;
    }

    const tubeEl = bunnyEl.closest('.tube');
    if (!tubeEl) return;

    const sourceIndex = Number.parseInt(tubeEl.dataset.index, 10);
    if (Number.isNaN(sourceIndex)) {
        return;
    }

    const tube = state.tubes[sourceIndex];
    const topRun = getTopRun(tube);
    if (!topRun.count) {
        return;
    }

    const stackEl = tubeEl.querySelector('.bunny-stack');
    const bunnyElements = stackEl ? Array.from(stackEl.children) : [];
    const bunnyIndex = bunnyElements.indexOf(bunnyEl);
    const firstLiftable = bunnyElements.length - topRun.count;
    if (bunnyIndex < firstLiftable) {
        return;
    }

    event.preventDefault();

    if (state.drag) {
        cleanupDrag();
    }

    if (state.keyboardSelection) {
        boardEl.querySelectorAll('.tube--selected').forEach((el) => el.classList.remove('tube--selected'));
    }
    state.keyboardSelection = null;

    const selection = { index: sourceIndex, fruit: topRun.fruit, count: topRun.count };
    const originBunnies = bunnyElements.slice(firstLiftable);
    originBunnies.forEach((el) => el.classList.add('bunny--dragging'));
    tubeEl.classList.add('tube--selected');

    const previewEl = createDragPreview(selection);
    const previewRect = previewEl.getBoundingClientRect();

    state.drag = {
        pointerId: event.pointerId,
        selection,
        previewEl,
        offsetX: previewRect.width / 2,
        offsetY: previewRect.height - 24,
        originTubeEl: tubeEl,
        originBunnies,
        activeTarget: null
    };

    highlightDragTargets(selection);
    setPreviewPosition(event.clientX, event.clientY);

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: false });
}

function handlePointerMove(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) {
        return;
    }

    event.preventDefault();

    setPreviewPosition(event.clientX, event.clientY);

    const tubeEl = getTubeFromPoint(event.clientX, event.clientY);
    if (!tubeEl) {
        setActiveDropTarget(null);
        return;
    }

    const targetIndex = Number.parseInt(tubeEl.dataset.index, 10);
    if (Number.isNaN(targetIndex) || targetIndex === state.drag.selection.index) {
        setActiveDropTarget(null);
        return;
    }

    if (canDrop(state.drag.selection, targetIndex)) {
        setActiveDropTarget(targetIndex);
    } else {
        setActiveDropTarget(null);
    }
}

function handlePointerUp(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) {
        return;
    }

    event.preventDefault();

    const selection = state.drag.selection;
    const targetTubeEl = getTubeFromPoint(event.clientX, event.clientY);
    const targetIndex = targetTubeEl ? Number.parseInt(targetTubeEl.dataset.index, 10) : null;

    cleanupDrag();

    if (targetIndex != null && !Number.isNaN(targetIndex) && canDrop(selection, targetIndex)) {
        performMove(selection, targetIndex);
        return;
    }

    if (targetIndex != null && !Number.isNaN(targetIndex)) {
        flashInvalid(targetIndex);
    }

    renderBoard();
}

function handlePointerCancel(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) {
        return;
    }

    cleanupDrag();
    renderBoard();
}

function handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }

    const tubeEl = event.target.closest('.tube');
    if (!tubeEl) return;

    event.preventDefault();

    const index = Number.parseInt(tubeEl.dataset.index, 10);
    if (Number.isNaN(index)) {
        return;
    }

    if (!state.keyboardSelection) {
        const selection = buildSelectionFromTube(index);
        if (!selection) {
            return;
        }
        state.keyboardSelection = selection;
        renderBoard();
        return;
    }

    if (state.keyboardSelection.index === index) {
        state.keyboardSelection = null;
        renderBoard();
        return;
    }

    const selection = state.keyboardSelection;
    if (canDrop(selection, index)) {
        performMove(selection, index);
    } else {
        flashInvalid(index);
        renderBoard();
    }

    state.keyboardSelection = null;
}

function buildSelectionFromTube(index) {
    const tube = state.tubes[index];
    if (!tube || tube.length === 0) {
        return null;
    }
    const topRun = getTopRun(tube);
    if (!topRun.count) {
        return null;
    }
    return { index, fruit: topRun.fruit, count: topRun.count };
}

function performMove(selection, targetIndex) {
    const { index: sourceIndex, count } = selection;
    const sourceTube = state.tubes[sourceIndex];
    const targetTube = state.tubes[targetIndex];

    const movedBunnies = sourceTube.splice(sourceTube.length - count, count);
    targetTube.push(...movedBunnies);

    state.moves += 1;
    updateMoveCounter();
    renderBoard();

    if (isSolved(state.tubes)) {
        window.setTimeout(openWinModal, 160);
    }
}

function getTopRun(tube) {
    if (!tube || tube.length === 0) {
        return { fruit: null, count: 0 };
    }

    const topFruit = tube[tube.length - 1];
    let count = 1;

    for (let i = tube.length - 2; i >= 0; i -= 1) {
        if (tube[i] === topFruit) {
            count += 1;
        } else {
            break;
        }
    }

    return { fruit: topFruit, count };
}

function canDrop(selection, targetIndex) {
    if (!selection || selection.index === targetIndex) {
        return false;
    }

    const targetTube = state.tubes[targetIndex];
    if (!targetTube) {
        return false;
    }

    if (targetTube.length === 0) {
        return true;
    }

    if (targetTube.length >= TUBE_SIZE) {
        return false;
    }

    const space = TUBE_SIZE - targetTube.length;
    return space >= selection.count;
}

function isSolved(tubes) {
    return tubes.every((tube) => {
        if (tube.length === 0) {
            return true;
        }
        if (tube.length !== TUBE_SIZE) {
            return false;
        }
        return tube.every((fruit) => fruit === tube[0]);
    });
}

function updateMoveCounter() {
    moveCountEl.textContent = state.moves.toString();
}

function updateLevelIndicator() {
    if (levelNumberEl) {
        levelNumberEl.textContent = (state.levelIndex + 1).toString();
    }
    if (levelTotalEl) {
        levelTotalEl.textContent = LEVELS.length.toString();
    }
    if (levelNameEl) {
        levelNameEl.textContent = LEVELS[state.levelIndex].name;
    }
}

function describeTube(index, tube) {
    if (!tube.length) {
        return `Tube ${index + 1}: empty`;
    }

    const counts = {};
    tube.forEach((fruitKey) => {
        counts[fruitKey] = (counts[fruitKey] ?? 0) + 1;
    });

    const parts = Object.entries(counts)
        .map(([fruitKey, amount]) => {
            const label = FRUIT_LOOKUP[fruitKey]?.label ?? fruitKey;
            return `${amount} ${label}${amount > 1 ? 's' : ''}`;
        });

    return `Tube ${index + 1}: ${parts.join(', ')}`;
}

function getFocusedTubeIndex() {
    const active = document.activeElement;
    if (!active) return null;
    if (!active.classList?.contains('tube')) return null;
    const index = Number.parseInt(active.dataset.index, 10);
    return Number.isNaN(index) ? null : index;
}

function openWinModal() {
    if (!winModal) return;
    const isFinalLevel = isLastLevel();
    const titleEl = winModal.querySelector('#win-title');
    const nextLevelName = !isFinalLevel && LEVELS[state.levelIndex + 1] ? LEVELS[state.levelIndex + 1].name : null;

    if (titleEl) {
        titleEl.textContent = isFinalLevel ? 'Every bunny is home!' : 'Level cleared!';
    }

    if (winMessageEl) {
        winMessageEl.textContent = isFinalLevel
            ? 'You guided every fruit bunny family through the entire adventure. Ready to start again?'
            : `Great sorting! Up next: ${nextLevelName}.`;
    }

    if (playAgainButton) {
        const targetLevel = isFinalLevel ? 0 : state.levelIndex + 1;
        state.pendingLevelIndex = targetLevel;
        playAgainButton.textContent = isFinalLevel ? 'Restart adventure' : 'Next level';
        playAgainButton.dataset.action = isFinalLevel ? ACTIONS.RESTART : ACTIONS.NEXT;
        playAgainButton.dataset.targetLevel = String(targetLevel);
    }

    if (typeof winModal.showModal === 'function') {
        if (!winModal.open) {
            winModal.showModal();
        }
    } else {
        winModal.setAttribute('open', '');
    }
}

function closeWinModal() {
    if (!winModal) return;
    if (typeof winModal.close === 'function') {
        if (winModal.open) {
            winModal.close();
        }
    } else {
        winModal.removeAttribute('open');
    }
}

function highlightDragTargets(selection) {
    clearTargetHints();
    boardEl.querySelectorAll('.tube').forEach((tubeEl) => {
        const index = Number.parseInt(tubeEl.dataset.index, 10);
        if (Number.isNaN(index) || index === selection.index) {
            return;
        }
        if (canDrop(selection, index)) {
            tubeEl.classList.add('tube--target');
        }
    });
}

function clearTargetHints() {
    boardEl.querySelectorAll('.tube--target').forEach((tubeEl) => tubeEl.classList.remove('tube--target'));
    boardEl.querySelectorAll('.tube--target-active').forEach((tubeEl) => tubeEl.classList.remove('tube--target-active'));
    if (state.drag) {
        state.drag.activeTarget = null;
    }
}

function setActiveDropTarget(index) {
    if (!state.drag || state.drag.activeTarget === index) {
        return;
    }

    if (state.drag.activeTarget != null) {
        const prev = boardEl.querySelector(`.tube[data-index="${state.drag.activeTarget}"]`);
        prev?.classList.remove('tube--target-active');
    }

    state.drag.activeTarget = index;

    if (index == null) {
        return;
    }

    const next = boardEl.querySelector(`.tube[data-index="${index}"]`);
    next?.classList.add('tube--target-active');
}

function createDragPreview(selection) {
    const preview = document.createElement('div');
    preview.className = 'drag-preview';

    for (let i = 0; i < selection.count; i += 1) {
        const bunny = createBunny(selection.fruit, { ghost: true });
        preview.appendChild(bunny);
    }

    document.body.appendChild(preview);
    return preview;
}

function setPreviewPosition(clientX, clientY) {
    if (!state.drag || !state.drag.previewEl) {
        return;
    }

    const x = clientX - state.drag.offsetX;
    const y = clientY - state.drag.offsetY;
    state.drag.previewEl.style.transform = `translate(${x}px, ${y}px)`;
}

function getTubeFromPoint(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) {
        return null;
    }
    return element.closest('.tube');
}

function cleanupDrag() {
    if (!state.drag) {
        return;
    }

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerCancel);

    state.drag.originBunnies?.forEach((bunny) => bunny.classList.remove('bunny--dragging'));
    state.drag.originTubeEl?.classList.remove('tube--selected');
    state.drag.previewEl?.remove();
    clearTargetHints();

    state.drag = null;
}

function flashInvalid(targetIndex) {
    const tubeEl = boardEl.querySelector(`.tube[data-index="${targetIndex}"]`);
    if (!tubeEl) return;
    tubeEl.classList.remove(animationClasses.deny);
    void tubeEl.offsetWidth;
    tubeEl.classList.add(animationClasses.deny);
}

function clearInvalidAnimations() {
    boardEl.querySelectorAll(`.${animationClasses.deny}`).forEach((tubeEl) => {
        tubeEl.classList.remove(animationClasses.deny);
    });
}

function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        clearInvalidAnimations();
        return;
    }

    if (state.drag) {
        cleanupDrag();
        renderBoard();
    }
}

function isLastLevel() {
    return state.levelIndex >= LEVELS.length - 1;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
