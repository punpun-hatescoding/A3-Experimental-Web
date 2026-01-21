let video;
let isVideoLoaded = false;

// STATE MACHINE VARIABLES
let currentEffect = 1; 
let totalEffects = 5;
let lastSwitchTime = 0;
let switchInterval = 6000; // 6 Seconds per "Day"

// SURVIVAL TRACKING
let dayCount = 1;
const maxDays = 30; // Redirect triggers at Day 30

// EFFECT SPECIFIC VARIABLES
let particles = []; 
let prevFrame;
let invertColors = false; 
let useSquares = false;   
let asciiColor = 0;       

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1); 
  background(0);
  
  // Load Video
  video = createVideo(['images/running.mov'], onVideoLoad);
  video.size(640, 480); 
  video.hide();
  prevFrame = createImage(640, 480);
  
  textFont('Courier New');
  updateNarration(currentEffect);
}

function onVideoLoad() {
  isVideoLoaded = true;
  video.loop();
  video.volume(0);
}

function draw() {
  if (!isVideoLoaded) {
    background(0);
    fill(255);
    textAlign(CENTER);
    text("LOADING VIDEO...", width/2, height/2);
    return;
  }
  
  // --- AUTOMATIC SWITCHING & SURVIVAL CHECK ---
  if (millis() - lastSwitchTime > switchInterval) {
    let nextID = currentEffect + 1;
    if (nextID > 5) nextID = 1;
    changeEffect(nextID);
    lastSwitchTime = millis();
  }
  
  // --- RUN EFFECTS ---
  if (currentEffect === 1) runThreshold();
  else if (currentEffect === 2) runAscii();
  else if (currentEffect === 3) runDotMatrix();
  else if (currentEffect === 4) runPopArt();
  else if (currentEffect === 5) runExplosion();

  drawUI();
}

function changeEffect(id) {
  currentEffect = id;
  dayCount++;
  
  // TRIGGER CUTSCENE AT 30 DAYS
  if (dayCount >= maxDays) {
    triggerDeployment();
    return;
  }
  
  invertColors = false;
  useSquares = false;
  if (currentEffect === 4) background(0); 
  updateNarration(id); 
}

function triggerDeployment() {
  noLoop();
  if (video) video.stop();
  
  background(0);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("MAXIMUM TOLERANCE REACHED\nDEPLOYING SUBJECT...", width/2, height/2);

  setTimeout(() => {
    window.location.href = 'shootthem.html'; // Redirect to cutscene
  }, 3000);
}

// ==========================================
//             DISTORTION EFFECTS
// ==========================================

function runThreshold() {
  rectMode(CORNER);
  background(255);
  video.loadPixels();
  let scale = max(width/video.width, height/video.height);
  let startX = (width - (video.width * scale)) / 2;
  let startY = (height - (video.height * scale)) / 2;
  let step = 8; 
  noStroke();
  let thresh = map(mouseX, 0, width, 0, 255);
  
  for (let y = 0; y < video.height; y += step) {
    for (let x = 0; x < video.width; x += step) {
      let index = (x + y * video.width) * 4;
      let bright = (video.pixels[index] + video.pixels[index+1] + video.pixels[index+2]) / 3;
      let px = startX + x*scale;
      let py = startY + y*scale;
      let s = step * scale;

      if (invertColors) {
          fill(bright > thresh ? color(35, 64, 21) : color(99, 2, 2));
      } else {
          fill(bright > thresh ? color(99, 2, 2) : color(35, 64, 21));
      }

      if (bright > thresh) rect(px, py, s, s);
      else ellipse(px + s/2, py + s/2, s * 0.8);
    }
  }
}

function runAscii() {
  background(0);
  video.loadPixels();
  let chars = " @#W$9876543210?!abc;:+=-,._ "; 
  let step = 8; 
  textSize(map(mouseX, 0, width, 8, 16));
  textAlign(CENTER, CENTER);
  
  if (asciiColor === 0) fill(0, 255, 0);
  else if (asciiColor === 1) fill(245, 73, 39);
  else fill(255);
  
  for (let y = 0; y < video.height; y += step) {
    for (let x = 0; x < video.width; x += step) {
      let index = (x + y * video.width) * 4;
      let bright = (video.pixels[index] + video.pixels[index+1] + video.pixels[index+2]) / 3;
      let charIndex = floor(map(bright, 0, 255, 0, chars.length));
      text(chars.charAt(charIndex), map(x, 0, video.width, 0, width), map(y, 0, video.height, 0, height));
    }
  }
}

