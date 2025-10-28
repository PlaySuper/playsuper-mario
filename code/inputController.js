/**
 * Unified Input Controller for Mario Game
 * Supports both keyboard and touch inputs
 * 
 * Architecture:
 * - Abstracts game actions from input sources
 * - Maintains backward compatibility with existing keyboard system
 * - Provides simple API for touch controls to integrate
 */

Mario.InputController = function () {
    // Core game actions - these represent what the player wants to do
    this.actions = {
        left: false,     // Move character left
        right: false,    // Move character right  
        up: false,       // Move up (for map navigation)
        down: false,     // Move down (for map navigation / duck in game)
        jump: false,     // Jump action (B button)
        run: false,      // Run/Fire action (A button)
        duck: false,     // Duck/Down action (alias for down)
        home: false      // Home action (H button)
    };

    // Separate input source maps for proper merging
    this.keyboardActions = {
        left: false, right: false, up: false, down: false, jump: false, run: false, duck: false, home: false
    };
    this.touchActions = {
        left: false, right: false, up: false, down: false, jump: false, run: false, duck: false, home: false
    };

    // Input source flags
    this.keyboardEnabled = true;
    this.touchEnabled = false;

    // Reference to original keyboard system for backward compatibility
    this.originalKeyboard = Enjine.KeyboardInput;

    console.log('InputController: Initialized with keyboard support');
};

Mario.InputController.prototype.initialize = function () {
    // Reset all action states to prevent sticky behavior
    for (const action in this.actions) {
        this.actions[action] = false;
        this.touchActions[action] = false;
        this.keyboardActions[action] = false;
    }

    // Enable touch on mobile devices
    if (this.isMobileDevice()) {
        this.enableTouchControls();
        console.log('InputController: Mobile device detected, touch controls enabled');
    } else {
        console.log('InputController: Desktop device detected, keyboard-only mode');
    }
};

Mario.InputController.prototype.isMobileDevice = function () {
    // Determine mobile based on viewport width alone for consistent testing
    const isSmallScreen = window.innerWidth <= 768;
    console.log('InputController: Viewport width:', window.innerWidth, '=> mobile mode:', isSmallScreen);
    return isSmallScreen;
};

Mario.InputController.prototype.enableTouchControls = function () {
    this.touchEnabled = true;
    console.log('InputController: Touch controls enabled');
};

/**
 * Main method for game code to check if an action is currently active
 * This replaces direct keyboard checks like Enjine.KeyboardInput.IsKeyDown()
 */
Mario.InputController.prototype.isActionActive = function (action) {
    if (!this.actions.hasOwnProperty(action)) {
        console.warn('InputController: Unknown action requested:', action);
        return false;
    }

    return this.actions[action];
};

/**
 * Update actions based on current keyboard state
 * Called continuously during game loop
 */
Mario.InputController.prototype.updateActions = function () {
    if (this.keyboardEnabled) {
        // 1) Refresh keyboard map with current key states
        this.keyboardActions.left = this.originalKeyboard.IsKeyDown(Enjine.Keys.Left);
        this.keyboardActions.right = this.originalKeyboard.IsKeyDown(Enjine.Keys.Right);
        this.keyboardActions.up = this.originalKeyboard.IsKeyDown(Enjine.Keys.Up);
        this.keyboardActions.down = this.originalKeyboard.IsKeyDown(Enjine.Keys.Down);
        this.keyboardActions.jump = this.originalKeyboard.IsKeyDown(Enjine.Keys.S);
        this.keyboardActions.run = this.originalKeyboard.IsKeyDown(Enjine.Keys.A);
        this.keyboardActions.duck = this.originalKeyboard.IsKeyDown(Enjine.Keys.Down);
        this.keyboardActions.home = this.originalKeyboard.IsKeyDown(Enjine.Keys.H);
    }

    // 2) Combine touch + keyboard (touch has priority)
    for (const action in this.actions) {
        const prev = this.actions[action];
        this.actions[action] = this.touchActions[action] || this.keyboardActions[action];
        // Debug jump/duck transitions to help trace why character may not respond
        if ((action === 'jump' || action === 'duck') && prev !== this.actions[action]) {
            console.log(`InputController: action '${action}' changed: ${prev} -> ${this.actions[action]}`);
            console.log(`InputController: touchActions[${action}]=${this.touchActions[action]}, keyboardActions[${action}]=${this.keyboardActions[action]}`);
        }
    }
};

/**
 * Method for touch controls to set action states
 * This will be called by mobile controls when buttons are pressed/released
 */
Mario.InputController.prototype.setAction = function (action, state) {
    if (!this.touchActions.hasOwnProperty(action)) {
        console.warn('InputController: Attempted to set unknown action:', action);
        return;
    }

    // Set in touch actions map instead of directly on actions
    this.touchActions[action] = state;

    // Also mirror immediately to public actions to reduce latency between touch event
    // and game loop sample. This prevents a one-frame lag where MayJump might be
    // recalculated before touchActions is merged in updateActions().
    const prev = this.actions[action];
    if (state) {
        // activation: immediate
        this.actions[action] = true;
        if ((action === 'jump' || action === 'duck') && prev !== true) {
            console.log(`InputController: immediate action mirror '${action}': ${prev} -> true`);
        }
    } else {
        // deactivation: clear immediately for responsive controls
        // No debounce needed since updateActions() runs every frame
        this.touchActions[action] = false;
        const prev2 = this.actions[action];
        this.actions[action] = false;
        if ((action === 'jump' || action === 'duck') && prev2 !== false) {
            console.log(`InputController: immediate action clear '${action}': ${prev2} -> false`);
        }
    }

    // Debug logging for touch interactions
    if (this.touchEnabled) {
        console.log(`InputController: Touch ${state ? 'activated' : 'deactivated'} action: ${action}`);
        console.log(`InputController: touchActions[${action}] = ${state}`);
        console.log(`InputController: Current actions state:`, this.actions);
    }
};

/**
 * Fallback method for backward compatibility
 * If InputController fails, game can still use original keyboard
 */
Mario.InputController.prototype.getKeyboardState = function (keyCode) {
    return this.originalKeyboard.IsKeyDown(keyCode);
};

// Create global instance that will be used throughout the game
Mario.inputController = new Mario.InputController();

console.log('InputController: Global instance created and ready');
