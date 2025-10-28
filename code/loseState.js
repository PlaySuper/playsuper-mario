/**
    State shown when the player loses!
    Code by Rob Kleffner, 2011
*/

Mario.LoseState = function () {
    this.drawManager = null;
    this.camera = null;
    this.gameOver = null;
    this.font = null;
    this.wasKeyDown = false;
    this.discountCheckDelay = 1.0; // Wait 1 second before checking for discounts (reduced for better UX)
    this.discountTimer = 0;
    this.discountOffered = false;
};

Mario.LoseState.prototype = new Enjine.GameState();
Mario.LoseState.prototype.constructor = Mario.LoseState;

Mario.LoseState.prototype.Enter = function () {
    console.log('🎮 LoseState.Enter: Player has lost, entering lose state...');

    this.drawManager = new Enjine.DrawableManager();
    this.camera = new Enjine.Camera();

    this.gameOver = new Enjine.AnimatedSprite();
    this.gameOver.Image = Enjine.Resources.Images["gameOverGhost"];
    this.gameOver.SetColumnCount(9);
    this.gameOver.SetRowCount(1);
    this.gameOver.AddNewSequence("turnLoop", 0, 0, 0, 8);
    this.gameOver.PlaySequence("turnLoop", true);
    this.gameOver.FramesPerSecond = 1 / 15;
    this.gameOver.X = 112;
    this.gameOver.Y = 68;

    this.font = Mario.SpriteCuts.CreateBlackFont();
    this.font.Strings[0] = { String: "Game over!", X: 116, Y: 160 };

    // Reset discount state
    this.discountTimer = 0;
    this.discountOffered = false;
    console.log('🔄 LoseState.Enter: Reset discount timer and flags');
    console.log('🔍 LoseState.Enter: Discount system check at entry:');
    console.log('   - System exists:', typeof Mario.discountSystem !== 'undefined');
    console.log('   - Is initialized:', Mario.discountSystem?.isInitialized);
    console.log('   - Can generate:', Mario.discountSystem?.canGenerateDiscount());

    // Create buttons instead of keyboard prompts
    this.createLoseButtons();

    this.drawManager.Add(this.font);
    this.drawManager.Add(this.gameOver);
};

Mario.LoseState.prototype.Exit = function () {
    console.log('🚪 Exiting lose state...');

    // Clean up buttons
    this.removeLoseButtons();

    this.drawManager.Clear();
    delete this.drawManager;
    delete this.camera;
    delete this.gameOver;
    delete this.font;

    console.log('Lose state cleanup complete');
};

Mario.LoseState.prototype.Update = function (delta) {
    this.drawManager.Update(delta);

    // Handle discount system integration
    if (!this.discountOffered) {
        this.discountTimer += delta;
        console.log('⏱️ LoseState.Update: discountTimer =', this.discountTimer.toFixed(2), '/ threshold =', this.discountCheckDelay);
        if (this.discountTimer >= this.discountCheckDelay) {
            console.log('🚨 LoseState.Update: Timer threshold reached! Calling checkForDiscountOffer...');
            this.checkForDiscountOffer();
        }
    } else {
        console.log('⏭️ LoseState.Update: Discount already offered, skipping timer check');
    }

    // Button functionality replaced keyboard controls
};

Mario.LoseState.prototype.Draw = function (context) {
    this.drawManager.Draw(context, this.camera);

    // Draw coin balance only if PlaySuper is initialized and function exists
    if (typeof Mario.DrawCoinBalance === 'function' && window.playSuperCredentials) {
        try {
            Mario.DrawCoinBalance(context, 10, 10);
        } catch (error) {
            console.log('LoseState: DrawCoinBalance failed:', error.message);
        }
    }
};

Mario.LoseState.prototype.CheckForChange = function (context) {
    // Button navigation has replaced keyboard navigation
};

Mario.LoseState.prototype.checkForDiscountOffer = function () {
    this.discountOffered = true;

    console.log('=== DISCOUNT SYSTEM CHECK ===');
    console.log('1. System exists:', typeof Mario.discountSystem !== 'undefined');
    console.log('2. Is initialized:', Mario.discountSystem?.isInitialized);
    console.log('3. Can generate discount:', Mario.discountSystem?.canGenerateDiscount());
    console.log('4. Last discount time:', Mario.discountSystem?.lastDiscountTime);
    console.log('5. Cooldown (ms):', Mario.discountSystem?.discountCooldown);

    // Check if discount system is available and can generate discount
    if (typeof Mario.discountSystem !== 'undefined' &&
        Mario.discountSystem.isInitialized &&
        Mario.discountSystem.canGenerateDiscount()) {

        console.log('LoseState: All checks passed - showing recovery discount offer...');

        // Add contextual message about possible discounts
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Looking for recovery options...", X: 60, Y: 200 };
        }

        // Slight delay to build anticipation
        setTimeout(() => {
            console.log('LoseState: Triggering onPlayerDeath...');
            Mario.discountSystem.onPlayerDeath();
        }, 500);
    } else {
        console.log('LoseState: No discount available or system not ready');
        console.log('- System undefined:', typeof Mario.discountSystem === 'undefined');
        console.log('- Not initialized:', !Mario.discountSystem?.isInitialized);
        console.log('- Cannot generate:', !Mario.discountSystem?.canGenerateDiscount());

        // Show alternative message
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Try again?", X: 120, Y: 200 };
        }
    }
};

