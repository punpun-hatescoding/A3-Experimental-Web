// --- AUDIO ASSETS ---

const typeSound = new Audio('sounds/typewriter.mp3'); 

let audioEnabled = false; // Tracks if user has clicked to allow sound

// --- NARRATION SETTINGS ---
let messages = [
  "Welcome home, son.",
  "We have been waiting for you for so long.",
  "The war took so much away from us.",
  "And we thought it might have taken you too.", // Fixed grammar
  "But fortunately, you survived.",
  "Let those tragic memories sleep for eternity.",
  "From now on, you are safe here with us.",
  "Together, we will build a brighter future just like we've dreamed.",
];

let currentMsgIndex = 0;
let lastMsgChange = 0;
let msgDuration = 6000;  
let typewriterIndex = 0;
let currentDisplayText = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  lastMsgChange = millis();
  
  // Optional: Lower the volume so the rapid clicking isn't deafening
  typeSound.volume = 0.1; 
}

function draw() {
  background(0); // The absolute void

  // If user hasn't clicked yet, show a start prompt
  if (!audioEnabled) {
    drawStartPrompt();
  } else {
    updateNarrationLogic();
  }

  // --- CENTERED NARRATIVE TEXT ---
  fill(209, 255, 214); // Mint Green
  noStroke();
  textAlign(CENTER, CENTER);
  textFont('input-mono-compressed');
  textSize(24);
  textStyle(BOLD);
  
  // Constrain text to the center 60% of the screen
  let textWidthLimit = width * 0.6;
  text(currentDisplayText, width/2 - textWidthLimit/2, height/2 - 100, textWidthLimit, 200);
  
  // --- SUBTLE PROGRESS INDICATOR ---
  // Since it loops, this bar will fill and reset repeatedly
  let sync = floor(map(currentMsgIndex, 0, messages.length - 1, 0, 100));
  fill(209, 255, 214, 150);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("SYNC: " + sync + "%", width/2, height - 40);
  // --- RESTART PROMPT ---
  fill(209, 255, 214, 150); // Slightly brighter/transparent green
  textSize(14);
  text("[ PRESS 'N' TO RESTART ]", width/2, height - 20);
}

function drawStartPrompt() {
  fill(209, 255, 214);
  textAlign(CENTER, CENTER);
  textSize(16);
  // Blinking effect
  if (frameCount % 60 < 30) {
    text("[ You have arrived home ]", width/2, height/2 + 100);
  }
}

function mousePressed() {
  if (!audioEnabled) {
    audioEnabled = true;
    // Reset timer so the first message doesn't skip
    lastMsgChange = millis(); 
  }
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

  // Typewriter reveal logic
  if (frameCount % 4 === 0 && typewriterIndex < messages[currentMsgIndex].length) {
    // 1. Get the character
    let char = messages[currentMsgIndex].charAt(typewriterIndex);
    
    // 2. Add it to the screen
    currentDisplayText += char;
    typewriterIndex++;
    
    // 3. ONLY play sound if it is NOT a space
    if (char !== ' ') {
      playTypeSound();  
    }
  }
}

function playTypeSound() {
  if (audioEnabled) {

 
    typeSound.currentTime = 0; //
    typeSound.play().catch(e => {
    
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'N' || key === 'n') {
     window.location.href = 'index.html'; 
  }
}