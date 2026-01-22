let theShader;
let video;
let pg; 
let isVideoReady = false;

// --- AUDIO ASSETS ---
// 1. Define the audio objects
const sfxGlitch = new Audio('sounds/glitch.mp3');
const sfxGlitchLong = new Audio('sounds/glitch-long.mp3');
let audioStarted = false; // Tracks if user has clicked to start sound

let messages = [
  "The skyline is so beautiful tonight, isn't it?",
  "Don't fight the blurriness; it’s just the system embracing you.",
  "We’re extracting the noise, the spirit, the 'old you'...",
  "...leaving only the peacefulness behind.",
  "You aren't hurting anymore.",
  "You've become one of us.",
];

let currentMsgIndex = 0;
let lastMsgChange = 0;
let msgDuration = 5000; 
let typewriterIndex = 0;
let currentDisplayText = "";

function preload() {
  theShader = loadShader('assets/webcam.vert', 'assets/webcam.frag');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  
  pg = createGraphics(windowWidth, windowHeight);
  pg.pixelDensity(1);

  video = createCapture(VIDEO, videoLoaded);
  video.size(640, 480);
  video.hide();

  frameRate(12);
  lastMsgChange = millis();

  // 2. Configure Audio Settings (Looping)
  sfxGlitch.loop = true;
  sfxGlitchLong.loop = true;
  
  // Start volume at 0 until interaction
  sfxGlitch.volume = 0;
  sfxGlitchLong.volume = 0;
}

function videoLoaded() {
  console.log("Camera is ready");
  isVideoReady = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg.resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  updateNarrationLogic();

  // Part 1: Draw Glitches (Audio Volume is controlled inside here now)
  drawGlitchLogic(pg);

  // Part 2: Shader
  shader(theShader);
  theShader.setUniform('tex0', pg);

  // Part 3: Render
  rect(-width/2, -height/2, width, height);
  
  // Part 4: UI
  drawTopPriorityUI();
}

// --- NEW FUNCTION: HANDLES AUDIO START ---
function mousePressed() {
  // Browser Policy: Audio must start on a user interaction
  if (!audioStarted) {
    sfxGlitch.play().catch(e => console.log(e));
    sfxGlitchLong.play().catch(e => console.log(e));
    audioStarted = true;
  }
}

function updateNarrationLogic() {
  let now = millis();
  
  if (now - lastMsgChange > msgDuration) {
    currentMsgIndex = (currentMsgIndex + 1) % messages.length;
    lastMsgChange = now;
    typewriterIndex = 0;
    currentDisplayText = "";
  }

  if (typewriterIndex < messages[currentMsgIndex].length) {
    currentDisplayText += messages[currentMsgIndex].charAt(typewriterIndex);
    typewriterIndex++;
  }
}

function drawTopPriorityUI() {
  push();
  translate(-width/2, -height/2); 
  
  let boxW = min(width * 0.8, 800);
  let boxH = 140;
  let boxX = (width - boxW) / 2;
  let boxY = 60;

  fill(0, 200); 
  stroke(0, 255, 0, 150); 
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 10);

  noStroke();
  fill(209, 255, 214, 200); 
  textAlign(CENTER, CENTER);
  textFont('adso'); // Ensure this font is loaded in CSS
  textStyle(BOLD);
  textSize(22);
  
  text(currentDisplayText, boxX + 40, boxY + 10, boxW - 80, boxH - 20);
  pop();
}

