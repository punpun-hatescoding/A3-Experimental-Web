let video;
let isVideoReady = false;
let idCardBase; // Variable for your PNG

// Identity Variables
let playerName = "";
let playerDOB = "";
let playerID = "";

// Scanning Variables
let scanY = 0;
let scanSpeed = 5;
let isScanning = true;
let snapshot; 
let processedSnapshot;

function preload() {
  // 1. LOAD YOUR CUSTOM PNG DESIGN HERE
  idCardBase = loadImage('images/identity-card.png'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  playerName = prompt("ENTER FULL NAME FOR ENLISTMENT:", "JOHN DOE");
  playerDOB = prompt("ENTER DATE OF BIRTH (DD/MM/YYYY):", "01/01/1940");
  playerID = "SVN-985-" + floor(random(1000, 9999));

  localStorage.setItem('playerName', playerName || "UNKNOWN");
  localStorage.setItem('playerDOB', playerDOB || "XX/XX/XXXX");
  localStorage.setItem('playerID', playerID);

  let constraints = {
    video: { width: 640, height: 480 },
    audio: false
  };
  
  video = createCapture(constraints, videoLoaded);
  video.size(640, 480);
  video.hide();
  
  textFont('adso');
  textStyle(BOLD);
}

function videoLoaded() {
  isVideoReady = true;
}

function draw() {
  background(0);
  
  if (!isVideoReady || video.width === 0) {
    fill(0, 255, 0);
    textAlign(CENTER);
    text("INITIALIZING SCANNER...", width/2, height/2);
    return; 
  }

  let scaleF = max(width / video.width, height / video.height);
  let w = video.width * scaleF;
  let h = video.height * scaleF;
  let x = (width - w) / 2;
  let y = (height - h) / 2;
  
  if (isScanning) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, (width - w) / 2, y, w, h); 
    pop();
    drawScanner(x, y, w, h);
  } else {
    drawUI_Captured();
  }
}

function drawScanner(x, y, w, h) {
  scanY += scanSpeed;
  if (scanY > height || scanY < 0) scanSpeed *= -1;
  
  fill(0, 150);
  noStroke();
  rect(0, 0, width, height);
  
  stroke(51, 235, 0);
  strokeWeight(5);
  line(0, scanY, width, scanY);

  // Targeting Box
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  let boxSize = min(width, height) * 0.5;
  let cx = width/2;
  let cy = height/2;
  let len = 30; 
  
  line(cx - boxSize/2, cy - boxSize/2, cx - boxSize/2 + len, cy - boxSize/2);
  line(cx - boxSize/2, cy - boxSize/2, cx - boxSize/2, cy - boxSize/2 + len);
  line(cx + boxSize/2, cy - boxSize/2, cx + boxSize/2 - len, cy - boxSize/2);
  line(cx + boxSize/2, cy - boxSize/2, cx + boxSize/2, cy - boxSize/2 + len);
  line(cx - boxSize/2, cy + boxSize/2, cx - boxSize/2 + len, cy + boxSize/2);
  line(cx - boxSize/2, cy + boxSize/2, cx - boxSize/2, cy + boxSize/2 - len);
  line(cx + boxSize/2, cy + boxSize/2, cx + boxSize/2 - len, cy + boxSize/2);
  line(cx + boxSize/2, cy + boxSize/2, cx + boxSize/2, cy + boxSize/2 - len);
  
  fill(0, 255, 0);
  textAlign(CENTER, TOP);
  textSize(20);
  noStroke();
  text("ALIGN FACE | CLICK TO CAPTURE", width/2, cy + boxSize/2 + 20);
}

