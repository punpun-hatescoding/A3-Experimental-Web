
let theShader;
let video;
let pg; // The "Paper Graphics" buffer where we draw the glitches
let isVideoReady = false;
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
let msgDuration = 5000; // Increased to 5s for easier reading
let typewriterIndex = 0;
let currentDisplayText = "";

function preload() {
  theShader = loadShader('assets/webcam.vert', 'assets/webcam.frag');
}

function setup() {
  // 1. Main Canvas in WEBGL mode (Required for Shaders)
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  
  // 2. The Graphics Buffer (P2D mode for Text/Images/BlendModes)
  pg = createGraphics(windowWidth, windowHeight);
  pg.pixelDensity(1);

  // 3. Webcam Setup
  video = createCapture(VIDEO, videoLoaded);
  video.size(640, 480);
  video.hide();

  // Cap frame rate for that chunky cinematic feel
  frameRate(12);
  lastMsgChange = millis();
}

function videoLoaded() {
  console.log("Camera is ready");
  isVideoReady = true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // We must also resize the buffer
  pg.resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  updateNarrationLogic();
  // --- PART 1: DRAW GLITCHES TO THE BUFFER (pg) ---
  // We call a custom function that handles all the 2D logic
  // We pass 'pg' so it draws to the buffer, not the screen
  drawGlitchLogic(pg);

  // --- PART 2: APPLY SHADER TO THE BUFFER ---
  shader(theShader);

  // Pass the entire glitch buffer as a texture to the shader
  theShader.setUniform('tex0', pg);

  // You can also pass other data if your shader supports it:
  // theShader.setUniform('u_time', millis() / 1000.0);
  // theShader.setUniform('u_resolution', [width, height]);

  // --- PART 3: RENDER TO SCREEN ---
  // Draw a rectangle covering the WEBGL screen
  // WEBGL coordinates start at center (0,0), so we offset by half width/height
  rect(-width/2, -height/2, width, height);
  // --- PART 4: TOP-PRIORITY UI OVERLAY ---
  drawTopPriorityUI();
}
function updateNarrationLogic() {
  let now = millis();
  
  // Logic to switch to next message
  if (now - lastMsgChange > msgDuration) {
    currentMsgIndex = (currentMsgIndex + 1) % messages.length;
    lastMsgChange = now;
    typewriterIndex = 0;
    currentDisplayText = "";
  }

  // Typewriter reveal logic (reveals 1 char per frame)
  if (typewriterIndex < messages[currentMsgIndex].length) {
    currentDisplayText += messages[currentMsgIndex].charAt(typewriterIndex);
    typewriterIndex++;
  }
}

