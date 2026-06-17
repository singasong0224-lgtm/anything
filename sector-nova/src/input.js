// ============================================================
// SECTOR NOVA - Input Handler
// ============================================================

class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.justPressed = {};
    this._previousKeys = {};
    this.isMobileLike = this.detectMobileLike();
    this.hasTouchInput = false;
    this.touchActive = false;
    this.touchPointerId = null;
    this.touchTargetX = CANVAS_WIDTH / 2;
    this.touchTargetY = CANVAS_HEIGHT - 60;
    this.touchStartX = CANVAS_WIDTH / 2;
    this.touchStartY = CANVAS_HEIGHT - 60;
    this.touchStartRequested = false;
    this.touchStartJustPressed = false;
    this.touchPauseRequested = false;
    this.touchPauseJustPressed = false;

    window.addEventListener('keydown', (e) => {
      // Prevent default for game keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyP'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.setupTouchControls();
  }

  detectMobileLike() {
    try {
      const nav = window.navigator || {};
      if (nav.maxTouchPoints && nav.maxTouchPoints > 0) return true;
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    } catch (e) {
      // Restricted browser contexts can throw on feature probes.
    }
    return false;
  }

  setupTouchControls() {
    if (!this.canvas) return;

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      e.preventDefault();
      this.beginTouch(e.clientX, e.clientY, e.pointerId);
      if (this.touchActive && this.canvas.setPointerCapture) {
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch (err) {
          // Some synthetic or restricted pointer events cannot be captured.
        }
      }
    }, { passive: false });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.touchPointerId !== e.pointerId) return;
      e.preventDefault();
      this.updateTouchTarget(e.clientX, e.clientY);
    }, { passive: false });

    const endPointer = (e) => {
      if (this.touchPointerId !== e.pointerId) return;
      e.preventDefault();
      this.endTouch();
    };
    this.canvas.addEventListener('pointerup', endPointer, { passive: false });
    this.canvas.addEventListener('pointercancel', endPointer, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.touchPointerId !== null) return;
      const touch = e.changedTouches[0];
      if (touch) this.beginTouch(touch.clientX, touch.clientY, null);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.touchActive) return;
      const touch = e.changedTouches[0];
      if (touch) this.updateTouchTarget(touch.clientX, touch.clientY);
    }, { passive: false });

    const endTouchEvent = (e) => {
      e.preventDefault();
      this.endTouch();
    };
    this.canvas.addEventListener('touchend', endTouchEvent, { passive: false });
    this.canvas.addEventListener('touchcancel', endTouchEvent, { passive: false });
  }

  canvasPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    return { x, y };
  }

  isPauseButtonPoint(x, y) {
    return x >= TOUCH_PAUSE_BUTTON_X &&
      x <= TOUCH_PAUSE_BUTTON_X + TOUCH_PAUSE_BUTTON_W &&
      y >= TOUCH_PAUSE_BUTTON_Y &&
      y <= TOUCH_PAUSE_BUTTON_Y + TOUCH_PAUSE_BUTTON_H;
  }

  beginTouch(clientX, clientY, pointerId) {
    this.hasTouchInput = true;
    const point = this.canvasPoint(clientX, clientY);
    if (this.isPauseButtonPoint(point.x, point.y)) {
      this.touchPauseRequested = true;
      return;
    }

    this.touchPointerId = pointerId;
    this.touchActive = true;
    this.touchStartRequested = true;
    this.touchStartX = point.x;
    this.touchStartY = point.y;
    this.setTouchTarget(point);
  }

  updateTouchTarget(clientX, clientY) {
    this.setTouchTarget(this.canvasPoint(clientX, clientY));
  }

  setTouchTarget(point) {
    this.touchTargetX = clamp(point.x, 12, CANVAS_WIDTH - 12);
    this.touchTargetY = clamp(point.y - TOUCH_PLAYER_OFFSET_Y, 12, CANVAS_HEIGHT - 12);
  }

  endTouch() {
    this.touchActive = false;
    this.touchPointerId = null;
  }

  /**
   * Call at the start of each frame to update justPressed state
   */
  update() {
    for (const key in this.keys) {
      this.justPressed[key] = this.keys[key] && !this._previousKeys[key];
    }
    // Copy current state
    this._previousKeys = { ...this.keys };
    this.touchStartJustPressed = this.touchStartRequested;
    this.touchPauseJustPressed = this.touchPauseRequested;
    this.touchStartRequested = false;
    this.touchPauseRequested = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isJustPressed(code) {
    return !!this.justPressed[code];
  }

  // Movement helpers
  get left() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get up() {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get down() {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get shoot() {
    return this.isDown('Space') || this.shouldAutoShoot;
  }

  get enter() {
    return this.isJustPressed('Enter');
  }

  get pause() {
    return this.isJustPressed('KeyP') || this.touchPauseJustPressed;
  }

  get touchStart() {
    return this.touchStartJustPressed;
  }

  get shouldAutoShoot() {
    return this.isMobileLike || this.touchActive || this.hasTouchInput;
  }

  get shouldShowTouchUi() {
    return this.isMobileLike || this.hasTouchInput;
  }
}
