// ==========================================
//           GLOBAL VARIABLES
// ==========================================
let isAmbushActive = false; // False = Shooting, True = Scanning

// DOM Elements
const shootingScene = document.querySelector('.bg-shooting');
const p5Container = document.getElementById('p5-container');
const aimCursor = document.getElementById('aim-cursor');
const tunnelVision = document.getElementById('tunnel-vision');

// Intel Elements
const dogtagListElement = document.getElementById('dogtag-list');
const intelCounterElement = document.getElementById('intel-counter');
let confirmedKills = 0;

// Sounds
const gunshotSound = new Audio('sounds/shot-faraway.mp3'); 

// Fake Data for Intel
const ranks = ['PVT', 'PFC', 'CPL', 'SGT', 'SSG', 'LT', 'CPT', 'MAJ'];
const lastNames = ['CHEN', 'IVANOV', 'NGUYEN', 'SMITH', 'GARCIA', 'MULLER', 'KIM', 'ABADI'];
const firstInitials = ['A.', 'B.', 'J.', 'M.', 'D.', 'R.', 'S.', 'T.'];

// Initialize Dust Particles
createDustParticles();

// ==========================================
//        PART 1: THE RANDOM AMBUSH TIMER
// ==========================================

// Start the Ambush Loop immediately
scheduleNextAmbush();

function scheduleNextAmbush() {
    // Random time between 5 and 6 seconds
    // This creates the tension: you never know when it will happen
    const timeToWait = Math.random() * 1000 + 5000; 
    console.log(`Next Ambush in ${Math.floor(timeToWait/1000)}s...`);
    
    setTimeout(() => {
        // Only trigger if we are still playing and not dead
        if (!gameOver) {
            triggerAmbush();
        }
    }, timeToWait);
}

function triggerAmbush() {
    isAmbushActive = true;
    
    // 1. Show P5 Canvas (The Scanner)
    p5Container.classList.remove('hidden');
    
    // 2. Reset Scanner Variables
    movingPixelCount = 0;
    gameOver = false;
    
    // 3. Grace Period (Warm-up)
    // We give the camera ~1.5 seconds (80 frames) to stabilize 
    // before we start killing the player for moving.
    ambushGracePeriod = 80; 
    
    // 4. Survival Timer (5 Seconds)
    // If you survive 5 seconds of scanning, you go back to shooting
    setTimeout(() => {
        if (!gameOver && isAmbushActive) {
            endAmbush();
        }
    }, 5000);
}

function endAmbush() {
    console.log("Ambush Survived. Returning to combat.");
    isAmbushActive = false;
    p5Container.classList.add('hidden');
    
    // Queue the next random ambush
    scheduleNextAmbush();
}

// ==========================================
//        PART 2: P5.JS (MOTION SCAN)
// ==========================================
let video;
let prevFrame;
let isVideoReady = false;
let density = " .:-=+*#%@abcdefg";
let gameOver = false;
let movingPixelCount = 0;
let movementLimit = 2000; // Sensitivity (Lower = Harder)
let ambushGracePeriod = 0; 

function setup() {
    let cnv = createCanvas(windowWidth, windowHeight);
    cnv.parent('p5-container');
    pixelDensity(1); 

    video = createCapture(VIDEO, () => {
        isVideoReady = true;
    });
    // Low res for performance
    video.size(100, 80);
    video.hide();
    prevFrame = createImage(100, 80);
}

