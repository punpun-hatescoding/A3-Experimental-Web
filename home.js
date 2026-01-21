let messages = [
  "You're almost home at last.",
  "This is what you've been waiting for all those days, isn't it?",
  "We really appreciate having had you by our side.",
  "Your valor will always be a part of our memory.",
  "But now... look into the space where you used to be.",
  "Who is it that you see?",
  "From where we're standing, you look perfectly empty.",
  "You look just like us.",
  "Welcome home to the forever."
];

let currentMsgIndex = 0;
let lastMsgChange = 0;
let msgDuration = 6000; 
let typewriterIndex = 0;
let currentDisplayText = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  lastMsgChange = millis();
}

function draw() {
  background(0); // The absolute void

  updateNarrationLogic();

  // --- CENTERED NARRATIVE TEXT ---
  // No boxes, no borders, just the voice of the system
  fill(209, 255, 214); // The "Kind" Mint Green
  noStroke();
  textAlign(CENTER, CENTER);
  textFont('Courier New');
  textSize(24);
  textStyle(BOLD);
  
  // Constrain text to the center 60% of the screen
  let textWidthLimit = width * 0.6;
  text(currentDisplayText, width/2 - textWidthLimit/2, height/2 - 100, textWidthLimit, 200);
  
  // --- SUBTLE PROGRESS INDICATOR (Optional) ---
  // A tiny, fading percentage at the very bottom
  let sync = floor(map(currentMsgIndex, 0, messages.length - 1, 0, 100));
  fill(0, 255, 0, 50);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  text("SYNC: " + sync + "%", width/2, height - 40);
}

function updateNarrationLogic() {
  let now = millis();
  
  // Logic to switch to next message
  if (now - lastMsgChange > msgDuration) {
    // If we reach the end, stay on "Welcome home to the forever."
    if (currentMsgIndex < messages.length - 1) {
      currentMsgIndex++;
      lastMsgChange = now;
      typewriterIndex = 0;
      currentDisplayText = "";
    }
  }

  // Typewriter reveal logic
  if (frameCount % 2 === 0 && typewriterIndex < messages[currentMsgIndex].length) {
    currentDisplayText += messages[currentMsgIndex].charAt(typewriterIndex);
    typewriterIndex++;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}