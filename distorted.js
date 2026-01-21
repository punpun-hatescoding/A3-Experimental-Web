/*
 * COMBINED SKETCH
 * - Uses WEBGL for the main canvas (to support Shaders).
 * - Uses a separate Graphics Buffer (pg) for the Glitch logic (to support BlendModes/Text).
 */

let theShader;
let video;
let pg; // The "Paper Graphics" buffer where we draw the glitches
let isVideoReady = false;

function preload() {
  // Load the shader from your assets folder
  // Make sure you have 'assets/webcam.vert' and 'assets/webcam.frag'
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
  buffer.textSize(25);
  buffer.textAlign(LEFT, BOTTOM);
  buffer.text("DISTORTION LEVEL: " + floor(chaos) + "%", 20, buffer.height - 30);
}

function keyPressed() {
  if (key === 'n' || key === 'N') {
    window.location.href = 'index.html'; 
  }
}