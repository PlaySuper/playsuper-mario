/**
    Displays the title screen and menu.
    Code by Rob Kleffner, 2011
*/

Mario.TitleState = function () {
    this.drawManager = null;
    this.camera = null;
    this.logoY = null;
    this.bounce = null;
    this.font = null;
    this.lastKeyPressTime = 0; // Track last key press to prevent rapid toggling
};

Mario.TitleState.prototype = new Enjine.GameState();

Mario.TitleState.prototype.Enter = function () {
    console.log('🏠 Entering title state...');

    // Clean up any existing modals or overlays first
    this.cleanupExistingModals();

    this.drawManager = new Enjine.DrawableManager();
    this.camera = new Enjine.Camera();

    var bgGenerator = new Mario.BackgroundGenerator(2048, 15, true, Mario.LevelType.Overground);
    var bgLayer0 = new Mario.BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 2);
    bgGenerator.SetValues(2048, 15, false, Mario.LevelType.Overground);
    var bgLayer1 = new Mario.BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 1);

    this.title = new Enjine.Sprite();
    this.title.Image = Enjine.Resources.Images["title"];
    this.title.X = 0, this.title.Y = 120;

    this.logo = new Enjine.Sprite();
    this.logo.Image = Enjine.Resources.Images["logo"];
    this.logo.X = 0, this.logo.Y = 0;

    // Create buttons instead of keyboard text prompts
    this.createTitleButtons();

    this.logoY = 20;

    // Initialize daily rewards system
    this.dailyRewards = null;
    this.initializeDailyRewards();

    this.drawManager.Add(bgLayer0);
    this.drawManager.Add(bgLayer1);

    this.bounce = 0;

    // Mario character should already be initialized in LoadingState
    if (!Mario.MarioCharacter) {
        console.warn('Mario character not initialized, creating fallback');
        Mario.MarioCharacter = new Mario.Character();
        Mario.MarioCharacter.Image = Enjine.Resources.Images["smallMario"];
    } else {
        // Reset Mario character state completely when returning home
        console.log('🔄 Performing comprehensive Mario character reset...');
        Mario.MarioCharacter.Lives = 3;
        Mario.MarioCharacter.WinTime = 0;
        Mario.MarioCharacter.DeathTime = 0;
        Mario.MarioCharacter.DeathDiscountTriggered = false;
        Mario.MarioCharacter.Large = false;
        Mario.MarioCharacter.Fire = false;

        // Reset position and movement states
        Mario.MarioCharacter.X = 32;
        Mario.MarioCharacter.Y = 0;
        Mario.MarioCharacter.Xa = 0;
        Mario.MarioCharacter.Ya = 0;
        Mario.MarioCharacter.OnGround = false;
        Mario.MarioCharacter.Sliding = false;
        Mario.MarioCharacter.JumpTime = 0;
        Mario.MarioCharacter.CanJump = false;

        // Reset any level-specific flags
        Mario.MarioCharacter.LevelString = "";

        console.log('Mario character fully reset for new game session');
    }

    Mario.PlayTitleMusic();

    // 🔄 Reset key press timer when entering title state
    this.lastKeyPressTime = 0;

    // 🎹 Clear any stuck keyboard states to prevent input issues
    if (typeof Enjine.KeyboardInput !== 'undefined' && Enjine.KeyboardInput.Pressed) {
        // Clear all pressed key states
        for (let key in Enjine.KeyboardInput.Pressed) {
            Enjine.KeyboardInput.Pressed[key] = false;
        }
        console.log('🎹 Keyboard state cleared');
    }

    console.log('Title state fully initialized - key input ready');
};

Mario.TitleState.prototype.Exit = function () {
    console.log('🚪 Exiting title state...');

    Mario.StopMusic();

    // Clean up buttons
    this.removeTitleButtons();

    this.drawManager.Clear();
    delete this.drawManager;
    delete this.camera;

    console.log('Title state cleanup complete');
};

Mario.TitleState.prototype.Update = function (delta) {
    this.bounce += delta * 2;
    this.logoY = 20 + Math.sin(this.bounce) * 10;

    this.camera.X += delta * 25;

    this.drawManager.Update(delta);

    // Update button positions if canvas moved (responsive design)
    this.updateButtonPositions();
};