function draw() {
    // Stop P5 loop if we are shooting
    if (!isAmbushActive) return;

    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    background(0);
    if (!isVideoReady) return;

    video.loadPixels();
    prevFrame.loadPixels();

    // Aspect Ratio Logic
    let cellSize = max(width / video.width, height / video.height);
    let offsetX = (width - video.width * cellSize) / 2;
    let offsetY = (height - video.height * cellSize) / 2;

    textSize(cellSize);
    textAlign(CENTER, CENTER);
    noStroke();

    movingPixelCount = 0; 
    let motionThreshold = 15;

    for (let y = 0; y < video.height; y++) {
        for (let x = 0; x < video.width; x++) {
            let index = (x + y * video.width) * 4;
            
            let r1 = video.pixels[index];
            let g1 = video.pixels[index+1];
            let b1 = video.pixels[index+2];
            let r2 = prevFrame.pixels[index];
            let g2 = prevFrame.pixels[index+1];
            let b2 = prevFrame.pixels[index+2];

            let diff = dist(r1, g1, b1, r2, g2, b2);

            if (diff > motionThreshold) {
                movingPixelCount++;
                let avg = (r1 + g1 + b1) / 3;
                let charIndex = floor(map(avg, 0, 255, 0, density.length - 1));
                let c = density.charAt(charIndex);
                let xPos = (video.width - 1 - x) * cellSize;
                let yPos = y * cellSize;

                fill(255);
                text(c, offsetX + xPos, offsetY + yPos);
            }
        }
    }

    // --- GAME OVER LOGIC ---
    if (ambushGracePeriod > 0) {
        // Countdown the warm-up period
        ambushGracePeriod--; 
        fill(0, 255, 0);
        textSize(20);
        text("CALIBRATING SENSORS...", width/2, height - 50);
    } else {
        // Active Danger Mode
        if (movingPixelCount > movementLimit && isAmbushActive) {
            gameOver = true;
        }
    }

    prevFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
    drawP5UI();
}

function drawP5UI() {
    push();
    fill(255, 0, 0);
    textAlign(CENTER);
    textSize(30);
    text("FREEZE! SCANNER ACTIVE", width/2, 100);
    
    let barWidth = 300;
    let displayCount = constrain(movingPixelCount, 0, movementLimit);
    let barFill = map(displayCount, 0, movementLimit, 0, barWidth);
    
    noFill(); stroke(255);
    rect(width/2 - barWidth/2, 130, barWidth, 20);
    
    if (movingPixelCount > movementLimit * 0.8) fill(255, 0, 0);
    else fill(0, 255, 0);
    
    noStroke();
    rect(width/2 - barWidth/2, 130, barFill, 20);
    pop();
}

function drawGameOverScreen() {
    background(10, 0, 0);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    textSize(50);
    text("MOVEMENT DETECTED", width/2, height/2);
    textSize(20);
    text("YOU WERE CAUGHT. CLICK TO RESTART.", width/2, height/2 + 60);
}

function mousePressed() {
    if (gameOver && isAmbushActive) {
        window.location.href = 'index.html';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}


// ==========================================
//        PART 3: SHOOTING LOGIC (DOM)
// ==========================================

window.addEventListener('mousemove', (e) => {
    aimCursor.style.left = e.clientX + 'px';
    aimCursor.style.top = e.clientY + 'px';
    tunnelVision.style.setProperty('--x', e.clientX + 'px');
    tunnelVision.style.setProperty('--y', e.clientY + 'px');
    
    if (!isAmbushActive) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const mouseX = (e.clientX - cx) / cx;
        const mouseY = (e.clientY - cy) / cy;

        const tiltX = mouseY * -5; 
        const tiltY = mouseX * 5;  
        const bgPanX = mouseX * -20; 
        const bgPanY = mouseY * -20;

        shootingScene.style.transform = `
            scale(1.1) 
            rotateX(${tiltX}deg) 
            rotateY(${tiltY}deg) 
            translate(${bgPanX}px, ${bgPanY}px)
        `;
    }
});

shootingScene.addEventListener('click', (e) => {
    // DISABLE SHOOTING IF AMBUSH IS ACTIVE
    if (isAmbushActive) return;

    shootBullet(e);

    if (e.target.classList.contains('silhouette-target')) {
        if (!e.target.classList.contains('silhouette-dead')) {
             targetHit(e.target);
        }
    }
    triggerTunnelRecoil();
});

