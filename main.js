import * as THREE from 'three';
import { scene, camera, renderer, resizeRenderer, createLights } from './scene.js';
import { createBear, updateBear, BEAR_X_LIMIT } from './entities/bear.js';
import { createScenery } from './entities/scenery.js';
import { createWaterfall, updateWaterfall } from './entities/waterfall.js';
import { createFish, updateFish, isFishPastLog } from './entities/fish.js';
import { initAudio, playSFX, sounds, wireAudioUnlock } from './systems/audio.js';
import { bindUI, updateUIValues, showGameOver, showHUD, showStart } from './systems/ui.js';

// --- GAME OBJECTS (refactored) ---
const bear = createBear();
scene.add(bear);
const scenery = createScenery();
scene.add(scenery);
const waterfall = createWaterfall();
scene.add(waterfall);

// ensure lighting is present for Lambert materials
createLights(scene);

let activeFish = null;

// --- UI & STATE (refactored) ---
const {
  startScreen, gameOverScreen, scoreContainer, streakContainer,
  scoreEl, streakEl, finalScoreEl, startButton, restartButton
} = bindUI();

let gameState = { current: 'IDLE', score: 0, streak: 1 };

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
wireAudioUnlock(initAudio);

function startGame() {
    gameState = { current: 'PLAYING', score: 0, streak: 1 };
    bear.position.set(0, 4, 4);
    bear.rotation.set(0, Math.PI, 0);
    updateUIValues({ score: gameState.score, streak: gameState.streak });
    showHUD();
    try { initAudio(); } catch (e) { /* ignore */ }
    if (activeFish) {
        scene.children.forEach(child => { if (child.name === 'fish') scene.remove(child); });
    }
    activeFish = createFish(scene, gameState.score);
}

function gameOver() {
    gameState.current = 'GAME_OVER';
    finalScoreEl.innerText = gameState.score;
    showGameOver();
    playSFX(sounds.splash);
}

// --- CONTROLS (kept local for simplicity) ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let keysPressed = {};
let lastTouchX = null;
let isDragging = false;

function onPointerDown(event) {
    if (gameState.current !== 'PLAYING') return;
    if (event.target.tagName === 'BUTTON') return;
    isDragging = true;
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const intersect of intersects) {
        let object = intersect.object; let isLog = false;
        while (object.parent) {
            if (object.name === 'fish') break;
            if (object.name === 'log') { isLog = true; break; }
            object = object.parent;
        }
        if (object.name === 'fish' && object === activeFish) {
            playSFX(sounds.catch);
            gameState.score += 10 * gameState.streak;
            gameState.streak++;
            updateUIValues({ score: gameState.score, streak: gameState.streak });
            scene.remove(activeFish);
            activeFish = createFish(scene, gameState.score);
            break;
        }
        if (isLog) {
            bear.userData.targetX = THREE.MathUtils.clamp(intersect.point.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
            bear.userData.isMovingWithKeys = false;
            break;
        }
    }
}
function onPointerMove(event) {
    if (!isDragging || gameState.current !== 'PLAYING') return;
    const currentX = event.touches ? event.touches[0].clientX : event.clientX;
    if (lastTouchX !== null) {
        const deltaX = (currentX - lastTouchX) * 0.05;
        bear.userData.targetX = THREE.MathUtils.clamp(bear.position.x + deltaX, -BEAR_X_LIMIT, BEAR_X_LIMIT);
    }
    lastTouchX = currentX;
}
function onPointerUp() { isDragging = false; lastTouchX = null; }
function updatePointer(event) {
    const x = event.touches ? event.touches[0].clientX : event.clientX;
    const y = event.touches ? event.touches[0].clientY : event.clientY;
    pointer.x = (x / window.innerWidth) * 2 - 1;
    pointer.y = -(y / window.innerHeight) * 2 + 1;
    if (event.touches) lastTouchX = x;
}

function handleKeyDown(event) {
    if (gameState.current !== 'PLAYING') return;
    keysPressed[event.key] = true;
    if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
        bear.userData.isMovingWithKeys = true;
    }
}

function handleKeyUp(event) { keysPressed[event.key] = false; }

window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// mount renderer and handle sizing
import { mountRenderer } from './scene.js';
mountRenderer(document.getElementById('game-container'));
window.addEventListener('resize', resizeRenderer);

// --- GAME LOOP (trimmed) ---
const gravity = new THREE.Vector3(0, -0.05, 0);

function animate() {
    updateWaterfall(waterfall);
    if (gameState.current === 'PLAYING') {
        // Bear movement
        let moveDirection = 0;
        if (keysPressed['a'] || keysPressed['ArrowLeft']) moveDirection = -1;
        else if (keysPressed['d'] || keysPressed['ArrowRight']) moveDirection = 1;
        updateBear(bear, moveDirection);
        // Fish
        if (activeFish) {
            updateFish(activeFish);
            if (isFishPastLog(activeFish)) {
                gameState.streak = 1;
                updateUIValues({ score: gameState.score, streak: gameState.streak });
                gameOver();
            }
        }
    } else if (gameState.current === 'GAME_OVER') {
        if (bear.position.y > -10) {
            bear.position.add(gravity);
            bear.rotation.z += 0.05;
        }
    }
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);