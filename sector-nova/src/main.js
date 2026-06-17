// ============================================================
// SECTOR NOVA - Main Entry Point
// ============================================================

(function () {
  'use strict';

  // --- Canvas Setup ---
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('SECTOR NOVA: Canvas element not found!');
    return;
  }

  // Ensure canvas size matches our constants
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Disable image smoothing for pixel-perfect rendering
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Create Game Instance ---
  const game = new Game(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === STATE.PLAYING) {
      game.state = STATE.PAUSED;
    }
  });

  // --- Game Loop ---
  let lastTime = 0;

  function gameLoop(timestamp) {
    // Keep running the loop
    requestAnimationFrame(gameLoop);

    // Update and draw
    game.update();
    game.draw();
  }

  // --- Start ---
  console.log('SECTOR NOVA initialized');
  requestAnimationFrame(gameLoop);
})();