function shootBullet(e) {
    const soundClone = gunshotSound.cloneNode();
    soundClone.volume = Math.random() * 0.15 + 0.05; 
    soundClone.play();
    
    const bullet = document.createElement('div');
    bullet.classList.add('bullet-hole');
    
    const flowers = ['🌸', '🌹', '🌻', '🌼', '🌷', '🌺'];
    bullet.textContent = flowers[Math.floor(Math.random() * flowers.length)];
    
    const depthScale = Math.random() * 0.6 + 0.4; 
    const finalSize = 50 * depthScale; 
    bullet.style.fontSize = finalSize + 'px';
    bullet.style.left = (e.clientX - finalSize / 2) + 'px';
    bullet.style.top = (e.clientY - finalSize / 2) + 'px';
    bullet.style.transform = `rotate(${Math.floor(Math.random()*360)}deg)`;

    if (depthScale < 0.6) {
        bullet.style.filter = "blur(1px)";
        bullet.style.opacity = "0.8";
    }

    shootingScene.appendChild(bullet);
}

function targetHit(targetElement) {
    targetElement.classList.add('silhouette-dead');

    // Generate Intel
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const name = firstInitials[Math.floor(Math.random() * firstInitials.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
    const id = '#' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(10 + Math.random() * 90) + (Math.random() > 0.5 ? 'A' : 'B');

    // Add to Intel Panel
    const li = document.createElement('li');
    li.classList.add('dogtag-entry');
    li.innerHTML = `
        <span class="rank">${rank}</span>
        <span class="name">${name}</span>
        <span class="id">${id}</span>
    `;
    dogtagListElement.insertBefore(li, dogtagListElement.firstChild);

    confirmedKills++;
    intelCounterElement.textContent = confirmedKills;

    // --- CHECK FOR LEVEL COMPLETION ---
    const totalTargets = document.querySelectorAll('.silhouette-target').length;
    
    if (confirmedKills >= totalTargets) {
        // WIN CONDITION MET
        console.log("Mission Complete. All targets neutralized. Thank you for your service.");
        
        // 1. Wait a tiny bit for the last death animation to start
        setTimeout(() => {
            triggerWinScene();
        }, 500);
    }
}

// --- NEW FUNCTION: TRIGGERS THE WIN SCENE ---
function triggerWinScene() {
    // 1. Get Elements
    const winScreen = document.getElementById('win-screen');
    const progressBar = document.querySelector('.loader-progress');
    
    // 2. Reset the bar to 0% (Just in case it was already full from a previous run)
    progressBar.style.width = "0%";
    progressBar.style.transition = "none"; // Disable animation for the reset
    
    // 3. Make screen visible
    winScreen.classList.remove('hidden');
    winScreen.classList.add('active');
    
    // --- CRITICAL STEP: FORCE REFLOW ---
    // This line does nothing visually, but it forces the browser to 
    // calculate the layout (width: 0%) before moving to the next line.
    void progressBar.offsetWidth; 
    
    // 4. Re-enable animation and trigger the fill
    progressBar.style.transition = "width 7.5s linear"; 
    progressBar.style.width = "100%";

    // 5. Redirect after 6.5 seconds
    setTimeout(() => {
        window.location.href = 'distorted.html';
    }, 6500);
}

function triggerTunnelRecoil() {
    tunnelVision.style.background = `radial-gradient(circle 140px at var(--x) var(--y), transparent 0%, rgba(0,0,0,0.8) 40%, black 100%)`;
    setTimeout(() => { tunnelVision.style.background = ''; }, 100);
}

function createDustParticles() {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const dust = document.createElement('div');
        dust.classList.add('dust-particle');
        dust.style.left = Math.random() * 100 + 'vw';
        dust.style.top = Math.random() * 100 + 'vh';
        const depth = Math.random();
        dust.style.width = (depth * 4 + 1) + 'px';
        dust.style.height = (depth * 4 + 1) + 'px';
        dust.style.opacity = Math.random() * 0.5 + 0.1;
        shootingScene.appendChild(dust);
    }
}
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') {
        console.log("DEV MODE: Triggering Win Scene...");
        triggerWinScene();
    }
});
