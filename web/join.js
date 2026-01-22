document.addEventListener('DOMContentLoaded', () => {
  const leaveBtn = document.getElementById('leave');
  
  // Safety check: ensure button exists before adding listener
  if (!leaveBtn) {
    console.error("Button with ID 'leave' not found!");
    return;
  }

  // Audio Context needs to be created after a user interaction in some browsers
  let audioCtx;

  leaveBtn.addEventListener('click', function() {
    // Initialize audio on first click (browsers block auto-audio)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 1. Start the visual crash
    document.body.classList.add('cashing-body');
    
    // 2. Disable the button
    leaveBtn.disabled = true;
    leaveBtn.innerText = "CRASHING...";

    // 3. Spawn Error Messages rapidly
    let errorCount = 0;
    const maxErrors = 20; 
    
    const interval = setInterval(() => {
      spawnError();
      beep(audioCtx); // Pass the context to the beep function
      errorCount++;
      
      if (errorCount >= maxErrors) {
        clearInterval(interval);
        // 4. THE END: Reload page
        setTimeout(() => {
          location.reload(); 
        }, 500); 
      }
    }, 100); 
  });

  function spawnError() {
    const errorMsg = [
      "SYSTEM FAILURE", "ONLY THE WEAK STAY HOME", "BE A MAN AND JOIN", "0x00000000", "BETRAYAL", "COWARDICE DETECTED",
    ];
    
    const div = document.createElement('div');
    div.classList.add('error-popup');
    
    // Ensure random position stays within screen bounds
    const x = Math.random() * (window.innerWidth - 220); // 200 width + padding
    const y = Math.random() * (window.innerHeight - 100);
    
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    
    const text = errorMsg[Math.floor(Math.random() * errorMsg.length)];
    
    div.innerHTML = `
      <div class="error-header">
        <span>ERROR</span><span>X</span>
      </div>
      ${text}
    `;
    
    document.body.appendChild(div);
  }

  function beep(ctx) {
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.value = 100 + Math.random() * 500; 
    
    // Lower volume so it doesn't hurt ears
    gain.gain.value = 0.05; 
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }
});