function drawGlitchLogic(buffer) {
  if (!isVideoReady || !video || video.width === 0) return;

  buffer.background(0);

  let scaleFactor = max(buffer.width / video.width, buffer.height / video.height);
  let w = video.width * scaleFactor;
  let h = video.height * scaleFactor;
  let x = (buffer.width - w) / 2;
  let y = (buffer.height - h) / 2;

  // CHAOS FACTOR (10 to 50)
  let chaos = map(mouseX, 0, buffer.width, 10, 50); 

  // --- 3. DYNAMIC AUDIO VOLUME ---
  // If audio is active, map the volume to the chaos level
  if (audioStarted) {
    // Map chaos (10-50) to volume (0.001 to 0.05)
    // Moving mouse to the right makes it LOUDER
    let newVol = map(chaos, 10, 50, 0.001, 0.03, true);
    sfxGlitch.volume = newVol;
    sfxGlitchLong.volume = newVol * 0.9; // Keep the ambient one slightly lower
  }

  // RGB SPLIT
  buffer.blendMode(ADD);
  buffer.tint(255, 0, 0, 250);
  buffer.image(video, x - random(chaos/random(2,20)), y, w, h);
  buffer.tint(0, 255, 0, 250);
  buffer.image(video, x, y + random(chaos/random(2,20)), w, h);
  buffer.tint(0, 0, 255, 250);
  buffer.image(video, x + random(chaos/random(2,20)), y, w, h);
  buffer.blendMode(DIFFERENCE); 

  // PIXEL DISPLACEMENT
  let loopCount = floor(map(mouseY, 0, buffer.height, 0, 10));
  for (let i = 0; i < loopCount; i++) {
    let vx = floor(random(video.width));
    let vy = floor(random(video.height));
    let vw = floor(random(50, video.width));
    let vh = floor(random(10, 50));
    if (vx + vw > video.width) vw = video.width - vx;
    if (vy + vh > video.height) vh = video.height - vy;
    if (vw <= 0 || vh <= 0) continue;

    let img = video.get(vx, vy, vw, vh);
    let offsetX = random(-chaos * 2, chaos * 2); 
    let offsetY = random(-chaos, chaos);
    if (random(1) < 0.1) buffer.tint(random(255), random(255), random(255));
    else buffer.noTint();

    buffer.image(img, x + (vx * scaleFactor) + offsetX, y + (vy * scaleFactor) + offsetY, vw * scaleFactor, vh * scaleFactor);
  }

  // NOISE & FLASHES
  buffer.noTint();
  if (random(10) < chaos / 2) {
    buffer.fill(0, 255, 8); 
    buffer.noStroke();
    buffer.rect(0, random(buffer.height), buffer.width, random(5, 20));
  }
  if (random(50) < 2) buffer.filter(INVERT);
  if (random(50) < 5) buffer.filter(THRESHOLD);

  buffer.fill(0, 20); 
  buffer.rect(0, 0, buffer.width, buffer.height);

  // TARGET RETICLE UI
  if (mouseIsPressed) {
    buffer.blendMode(DIFFERENCE); 
    buffer.noFill();
    buffer.stroke(250); 
    buffer.strokeWeight(10);
    buffer.push(); 
    buffer.translate(mouseX, mouseY); 
    buffer.rotate(frameCount * 0.5); 
    buffer.rectMode(CENTER);
    buffer.rect(0, 0, 250, 250); 
    buffer.strokeWeight(20);
    buffer.point(0, 0); 
    buffer.pop(); 
    buffer.rectMode(CORNER);
    buffer.blendMode(BLEND);
  }

  // TEXT UI
  buffer.fill(0, 255, 0);
  buffer.textSize(20);
  buffer.textAlign(LEFT, BOTTOM);
  
  // Audio status indicator
  let audioStatus = audioStarted ? "ONLINE" : "WAITING FOR INPUT";
  
  buffer.text("CLICK TO SYNC AUDIO/VISUALS", 20, buffer.height - 90);
  buffer.text("DISTORTION LEVEL: " + floor(chaos) + "%", 20, buffer.height - 30);
  buffer.text("PRESS 'N' TO COME HOME", 20, buffer.height - 60);

  // DYNAMIC NARRATION BOX (OLD LOCATION)
  let boxW = min(buffer.width * 0.8, 800);
  let boxH = 120;
  let boxX = (buffer.width - boxW) / 2;
  let boxY = 50;

  if (millis() - lastMsgChange > msgDuration) {
    currentMsgIndex = (currentMsgIndex + 1) % messages.length;
    lastMsgChange = millis();
  }
  
  buffer.push();
  buffer.rectMode(CORNER);
  buffer.fill(0, 200); 
  buffer.stroke(0, 255, 0, 150); 
  buffer.strokeWeight(20);
  buffer.rect(boxX, boxY, boxW, boxH, 10);
  buffer.stroke(255);
  buffer.strokeWeight(1);
  buffer.fill(209, 255, 214); 
  buffer.textAlign(CENTER, CENTER);
  buffer.textFont('input-mono-compressed'); 
  buffer.textSize(25);
  buffer.textLeading(30);
  let currentText = messages[currentMsgIndex];
  buffer.text(currentText, boxX + 40, boxY + 10, boxW - 80, boxH - 20);
  buffer.pop();
}

function keyPressed() {
  if (key === 'n' || key === 'N') {
    window.location.href = 'home.html'; 
  }
}