function drawTopPriorityUI() {
  push();
  // Reset coordinates for 2D overlay
  translate(-width/2, -height/2); 
  
  let boxW = min(width * 0.8, 800);
  let boxH = 140;
  let boxX = (width - boxW) / 2;
  let boxY = 60;

  // Solid Box for maximum readability
  fill(0, 200); // Slightly more opaque background
  stroke(0, 255, 0, 150); // Neon Green Border
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 10);

  // Friendly Mint Text
  noStroke();
  fill(209, 255, 214, 200); // Warm Mint Green
  textAlign(CENTER, CENTER);
  textFont('adso');
  textStyle(BOLD);
  textSize(22);
  
  // Display the typewriter text
  text(currentDisplayText, boxX + 40, boxY + 10, boxW - 80, boxH - 20);
  pop();
}
// ==================================================
//      THE GLITCH LOGIC (Adapted for Buffer)
// ==================================================
function drawGlitchLogic(buffer) {
  if (!isVideoReady || !video || video.width === 0) return;

  // Clear the buffer background
  buffer.background(0);

  // --- 1. SETUP SCALING ---
  let scaleFactor = max(buffer.width / video.width, buffer.height / video.height);
  let w = video.width * scaleFactor;
  let h = video.height * scaleFactor;
  // Note: Buffer is P2D, so (0,0) is top-left
  let x = (buffer.width - w) / 2;
  let y = (buffer.height - h) / 2;

  // CHAOS FACTOR
  let chaos = map(mouseX, 0, buffer.width, 10, 50); 

  // --- 2. RGB CHANNEL SPLIT ---
  buffer.blendMode(ADD);
  
  // RED
  buffer.tint(255, 0, 0, 250);
  buffer.image(video, x - random(chaos/random(2,20)), y, w, h);
  
  // GREEN
  buffer.tint(0, 255, 0, 250);
  buffer.image(video, x, y + random(chaos/random(2,20)), w, h);
  
  // BLUE
  buffer.tint(0, 0, 255, 250);
  buffer.image(video, x + random(chaos/random(2,20)), y, w, h);
  
  buffer.blendMode(DIFFERENCE); 

  // --- 3. PIXEL DISPLACEMENT ---
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

    if (random(1) < 0.1) {
      buffer.tint(random(255), random(255), random(255));
    } else {
      buffer.noTint();
    }

    buffer.image(
      img,
      x + (vx * scaleFactor) + offsetX,
      y + (vy * scaleFactor) + offsetY,
      vw * scaleFactor,
      vh * scaleFactor
    );
  }

  // --- 4. NOISE & FLASHES ---
  // Reset Tint
  buffer.noTint();
  
  if (random(10) < chaos / 2) {
    buffer.fill(0, 255, 8); // Neon Green Noise
    buffer.noStroke();
    buffer.rect(0, random(buffer.height), buffer.width, random(5, 20));
  }

  // Flashes (Applied to the buffer)
  if (random(50) < 2) buffer.filter(INVERT);
  if (random(50) < 5) buffer.filter(THRESHOLD);

  // --- 5. DARK OVERLAY ---
  buffer.fill(0, 20); 
  buffer.rect(0, 0, buffer.width, buffer.height);

  // --- 6. TARGET RETICLE UI ---
  if (mouseIsPressed) {
    buffer.blendMode(DIFFERENCE); 
    
    buffer.noFill();
    buffer.stroke(250); 
    buffer.strokeWeight(10);
    
    buffer.push(); 
    buffer.translate(mouseX, mouseY); 
    buffer.rotate(frameCount * 0.5); 
    
    buffer.rectMode(CENTER);
    buffer.rect(0, 0, 250, 250); // Box
    
    buffer.strokeWeight(20);
    buffer.point(0, 0); // Dot
    
    buffer.pop(); 
    
    buffer.rectMode(CORNER);
    buffer.blendMode(BLEND);
  }

  // --- 7. TEXT UI ---
  buffer.fill(0, 255, 0);
  buffer.textSize(20);
  buffer.textAlign(LEFT, BOTTOM);
  buffer.text("CLICK & HOLD TO READ THE NARRATIVE", 20, buffer.height - 90);
  buffer.text("DISTORTION LEVEL: " + floor(chaos) + "%", 20, buffer.height - 30);
  buffer.text("PRESS 'N' TO ARRIVE HOME", 20, buffer.height - 60);
  // --- 8. DYNAMIC NARRATION LOOP ---
  let boxW = min(buffer.width * 0.8, 800);
  let boxH = 120;
  let boxX = (buffer.width - boxW) / 2;
  let boxY = 50;

  // Handle Logic: Change message over time
  if (millis() - lastMsgChange > msgDuration) {
    currentMsgIndex = (currentMsgIndex + 1) % messages.length;
    lastMsgChange = millis();
  }

  // Draw the Box
  buffer.push();
  buffer.rectMode(CORNER);
  buffer.fill(0, 200); //
  buffer.stroke(0, 255, 0, 150); // Neon Green Border
  buffer.strokeWeight(20);
  buffer.rect(boxX, boxY, boxW, boxH, 10);

  // Draw the Text
  buffer.stroke(255);
  buffer.strokeWeight(1);
  buffer.fill(209, 255, 214); // Warm Mint Green
  buffer.textAlign(CENTER, CENTER);
  buffer.textFont('Courier New'); // Monospaced for that digital feel
  buffer.textSize(25);
  buffer.textLeading(30);
  
  // Display the current message in the loop
  let currentText = messages[currentMsgIndex];
  buffer.text(currentText, boxX + 40, boxY + 10, boxW - 80, boxH - 20);
  buffer.pop();
}

function keyPressed() {
  if (key === 'n' || key === 'N') {
    window.location.href = 'home.html'; 
  }
}