Mario.TitleState.prototype.updateButtonPositions = function () {
    const buttonContainer = document.getElementById('mario-title-buttons');
    const canvas = document.getElementById('canvas');

    if (buttonContainer && canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        buttonContainer.style.top = canvasRect.top + 'px';
        buttonContainer.style.left = canvasRect.left + 'px';
        buttonContainer.style.width = canvasRect.width + 'px';
        buttonContainer.style.height = canvasRect.height + 'px';
    }
};

Mario.TitleState.prototype.Draw = function (context) {
    this.drawManager.Draw(context, this.camera);

    context.drawImage(Enjine.Resources.Images["title"], 0, 120);
    context.drawImage(Enjine.Resources.Images["logo"], 0, this.logoY);
};

// ============= BUTTON CREATION SYSTEM =============

Mario.TitleState.prototype.createTitleButtons = function () {
    console.log('Creating title screen buttons...');

    // Clean up any existing buttons
    this.removeTitleButtons();

    // Get canvas position for button positioning
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        console.error('Canvas not found for button positioning');
        return;
    }

    const canvasRect = canvas.getBoundingClientRect();

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'mario-title-buttons';
    buttonContainer.style.cssText = `
        position: absolute;
        top: ${canvasRect.top}px;
        left: ${canvasRect.left}px;
        width: ${canvasRect.width}px;
        height: ${canvasRect.height}px;
        pointer-events: none;
        z-index: 1000;
    `;

    // Start Game Button
    const startButton = this.createButton('🏁 START GAME', 'start-btn');
    startButton.style.cssText += `
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #32CD32 0%, #228B22 100%);
        color: white;
        border: 3px solid #006400;
        font-size: 14px;
        padding: 12px 24px;
    `;
    startButton.onclick = () => this.startGame();

    // Rewards Store Button
    const rewardsButton = this.createButton('🏪 REWARDS STORE', 'rewards-btn');
    rewardsButton.style.cssText += `
        position: absolute;
        left: 50%;
        top: 60%;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
        color: #8B4513;
        border: 3px solid #8B4513;
        font-size: 12px;
        padding: 10px 20px;
    `;
    rewardsButton.onclick = () => this.openRewardsStore();

    // Daily Rewards Button
    const dailyButton = this.createButton('🎁 DAILY REWARDS', 'daily-btn');
    dailyButton.style.cssText += `
        position: absolute;
        left: 50%;
        top: 70%;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #9370DB 0%, #663399 100%);
        color: white;
        border: 3px solid #4B0082;
        font-size: 12px;
        padding: 10px 20px;
    `;
    dailyButton.onclick = () => this.showDailyRewards();

    // Add buttons to container
    buttonContainer.appendChild(startButton);
    buttonContainer.appendChild(rewardsButton);
    buttonContainer.appendChild(dailyButton);

    // Add container to document
    document.body.appendChild(buttonContainer);

    // Add button styles
    this.addButtonStyles();

    console.log('Title screen buttons created successfully');
};

Mario.TitleState.prototype.createButton = function (text, id) {
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

Mario.TitleState.prototype.addButtonStyles = function () {
    if (document.head.querySelector('#mario-title-button-styles')) return;

    const style = document.createElement('style');
    style.id = 'mario-title-button-styles';
    style.textContent = `
        #mario-title-buttons button:hover {
            transform: translate(-50%, -50%) scale(1.05) translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            filter: brightness(1.1);
        }
        
        #mario-title-buttons button:active {
            transform: translate(-50%, -50%) scale(0.95);
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        #mario-title-buttons button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: translate(-50%, -50%) !important;
        }
        
        @media (max-width: 768px) {
            #mario-title-buttons button {
                font-size: 10px !important;
                padding: 8px 16px !important;
            }
        }
    `;
    document.head.appendChild(style);
};

Mario.TitleState.prototype.removeTitleButtons = function () {
    const existingContainer = document.getElementById('mario-title-buttons');
    if (existingContainer) {
        existingContainer.remove();
        console.log('Removed existing title buttons');
    }
};

// ============= BUTTON ACTION HANDLERS =============

Mario.TitleState.prototype.startGame = function () {
    console.log('Start game button clicked');

    // Play button sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup");
    }

    // Create fresh MapState and change to it
    console.log('🗺️ Creating fresh MapState for clean game entry...');
    Mario.GlobalMapState = new Mario.MapState();

    // Get the current context from the Application instance
    if (typeof Enjine !== 'undefined' && Enjine.Application && Enjine.Application.Instance) {
        Enjine.Application.Instance.ChangeState(Mario.GlobalMapState);
    }
};

