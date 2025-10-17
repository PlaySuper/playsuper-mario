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
    this.discountCheckDelay = 2.5; // Wait 2.5 seconds before checking for discounts
    this.discountTimer = 0;
    this.discountOffered = false;
};

Mario.LoseState.prototype = new Enjine.GameState();

Mario.LoseState.prototype.Enter = function () {
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
        if (this.discountTimer >= this.discountCheckDelay) {
            this.checkForDiscountOffer();
        }
    }

    // Button functionality replaced keyboard controls
};

Mario.LoseState.prototype.Draw = function (context) {
    this.drawManager.Draw(context, this.camera);
};

Mario.LoseState.prototype.CheckForChange = function (context) {
    // Button navigation has replaced keyboard navigation
};

Mario.LoseState.prototype.checkForDiscountOffer = function () {
    this.discountOffered = true;

    // Check if discount system is available and can generate discount
    if (typeof Mario.discountSystem !== 'undefined' &&
        Mario.discountSystem.isInitialized &&
        Mario.discountSystem.canGenerateDiscount()) {

        console.log('LoseState: Checking for recovery discount offer...');

        // Add contextual message about possible discounts
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Looking for recovery options...", X: 60, Y: 200 };
        }

        // Slight delay to build anticipation
        setTimeout(() => {
            Mario.discountSystem.onPlayerDeath();
        }, 1000);
    } else {
        console.log('LoseState: No discount available or system not ready');

        // Show alternative message
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Try again?", X: 120, Y: 200 };
        }
    }
};

Mario.LoseState.prototype.handleRetryWithDiscount = function () {
    console.log('LoseState: Player wants to retry');

    // If discount system is available, show a special retry offer
    if (typeof Mario.discountSystem !== 'undefined' &&
        Mario.discountSystem.isInitialized) {

        // Show a quick retry discount if available
        Mario.discountSystem.generateDiscountCode()
            .then(discount => {
                console.log('Retry discount available:', discount);
                Mario.discountSystem.showDiscountModal(discount);
            })
            .catch(error => {
                console.log('No retry discount available:', error);
                // Just restart the level
                this.restartLevel();
            });
    } else {
        // No discount system, just restart
        this.restartLevel();
    }
};

Mario.LoseState.prototype.restartLevel = function () {
    console.log('LoseState: Restarting level...');

    // Reset Mario's state and restart the level
    if (typeof Mario.MarioCharacter !== 'undefined') {
        Mario.MarioCharacter.DeathTime = 0;
        Mario.MarioCharacter.WinTime = 0;
    }

    // Transition to level state (this might need adjustment based on level system)
    if (typeof Mario.LevelState !== 'undefined') {
        var app = Enjine.Application.Instance;
        if (app && app.stateContext) {
            app.stateContext.ChangeState(new Mario.LevelState());
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

    // Retry Button
    const retryButton = this.createLoseButton('🔄 RETRY LEVEL', 'retry-btn');
    retryButton.style.cssText += `
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
    retryButton.onclick = () => this.handleRetryWithDiscount();

    // Add buttons to container
    buttonContainer.appendChild(continueButton);
    buttonContainer.appendChild(retryButton);

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
    console.log('Continue button clicked - going to title screen...');

    // Play button sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("pipe");
    }

    // Get the current context from the Application instance
    if (typeof Enjine !== 'undefined' && Enjine.Application && Enjine.Application.Instance) {
        Enjine.Application.Instance.ChangeState(new Mario.TitleState());
    }
};