// --- MODIFIED UI FOR CUSTOM PNG ---
function drawUI_Captured() {
  background(20); 
  if (snapshot && !processedSnapshot) {
    processedSnapshot = createGraphics(snapshot.width, snapshot.height);
    processedSnapshot.loadPixels();
    snapshot.loadPixels();

    // The Color you want for the background (e.g., a vintage yellow or grey)
    let bgR = 200, bgG = 190, bgB = 150; 

    for (let i = 0; i < snapshot.pixels.length; i += 4) {
      let r = snapshot.pixels[i];
      let g = snapshot.pixels[i + 1];
      let b = snapshot.pixels[i + 2];
      let bright = (r + g + b) / 3;

      // THRESHOLD: If the pixel is dark, replace it with a solid color
      if (bright < 80) { 
        processedSnapshot.pixels[i] = bgR;
        processedSnapshot.pixels[i + 1] = bgG;
        processedSnapshot.pixels[i + 2] = bgB;
        processedSnapshot.pixels[i + 3] = 255;
      } else {
        // Keep the subject as they are
        processedSnapshot.pixels[i] = r;
        processedSnapshot.pixels[i + 1] = g;
        processedSnapshot.pixels[i + 2] = b;
        processedSnapshot.pixels[i + 3] = 255;
      }
    }
    processedSnapshot.updatePixels();
  }
  // 1. SET SCALE FACTOR (Change this to grow/shrink everything)
  let cardScale = 1.5; // 1.0 is original, 1.5 is 50% larger
  let cardW = 600 * cardScale; 
  let cardH = (idCardBase.height / idCardBase.width) * cardW;
  
  imageMode(CENTER);
  noStroke();
  // Center the ID card base
  image(idCardBase, width/2, height/2, cardW, cardH);
  
  // 2. Place the player's photo (Scaled proportionally)
  if (snapshot) {
    let cropSize = 480; 
    let sx = (snapshot.width - cropSize) / 2;
    let sy = 0; 

    push(); 

    
    // We multiply original offsets and sizes by cardScale
    let photoW = 120 * cardScale;
    let photoH = 150 * cardScale;
    let photoX = width/2 - (210 * cardScale);
    let photoY = height/2 - (120 * cardScale);
    
    image(
      snapshot, 
      photoX, photoY, 
      photoW, photoH,                     
      sx, sy,                       
      cropSize, cropSize            
    );  
    pop(); 
  }

  // 3. Overlay the Text (Scaled proportionally)
  fill(110, 58, 36); 
  textAlign(LEFT);
  noStroke();
  textFont("adso");
  // Scale the text size too
  textSize(18 * cardScale); 
  
  // Calculate relative positions
  let textXBase = width/2 + (60 * cardScale);
  let idXBase = width/2 + (90 * cardScale);
  
  text(playerName.toUpperCase(), textXBase, height/2 - (180 * cardScale));
  text(playerDOB, textXBase, height/2 - (120 * cardScale));
  text(playerID, idXBase, height/2 - (30 * cardScale));

// 1. DRAW THE RECTANGLE FIRST (The Background)
  rectMode(CENTER);
  stroke(0, 191, 1);
  strokeWeight(3);
  fill(0, 200); // Semi-transparent black background for the box
  rect(width/2, height - 100, 700, 50, 10);

  // 2. DRAW THE TEXT SECOND (The Foreground)
  imageMode(CORNER);
  fill(0, 191, 1);
  textAlign(CENTER, CENTER); // Centers perfectly inside the shared coordinates
  textSize(24);
  textFont("adso");
  textStyle(BOLD);
  noStroke();
  
  // Use the exact same Y-coordinate as the rect
  text("PRESS 'S' TO SAVE | 'R' TO RETRY | 'N' TO PROCEED", width/2, height - 100);
}
function mousePressed() {
  if (isScanning && isVideoReady) {
    let pg = createGraphics(video.width, video.height);
    pg.translate(video.width, 0);
    pg.scale(-1, 1);
    pg.image(video, 0, 0);
    snapshot = pg.get(); 
    
    try {
      let base64Image = pg.canvas.toDataURL('image/jpeg', 0.7);
      localStorage.setItem('playerFace', base64Image);
    } catch (e) {
      console.warn("Storage error.");
    }
    isScanning = false;
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') saveCanvas('army_id', 'png');
  if (key === 'r' || key === 'R') isScanning = true;
  if (key === 'n' || key === 'N') window.location.href = 'run.html';
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}