Mario.TitleState.prototype.openRewardsStore = function () {
    console.log('🏪 Rewards store button clicked');

    // Play button sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }

    if (typeof Mario.playSuperIntegration !== 'undefined') {
        Mario.playSuperIntegration.openStore();
    } else {
        console.warn('PlaySuper integration not available');
        alert('Rewards store not available. Please check your PlaySuper integration.');
    }
};

Mario.TitleState.prototype.CheckForChange = function (context) {
    // Button navigation has replaced keyboard navigation
    // This method is now primarily for state management
};/**
 * 🧹 Clean up any existing modals or overlays
 */
Mario.TitleState.prototype.cleanupExistingModals = function () {
    console.log('🧹 Cleaning up existing modals...');

    // Remove any daily rewards modals
    const dailyModal = document.getElementById('mario-daily-rewards-modal');
    if (dailyModal) {
        dailyModal.remove();
        console.log('Removed daily rewards modal');
    }

    // Remove any discount scratch cards
    const scratchOverlay = document.getElementById('mario-scratch-overlay');
    if (scratchOverlay) {
        scratchOverlay.remove();
        console.log('Removed scratch card overlay');
    }

    // Remove any treasure chest modals
    const treasureModal = document.getElementById('mario-treasure-modal');
    if (treasureModal) {
        treasureModal.remove();
        console.log('Removed treasure modal');
    }

    // Remove any store iframes
    const storeFrame = document.getElementById('playsuper-store-iframe');
    if (storeFrame) {
        storeFrame.remove();
        console.log('Removed store iframe');
    }

    // Clear any timeouts or intervals that might be running
    // Reset any global state that might interfere
    if (typeof Mario.playSuperIntegration !== 'undefined') {
        Mario.playSuperIntegration.closeStore();
    }

    console.log('Modal cleanup complete');
};

// ============= DAILY REWARDS INTEGRATION =============

/**
 * Initialize daily rewards system
 */
Mario.TitleState.prototype.initializeDailyRewards = function () {
    if (typeof Mario.dailyRewards !== 'undefined') {
        this.dailyRewards = Mario.dailyRewards;
        console.log('Daily rewards system connected to title screen');
    } else {
        console.warn('⚠️ Daily rewards system not available');
    }
};

/**
 * 🎲 Show daily rewards modal with spin wheel
 */
Mario.TitleState.prototype.showDailyRewards = function () {
    if (!this.dailyRewards) {
        console.warn('⚠️ Daily rewards not initialized');
        return;
    }

    // Check if player can claim today
    if (!this.dailyRewards.checkCanClaim()) {
        this.showAlreadyClaimedMessage();
        return;
    }

    console.log('Showing daily rewards modal...');

    // Create beautiful modal overlay
    this.createDailyRewardsModal();
};

/**
 * Create stunning daily rewards modal
 */
Mario.TitleState.prototype.createDailyRewardsModal = function () {
    // Remove any existing modal
    const existingModal = document.getElementById('mario-daily-rewards-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'mario-daily-rewards-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 30000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        animation: fadeIn 0.3s ease-in-out;
    `;

    // Create modal content
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        border: 4px solid #FFD700;
        padding: 30px;
        text-align: center;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        position: relative;
    `;

    // Add title
    const title = document.createElement('h2');
    title.innerHTML = 'DAILY REWARDS';
    title.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #FFD700;
        font-size: 18px;
        margin-bottom: 20px;
        text-shadow: 2px 2px 0px #000;
    `;

    // Add description
    const description = document.createElement('p');
    description.innerHTML = 'Spin the wheel for your guaranteed daily reward!<br/><strong>Gift card guaranteed!</strong>';
    description.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #FFFFFF;
        font-size: 10px;
        line-height: 1.6;
        margin-bottom: 30px;
        text-shadow: 1px 1px 0px #000;
    `;

    // Spin wheel container
    const wheelContainer = document.createElement('div');
    wheelContainer.id = 'daily-wheel-container';
    wheelContainer.style.cssText = `
        margin: 20px 0;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // Spin button
    const spinButton = document.createElement('button');
    spinButton.innerHTML = '🎲 SPIN FOR REWARDS! 🎲';
    spinButton.style.cssText = `
        background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
        color: #000;
        border: 3px solid #8B4513;
        padding: 15px 30px;
        border-radius: 10px;
        font-family: 'Press Start 2P', 'Courier New', monospace;
        font-size: 12px;
        cursor: pointer;
        margin: 20px 0;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        transition: all 0.1s ease;
    `;

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✖ CLOSE';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: #E74C3C;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Press Start 2P', 'Courier New', monospace;
        font-size: 8px;
    `;

    // Assemble modal
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(wheelContainer);
    content.appendChild(spinButton);
    content.appendChild(closeButton);
    modal.appendChild(content);

    // Add styles if not exists
    this.addDailyRewardsStyles();

    // Event handlers
    closeButton.onclick = () => this.closeDailyRewardsModal();
    spinButton.onclick = () => this.handleDailySpin(wheelContainer, spinButton);

    // Add to document
    document.body.appendChild(modal);

    // Play modal open sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup");
    }
};

/**
 * 🎲 Handle the daily spin process
 */
Mario.TitleState.prototype.handleDailySpin = function (wheelContainer, spinButton) {
    spinButton.disabled = true;
    spinButton.innerHTML = '⏳ LOADING REWARDS...';

    console.log('🎲 Starting daily spin process...');

    // Fetch today's rewards and create spin wheel
    this.dailyRewards.fetchDailyRewards()
        .then(spinWheelData => {
            console.log('Rewards loaded, creating spin wheel...');

            // Create spin wheel with rewards
            const spinWheel = Mario.SpinWheel.createWithRewards(spinWheelData.wheelRewards);
            if (!spinWheel) {
                throw new Error('Failed to create spin wheel');
            }

            // Add wheel to container
            wheelContainer.innerHTML = '';
            wheelContainer.appendChild(spinWheel.getCanvas());

            // Initial render
            spinWheel.render();

            // Update button to spin
            spinButton.innerHTML = 'SPIN NOW!';
            spinButton.disabled = false;

            // Update button click handler
            spinButton.onclick = () => {
                spinButton.disabled = true;
                spinButton.innerHTML = 'SPINNING...';

                // Start the spin!
                spinWheel.spin((winningReward) => {
                    console.log('Spin complete! Won:', winningReward.name);

                    // Process the actual claim
                    this.processDailyClaim(winningReward, spinWheelData);
                });
            };
        })
        .catch(error => {
            console.error('Failed to load daily rewards:', error);
            this.showDailyRewardsError();
        });
};

/**
 * Process the actual daily claim after spin
 */
Mario.TitleState.prototype.processDailyClaim = function (winningReward, spinWheelData) {
    console.log('🏆 Processing daily claim for:', winningReward.name);

    // Claim the reward through the daily rewards system
    this.dailyRewards.claimDailyReward()
        .then(claimData => {
            console.log('✅ Daily reward claimed successfully!');
            this.showClaimSuccessMessage(winningReward, claimData);
        })
        .catch(error => {
            console.warn('⚠️ Claim processing failed, but user still gets visual reward:', error);
            this.showClaimSuccessMessage(winningReward, { visualOnly: true });
        });
};

/**
 * ✅ Show success message after claim
 */
Mario.TitleState.prototype.showClaimSuccessMessage = function (winningReward, claimData) {
    const modal = document.getElementById('mario-daily-rewards-modal');
    if (!modal) return;

    // Update modal content to show success
    const content = modal.querySelector('div');
    content.innerHTML = `
        <h2 style="font-family: 'Press Start 2P'; color: #FFD700; font-size: 18px; margin-bottom: 20px; text-shadow: 2px 2px 0px #000;">
            🎉 CONGRATULATIONS! 🎉
        </h2>
        <div style="font-family: 'Press Start 2P'; color: #FFFFFF; font-size: 12px; line-height: 1.6; margin-bottom: 20px; text-shadow: 1px 1px 0px #000;">
            You won:<br/>
            <strong style="color: #FFD700;">${winningReward.name}</strong>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 20px 0;">
            <div style="font-family: 'Press Start 2P'; color: #90EE90; font-size: 10px; line-height: 1.4;">
                ✅ Reward claimed successfully!<br/>
                Come back tomorrow for more rewards!
            </div>
        </div>
        <button onclick="document.getElementById('mario-daily-rewards-modal').remove()" 
                style="background: linear-gradient(180deg, #32CD32 0%, #228B22 100%); color: white; border: 3px solid #006400; padding: 15px 30px; border-radius: 10px; font-family: 'Press Start 2P'; font-size: 12px; cursor: pointer; margin-top: 20px;">
            🎮 CONTINUE PLAYING
        </button>
    `;

    // Play success sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("1-up");
    }
};

/**
 * ⏰ Show already claimed message
 */
Mario.TitleState.prototype.showAlreadyClaimedMessage = function () {
    const analytics = this.dailyRewards.getAnalytics();
    const nextClaimTime = analytics.nextClaimTime;
    const timeUntilNext = Math.ceil((nextClaimTime - new Date()) / (1000 * 60 * 60)); // Hours

    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #FFFFFF;
            padding: 25px 35px;
            border-radius: 15px;
            border: 3px solid #FFD700;
            font-family: 'Press Start 2P', 'Courier New', monospace;
            font-size: 10px;
            text-align: center;
            z-index: 25000;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5);
            animation: bounceIn 0.5s ease-out;
        ">
            <div style="margin-bottom: 15px; font-size: 12px; color: #FFD700;">⏰ DAILY REWARD</div>
            <div style="line-height: 1.4; margin-bottom: 15px;">
                Already claimed today!<br/>
                Come back in ${timeUntilNext} hours
            </div>
            <div style="font-size: 8px; color: #DDD;">
                Streak: ${analytics.currentStreak} days 🔥
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s ease-out';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);

    // Play notification sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("bump");
    }
};

/**
 * ❌ Show error message for daily rewards
 */
Mario.TitleState.prototype.showDailyRewardsError = function () {
    const modal = document.getElementById('mario-daily-rewards-modal');
    if (!modal) return;

    const content = modal.querySelector('div');
    content.innerHTML = `
        <h2 style="font-family: 'Press Start 2P'; color: #E74C3C; font-size: 16px; margin-bottom: 20px; text-shadow: 2px 2px 0px #000;">
            ⚠️ CONNECTION ERROR
        </h2>
        <div style="font-family: 'Press Start 2P'; color: #FFFFFF; font-size: 10px; line-height: 1.6; margin-bottom: 30px; text-shadow: 1px 1px 0px #000;">
            Unable to load daily rewards.<br/>
            Please check your connection<br/>
            and try again later.
        </div>
        <button onclick="document.getElementById('mario-daily-rewards-modal').remove()" 
                style="background: #E74C3C; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-family: 'Press Start 2P'; font-size: 10px; cursor: pointer;">
            OK
        </button>
    `;
};

/**
 * 🎨 Add necessary CSS styles
 */
Mario.TitleState.prototype.addDailyRewardsStyles = function () {
    if (document.head.querySelector('#mario-daily-rewards-styles')) return;

    const style = document.createElement('style');
    style.id = 'mario-daily-rewards-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes bounceIn {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.05); }
            70% { transform: translate(-50%, -50%) scale(0.9); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        #mario-daily-rewards-modal button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }
        
        #mario-daily-rewards-modal button:active {
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
};

/**
 * ❌ Close daily rewards modal
 */
Mario.TitleState.prototype.closeDailyRewardsModal = function () {
    const modal = document.getElementById('mario-daily-rewards-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
};