Mario.LoseState.prototype.handleRetryWithDiscount = function () {
    console.log('🔄 LoseState: Player wants to retry - resetting lives and restarting game...');

    // Reset lives to 3 for a fresh start
    if (typeof Mario.MarioCharacter !== 'undefined') {
        Mario.MarioCharacter.Lives = 3;
        console.log('✨ Lives reset to 3 for new game attempt');
    }

    // Reset the global map state for a fresh start
    if (typeof Mario.GlobalMapState !== 'undefined') {
        console.log('🗺️ Resetting map progress for new game...');
        Mario.GlobalMapState.currentLevelIndex = 0;
        Mario.GlobalMapState.completedLevels = [];
        Mario.GlobalMapState.WorldNumber = 1;
    }

    // Go back to map state to start fresh
    this.goToMap();
};

Mario.LoseState.prototype.goToMap = function () {
    console.log('🗺️ Going to map state...');

    // Play button sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }

    // Reset Mario's death/win states
    if (typeof Mario.MarioCharacter !== 'undefined') {
        Mario.MarioCharacter.DeathTime = 0;
        Mario.MarioCharacter.WinTime = 0;
        Mario.MarioCharacter.DeathDiscountTriggered = false;
    }

    // Go to the global map state
    if (typeof Enjine !== 'undefined' && Enjine.Application && Enjine.Application.Instance) {
        if (Mario.GlobalMapState) {
            Enjine.Application.Instance.stateContext.ChangeState(Mario.GlobalMapState);
        } else {
            // Create new map state if it doesn't exist
            Mario.GlobalMapState = new Mario.MapState();
            Enjine.Application.Instance.stateContext.ChangeState(Mario.GlobalMapState);
        }
    }
};

// ============= LOSE BUTTONS SYSTEM =============

Mario.LoseState.prototype.createLoseButtons = function () {
    console.log('Creating lose state buttons...');

    // Clean up any existing buttons
    this.removeLoseButtons();

    // Get canvas position for button positioning
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas not found for lose button positioning');
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'mario-lose-buttons';
    buttonContainer.style.cssText = `
        position: absolute;
        top: ${canvasRect.top}px;
        left: ${canvasRect.left}px;
        width: ${canvasRect.width}px;
        height: ${canvasRect.height}px;
        pointer-events: none;
        z-index: 1000;
    `;

    // Continue Button (go to title)
    const continueButton = this.createLoseButton('🏠 CONTINUE', 'continue-btn');
    continueButton.style.cssText += `
        position: absolute;
        left: 50%;
        top: 75%;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #32CD32 0%, #228B22 100%);
        color: white;
        border: 3px solid #006400;
        font-size: 12px;
        padding: 10px 20px;
    `;
    continueButton.onclick = () => this.goToTitle();

    // New Game Button (retry with fresh lives)
    const newGameButton = this.createLoseButton('🎮 NEW GAME', 'newgame-btn');
    newGameButton.style.cssText += `
        position: absolute;
        left: 50%;
        top: 85%;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
        color: #8B4513;
        border: 3px solid #8B4513;
        font-size: 12px;
        padding: 10px 20px;
    `;
    newGameButton.onclick = () => this.handleRetryWithDiscount();

    // Add buttons to container
    buttonContainer.appendChild(continueButton);
    buttonContainer.appendChild(newGameButton);

    // Add container to document
    document.body.appendChild(buttonContainer);

    // Add button styles
    this.addLoseButtonStyles();

    console.log('Lose state buttons created successfully');
};

Mario.LoseState.prototype.createLoseButton = function (text, id) {
    const button = document.createElement('button');
    button.id = id;
    button.innerHTML = text;
    button.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        pointer-events: all;
        white-space: nowrap;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;
    return button;
};

Mario.LoseState.prototype.addLoseButtonStyles = function () {
    if (document.head.querySelector('#mario-lose-button-styles')) return;

    const style = document.createElement('style');
    style.id = 'mario-lose-button-styles';
    style.textContent = `
        #mario-lose-buttons button:hover {
            transform: translate(-50%, -50%) scale(1.05) translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            filter: brightness(1.1);
        }
        
        #mario-lose-buttons button:active {
            transform: translate(-50%, -50%) scale(0.95);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        @media (max-width: 768px) {
            #mario-lose-buttons button {
                font-size: 10px !important;
                padding: 8px 16px !important;
            }
        }
    `;
    document.head.appendChild(style);
};

Mario.LoseState.prototype.removeLoseButtons = function () {
    const existingContainer = document.getElementById('mario-lose-buttons');
    if (existingContainer) {
        existingContainer.remove();
        console.log('Removed lose state buttons');
    }
};

// ============= BUTTON ACTION HANDLERS =============

Mario.LoseState.prototype.goToTitle = function () {
    console.log('🏠 Continue button clicked - going to title screen...');

    // Play button sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("pipe");
    }

    // Reset Mario character completely for fresh start from title
    if (typeof Mario.MarioCharacter !== 'undefined') {
        Mario.MarioCharacter.Lives = 3;
        Mario.MarioCharacter.DeathTime = 0;
        Mario.MarioCharacter.WinTime = 0;
        Mario.MarioCharacter.DeathDiscountTriggered = false;
        console.log('✨ Mario character reset for title screen');
    }

    // Get the current context from the Application instance
    if (typeof Enjine !== 'undefined' && Enjine.Application && Enjine.Application.Instance) {
        Enjine.Application.Instance.stateContext.ChangeState(new Mario.TitleState());
    }
};