function runDotMatrix() {
  background(0, 40);
  video.loadPixels();
  let stepSize = 10; 
  noStroke();
  for (let y = 0; y < video.height; y += stepSize) {
    for (let x = 0; x < video.width; x += stepSize) {
      let index = (x + y * video.width) * 4;
      let r = video.pixels[index], g = video.pixels[index+1], b = video.pixels[index+2];
      let bright = (r + g + b) / 3;
      if (bright > 40) {
        let ox = map(x, 0, video.width, 0, width), oy = map(y, 0, video.height, 0, height);
        let d = dist(mouseX, mouseY, ox, oy), angle = atan2(oy - mouseY, ox - mouseX);
        let shiftX = 0, shiftY = 0;
        if (d < 100) {
          let force = map(d, 0, 100, 100, 0) * (bright / 100);
          shiftX = cos(angle) * (mouseIsPressed ? -force : force);
          shiftY = sin(angle) * (mouseIsPressed ? -force : force);
        }
        fill(abs(shiftX) > 10 ? color(0, 255, 0) : color(r, g, b));
        if (useSquares) rect(ox + shiftX, oy + shiftY, map(bright, 0, 255, 2, 14), map(bright, 0, 255, 2, 14));
        else ellipse(ox + shiftX, oy + shiftY, map(bright, 0, 255, 2, 14));
      }
    }
  }
}

function runPopArt() {
  if (!mouseIsPressed) {
    image(video, 0, 0, width, height);
    filter(GRAY);
    fill(0, 150);
    rect(0, 0, width, height);
  }
  video.loadPixels();
  prevFrame.loadPixels();
  colorMode(HSB, 255);
  let userHue = map(mouseY, 0, height, 0, 250); 
  for (let x = 0; x < video.width; x += 4) {
    for (let y = 0; y < video.height; y += 4) {
      let loc = (x + y * video.width) * 4;
      if (dist(video.pixels[loc], video.pixels[loc+1], video.pixels[loc+2], prevFrame.pixels[loc], prevFrame.pixels[loc+1], prevFrame.pixels[loc+2]) > 40) {
        fill(userHue, 255, 150);
        rect(map(x, 0, video.width, 0, width), map(y, 0, video.height, 0, height), 4 * (width/video.width), 4 * (height/video.height));
      }
    }
  }
  colorMode(RGB); 
  prevFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}

function runExplosion() {
  fill(0, 10);
  rect(0, 0, width, height);
  video.loadPixels();
  colorMode(HSB, 255);
  for (let y = 0; y < video.height; y += 10) {
    for (let x = 0; x < video.width; x += 10) {
      let index = (x + y * video.width) * 4; 
      let bright = (video.pixels[index] + video.pixels[index+1] + video.pixels[index+2]) / 3;
      if (bright > 10) {
        let hue = (bright + frameCount * 2) % 255;
        if (bright > map(mouseX, 0, width, 0, 255)) {
           fill(hue, 120, 180);
           circle(map(x, 0, video.width, 0, width), map(y, 0, video.height, 0, height), map(bright, 0, 255, 2, 15));
        } else {
           fill(hue, 100, 100);
           circle(map(x + sin(y * 0.05 + frameCount*0.05) * 40, 0, video.width, 0, width), map(y + cos(x * 0.05 + frameCount*0.05) * 40, 0, video.height, 0, height), map(bright, 0, 255, 2, 15));
        }
      }
    }
  }
  colorMode(RGB); 
}

// ==========================================
//                 UI & HELPERS
// ==========================================

function drawUI() {
  blendMode(DIFFERENCE);
  fill(255); 
  textSize(20);
  textAlign(LEFT, TOP);
  text("DAY // " + nf(dayCount, 3) + " / " + maxDays, 20, 20); // Days remaining
  rect(0, height - 5, map(millis() - lastSwitchTime, 0, switchInterval, 0, width), 5);
  blendMode(BLEND);
}

function keyPressed() {
  if (key >= '1' && key <= '5') changeEffect(int(key));
  if (key === 'n' || key === 'N') window.location.href = 'shootthem.html';
}

function mousePressed() {
  if (currentEffect === 1) invertColors = !invertColors; 
  if (currentEffect === 2) asciiColor = (asciiColor + 1) % 3; 
  if (currentEffect === 3) useSquares = !useSquares; 
  if (currentEffect === 4) background(0); 
}

function updateNarration(id) {
  let textElement = document.getElementById("instruction-text");
  let labelElement = document.getElementById("speaker-name");
  if (!textElement) return; 

  const messages = [
    "Ask not what your country can do for you—ask what you can do for your country.",
    "Today, you have been selected to protect the skyline with your bodies.",
    "Reminder: Your biological termination date is irrelevant. Your service record is immortal.",
    "THIS IS THE WAR TO END ALL WARS.",
    "A hero’s return. A mother’s pride. The mark of an indestructible figure."
  ];

  labelElement.innerText = "PHRASE " + id + " //";
  textElement.innerText = messages[id-1] + " [INTERACT TO REPROGRAM]";
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }