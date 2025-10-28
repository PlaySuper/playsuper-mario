/**
 * Mobile Touch Controls for Mario Game
 * GameBoy-inspired design with touch events
 * 
 * Layout Strategy:
 * - D-Pad on the left side for movement (up/down for duck, left/right for movement)
 * - A/B buttons on the right side for actions (B=jump, A=run)
 * - Fixed position at bottom 50% of screen
 * - Visual feedback for button presses
 */

Mario.MobileControls = function () {
    this.container = null;           // Main controls container
    this.buttons = {};               // Button element references
    this.isEnabled = false;          // Whether controls are active
    this.touchStarted = {};          // Track which touches are active
    this.currentScreen = null;       // Track current screen state
    this.lastUpdateTime = 0;         // Throttle screen updates

    console.log('MobileControls: Initialized');
};

Mario.MobileControls.prototype.initialize = function () {
    console.log('MobileControls: Starting initialization...');

    // Prevent double initialization
    if (this.isEnabled) {
        console.log('MobileControls: Already initialized, skipping');
        return;
    }

    // Only create controls if we should show them
    if (!this.shouldShowControls()) {
        console.log('MobileControls: Not a mobile device, skipping controls');
        return;
    }

    console.log('MobileControls: Mobile device detected, creating controls');

    // Wait for DOM and game to be ready before initializing
    this.waitForGameReady(() => {
        try {
            this.createControlsContainer();
            this.createButtons();
            this.attachEventListeners();
            this.isEnabled = true;

            console.log('MobileControls: Successfully initialized');

            // Start initial screen detection with retries
            this.performInitialScreenDetection();
        } catch (error) {
            console.error('MobileControls: Failed to initialize:', error);
        }
    });
};

// New method for initial screen detection with retries
Mario.MobileControls.prototype.performInitialScreenDetection = function () {
    console.log('MobileControls: Starting initial screen detection...');

    const tryDetect = (attempt) => {
        console.log(`MobileControls: Screen detection attempt ${attempt}`);

        // Check if Application.Instance is available with stateContext
        if (window.Enjine?.Application?.Instance?.stateContext) {
            console.log('MobileControls: ✅ Application.Instance ready, detecting screen...');
            this.checkAndUpdateScreen();
            console.log('MobileControls: Initial screen detection completed');
            return;
        }

        // Also check if we can detect the state directly from the stateContext object
        if (window.Enjine?.Application?.Instance) {
            const app = window.Enjine.Application.Instance;
            if (app.stateContext && typeof app.stateContext === 'object') {
                // First check if stateContext IS the actual state object
                if (app.stateContext.constructor && app.stateContext.constructor.name === 'MapState') {
                    console.log('MobileControls: ✅ stateContext IS MapState during initialization, switching to map controls');
                    this.currentScreen = 'map';
                    this.createButtons();
                    this.attachEventListeners();
                    console.log('MobileControls: Initial screen detection completed');
                    return;
                } else if (app.stateContext.constructor && app.stateContext.constructor.name === 'LevelState') {
                    console.log('MobileControls: ✅ stateContext IS LevelState during initialization, switching to level controls');
                    this.currentScreen = 'level';
                    this.createButtons();
                    this.attachEventListeners();
                    console.log('MobileControls: Initial screen detection completed');
                    return;
                } else if (app.stateContext.constructor && app.stateContext.constructor.name === 'TitleState') {
                    console.log('MobileControls: ✅ stateContext IS TitleState during initialization, keeping title controls');
                    this.currentScreen = 'title';
                    this.createButtons();
                    this.attachEventListeners();
                    console.log('MobileControls: Initial screen detection completed');
                    return;
                }

                // Check if this is a wrapper object (like your JSON with "State" property)
                if (app.stateContext.State) {
                    const wrappedState = app.stateContext.State;
                    console.log('MobileControls: 🔍 Found wrapped state during initialization, checking...');

                    // Check LevelState first (more specific)
                    if (wrappedState.Level && Array.isArray(wrappedState.Level)) {
                        console.log('MobileControls: ✅ Detected wrapped LevelState via Level array during initialization, switching to level controls');
                        this.currentScreen = 'level';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    }
                    // Check LevelState first (more specific)
                    if (wrappedState.XMario !== undefined && wrappedState.YMario !== undefined) {
                        console.log('MobileControls: ✅ Detected wrapped LevelState via XMario/YMario during initialization, switching to level controls');
                        this.currentScreen = 'level';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    }
                    // Check MapState
                    else if (wrappedState.WorldNumber !== undefined || wrappedState.MapImage !== undefined || wrappedState.CanEnterLevel !== undefined) {
                        console.log('MobileControls: ✅ Detected wrapped MapState via WorldNumber/MapImage/CanEnterLevel during initialization, switching to map controls');
                        console.log('MobileControls: Wrapped MapState indicators - WorldNumber:', wrappedState.WorldNumber, 'MapImage:', !!wrappedState.MapImage, 'CanEnterLevel:', wrappedState.CanEnterLevel);
                        this.currentScreen = 'map';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    }
                    // Check constructor as final fallback for wrapped state
                    else if (wrappedState.constructor?.name === 'MapState') {
                        console.log('MobileControls: ✅ Detected wrapped MapState via constructor during initialization, switching to map controls');
                        this.currentScreen = 'map';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    } else if (wrappedState.constructor?.name === 'LevelState') {
                        console.log('MobileControls: ✅ Detected wrapped LevelState via constructor during initialization, switching to level controls');
                        this.currentScreen = 'level';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    } else if (wrappedState.constructor?.name === 'TitleState') {
                        console.log('MobileControls: ✅ Detected wrapped TitleState during initialization, keeping title controls');
                        this.currentScreen = 'title';
                        this.createButtons();
                        this.attachEventListeners();
                        console.log('MobileControls: Initial screen detection completed');
                        return;
                    }
                }

                // Fallback: Check for state-specific properties
                // Check for MapState first (more specific properties)
                if (app.stateContext.WorldNumber !== undefined || app.stateContext.MapImage !== undefined || app.stateContext.CanEnterLevel !== undefined) {
                    console.log('MobileControls: 🔍 Detected MapState properties during initialization, switching to map controls');
                    console.log('MobileControls: MapState indicators - WorldNumber:', app.stateContext.WorldNumber, 'MapImage:', !!app.stateContext.MapImage, 'CanEnterLevel:', app.stateContext.CanEnterLevel);
                    this.currentScreen = 'map';
                    this.createButtons();
                    this.attachEventListeners();
                    console.log('MobileControls: Initial screen detection completed');
                    return;
                }
                // Check for LevelState (has XMario/YMario positions)
                if (app.stateContext.XMario !== undefined && app.stateContext.YMario !== undefined) {
                    console.log('MobileControls: 🔍 Detected LevelState properties during initialization, switching to level controls');
                    this.currentScreen = 'level';
                    this.createButtons();
                    this.attachEventListeners();
                    console.log('MobileControls: Initial screen detection completed');
                    return;
                }
            }
        }

        // If not ready and we haven't tried too many times, try again
        if (attempt < 10) {
            setTimeout(() => tryDetect(attempt + 1), 500);
        } else {
            console.log('MobileControls: ❌ Application.Instance not ready after 10 attempts, using fallback detection');
            this.checkAndUpdateScreen(); // Still try to detect using fallback methods
        }
    };

    // Start detection attempts
    setTimeout(() => tryDetect(1), 1000); // Wait 1 second before first attempt
};

Mario.MobileControls.prototype.waitForGameReady = function (callback) {
    console.log('MobileControls: Waiting for game to be ready...');

    // Check if the game is ready (DOM loaded and title screen visible)
    const checkReady = () => {
        const titleElement = document.querySelector('canvas + img[alt="title"]') || document.querySelector('.title');
        const logoElement = document.querySelector('img[alt="logo"]');
        const setupScreen = document.querySelector('.setup-screen');

        console.log('MobileControls: Game ready check - title:', !!titleElement, 'logo:', !!logoElement, 'setup:', !!setupScreen);

        if (titleElement || logoElement || (setupScreen && setupScreen.style.display !== 'none')) {
            console.log('MobileControls: Game is ready, proceeding with initialization');
            callback();

            // Initial screen detection is now handled by performInitialScreenDetection()
            console.log('MobileControls: Post-initialization setup completed');
        } else {
            console.log('MobileControls: Game not ready yet, waiting...');
            setTimeout(checkReady, 100); // Check again in 100ms
        }
    };

    checkReady();
};

Mario.MobileControls.prototype.shouldShowControls = function () {
    // Multiple detection methods for reliability
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const userAgent = navigator.userAgent;
    const touchSupport = 'ontouchstart' in window;

    // Primary: viewport width detection
    const isSmallScreen = viewportWidth <= 768;

    // Secondary: touch device detection
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // Final decision
    const shouldShow = isSmallScreen || (touchSupport && isMobileUA);

    console.log('MobileControls: Detection Results:');
    console.log('  - Viewport:', viewportWidth + 'x' + viewportHeight);
    console.log('  - Small screen (<= 768px):', isSmallScreen);
    console.log('  - Touch support:', touchSupport);
    console.log('  - Mobile user agent:', isMobileUA);
    console.log('  - FINAL DECISION:', shouldShow);

    return shouldShow;
};

Mario.MobileControls.prototype.updateControls = function () {
    // Only update if controls are enabled and not too frequently
    if (!this.isEnabled) return;

    const now = Date.now();
    if (now - this.lastUpdateTime < 200) return; // Throttle to every 200ms (even more responsive)
    this.lastUpdateTime = now;

    const currentScreen = this.detectCurrentScreen();
    const actualGameState = this.getCurrentGameState();

    // Log state mismatch for debugging
    if (this.currentScreen !== currentScreen) {
        console.log('MobileControls: 🎯 Screen change detected:', this.currentScreen, '→', currentScreen, '(Game state:', actualGameState + ')');
        console.log('MobileControls: 🔄 Updating buttons for:', currentScreen);
    }

    // Only rebuild if screen changed
    if (currentScreen !== this.currentScreen) {
        console.log('MobileControls: Updating controls for screen:', currentScreen);
        this.currentScreen = currentScreen;

        // Clear existing buttons
        if (this.container) {
            this.container.innerHTML = '';
            this.buttons = {};
        }

        // Recreate buttons for new screen
        this.createButtons();
        this.attachEventListeners();
    }
};

Mario.MobileControls.prototype.createControlsContainer = function () {
    console.log('MobileControls: Creating controls container');

    this.container = document.createElement('div');
    this.container.id = 'mobile-controls';

    // GameBoy-inspired styling
    this.container.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50vh;
        background: linear-gradient(135deg, #2C1810 0%, #3D251A 50%, #2C1810 100%);
        border-top: 4px solid #8B4513;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        z-index: 1000;
        box-shadow: 0 -4px 8px rgba(0,0,0,0.3);
        user-select: none;
        touch-action: manipulation;
    `;

    document.body.appendChild(this.container);
    console.log('MobileControls: Container created and added to DOM');
};

Mario.MobileControls.prototype.createButtons = function () {
    console.log('MobileControls: Creating buttons');

    // Determine which screen we're on and show appropriate controls
    const currentScreen = this.detectCurrentScreen();
    this.currentScreen = currentScreen; // Track current screen

    if (currentScreen === 'title') {
        // Title screen: Show Start/Store/Daily buttons
        const titleButtonsContainer = this.createTitleScreenButtons();
        this.container.appendChild(titleButtonsContainer);
    } else if (currentScreen === 'map') {
        // Map screen: Show D-Pad for navigation + Enter/Home buttons
        const mapControlsContainer = this.createMapScreenButtons();
        this.container.appendChild(mapControlsContainer);
    } else {
        // Game/Level screen: Show full D-Pad and Action buttons
        const dPadContainer = this.createDPad();
        this.container.appendChild(dPadContainer);

        const actionContainer = this.createActionButtons('level');
        this.container.appendChild(actionContainer);
    }

    console.log('MobileControls: All buttons created for screen:', currentScreen);
};

Mario.MobileControls.prototype.showTitleControls = function () {
    if (!this.isEnabled || !this.container) return;
    console.log('MobileControls: Explicitly showing Title controls');
    this.container.innerHTML = '';
    this.buttons = {};
    const titleButtonsContainer = this.createTitleScreenButtons();
    this.container.appendChild(titleButtonsContainer);
    this.attachEventListeners();
    this.currentScreen = 'title';
};

Mario.MobileControls.prototype.showMapControls = function () {
    if (!this.isEnabled || !this.container) return;
    console.log('MobileControls: Explicitly showing Map controls');
    this.container.innerHTML = '';
    this.buttons = {};
    const mapControlsContainer = this.createMapScreenButtons();
    this.container.appendChild(mapControlsContainer);
    this.attachEventListeners();
    this.currentScreen = 'map';
};

Mario.MobileControls.prototype.showLevelControls = function () {
    if (!this.isEnabled || !this.container) return;
    console.log('MobileControls: Explicitly showing Level controls');
    this.container.innerHTML = '';
    this.buttons = {};
    const dPadContainer = this.createDPad();
    this.container.appendChild(dPadContainer);
    const actionContainer = this.createActionButtons('level');
    this.container.appendChild(actionContainer);
    this.attachEventListeners();
    this.currentScreen = 'level';
};

// Method to force screen update (useful when game state changes)
Mario.MobileControls.prototype.forceScreenUpdate = function () {
    console.log('MobileControls: Forcing screen update...');
    this.updateControls();
};

// Method to check and update screen immediately (bypasses throttling)
Mario.MobileControls.prototype.checkAndUpdateScreen = function () {
    if (!this.isEnabled || !this.container) return;

    const currentScreen = this.detectCurrentScreen();

    // Only rebuild if screen changed
    if (currentScreen !== this.currentScreen) {
        console.log('MobileControls: Immediate screen change detected:', this.currentScreen, '->', currentScreen);
        this.currentScreen = currentScreen;

        // Clear existing buttons
        this.container.innerHTML = '';
        this.buttons = {};

        // Recreate buttons for new screen
        this.createButtons();
        this.attachEventListeners();
    }
};

Mario.MobileControls.prototype.detectCurrentScreen = function () {
    console.log('MobileControls: Detecting current screen...');
    const app = window.Enjine && Enjine.Application && Enjine.Application.Instance;
    if (app && app.stateContext) {
        // Prefer wrapped state if present
        const state = app.stateContext.State || app.stateContext;

        // 1) Constructor name if meaningful
        const ctorName = state && state.constructor && state.constructor.name || 'unknown';
        console.log('MobileControls: Engine state detected:', ctorName);
        if (ctorName === 'TitleState') return 'title';
        if (ctorName === 'MapState') return 'map';
        if (ctorName === 'LevelState') return 'level';

        // 2) Heuristics by properties (covers cases where constructor name is 'Object')
        if (state) {
            // Level indicators
            if (state.XMario !== undefined && state.YMario !== undefined) return 'level';
            if (state.Level && (Array.isArray(state.Level) || typeof state.Level === 'object')) return 'level';

            // Map indicators
            if (state.WorldNumber !== undefined || state.MapImage !== undefined || state.CanEnterLevel !== undefined) return 'map';

            // Title indicators
            if (state.logoY !== undefined || state.drawManager !== undefined) return 'title';
        }
    }
    console.log('MobileControls: Defaulting to title screen');
    return 'title';
};

Mario.MobileControls.prototype.createDPad = function () {
    console.log('MobileControls: Creating D-Pad');

    const dPadContainer = document.createElement('div');
    dPadContainer.style.cssText = `
        position: relative;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, #4A4A4A 60%, #2A2A2A 100%);
        border: 3px solid #1A1A1A;
        border-radius: 12px;
        box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.3);
    `;

    // Create individual D-Pad buttons
    const dPadButtons = [
        { id: 'dpad-up', action: 'up', style: 'top: 5px; left: 45px; width: 30px; height: 35px;', content: '▲' },
        { id: 'dpad-left', action: 'left', style: 'top: 45px; left: 5px; width: 35px; height: 30px;', content: '◀' },
        { id: 'dpad-right', action: 'right', style: 'top: 45px; right: 5px; width: 35px; height: 30px;', content: '▶' },
        { id: 'dpad-down', action: 'down', style: 'bottom: 5px; left: 45px; width: 30px; height: 35px;', content: '▼' }
    ];

    dPadButtons.forEach(btnConfig => {
        const button = this.createButton(btnConfig.id, btnConfig.action);
        button.innerHTML = btnConfig.content;
        button.style.cssText += btnConfig.style + `
            position: absolute;
            background: linear-gradient(145deg, #6A6A6A 0%, #3A3A3A 100%);
            border: 2px solid #1A1A1A;
            border-radius: 4px;
            color: #FFFFFF;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;
        dPadContainer.appendChild(button);
    });

    console.log('MobileControls: D-Pad created with', dPadButtons.length, 'buttons');
    return dPadContainer;
};

// Implementation of action buttons, touch handling, and action dispatch
Mario.MobileControls.prototype.createActionButtons = function (screenType = 'default') {
    console.log('MobileControls: Creating action buttons for screen:', screenType);
    const actionContainer = document.createElement('div');
    actionContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
    `;

    // Button configuration based on screen type
    let jumpText, runText;

    if (screenType === 'level') {
        // Level screen: show JUMP and RUN
        jumpText = 'JUMP';
        runText = 'RUN';
    } else {
        // Map screen: show B and A (traditional)
        jumpText = 'B';
        runText = 'A';
    }

    // Add Home button for navigation
    const homeConfig = { id: 'action-h', action: 'home', text: 'H', color: '#444', description: 'HOME' };
    const allActionConfigs = [
        { id: 'action-b', action: 'jump', text: jumpText, color: '#8B0000', description: 'JUMP' },
        { id: 'action-a', action: 'run', text: runText, color: '#000080', description: 'RUN' },
        homeConfig
    ];
    allActionConfigs.forEach(cfg => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 5px;`;
        const btn = this.createButton(cfg.id, cfg.action);
        btn.innerHTML = cfg.text;

        // Adjust font size based on text length for better fit
        const fontSize = cfg.text.length > 3 ? '12px' : '18px';

        btn.style.cssText += `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(145deg, ${cfg.color} 0%, #222 100%);
            border: 4px solid #000;
            color: white;
            font-family: 'Press Start 2P', monospace;
            font-size: ${fontSize};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        const label = document.createElement('div');
        label.textContent = cfg.description;
        label.style.cssText = `color: #CCCCCC; font-family: 'Press Start 2P', monospace; font-size: 8px; text-align: center;`;
        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        actionContainer.appendChild(wrapper);
    });
    console.log('MobileControls: Action buttons created');
    return actionContainer;
};

Mario.MobileControls.prototype.createTitleScreenButtons = function () {
    console.log('MobileControls: Creating title screen buttons');

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
        width: 100%;
        justify-content: center;
    `;

    const titleButtons = [
        { id: 'title-start', action: 'jump', text: 'START GAME', color: '#00AA00', description: 'Press to Start' },
        { id: 'title-store', action: 'run', text: 'REWARDS STORE', color: '#FFD700', description: 'Press for Store' },
        { id: 'title-daily', action: 'duck', text: 'DAILY REWARDS', color: '#FF6B6B', description: 'Press for Daily' }
    ];

    titleButtons.forEach(cfg => {
        const btn = this.createButton(cfg.id, cfg.action);
        btn.innerHTML = cfg.text;
        btn.style.cssText += `
            width: 250px;
            height: 50px;
            border-radius: 8px;
            background: linear-gradient(145deg, ${cfg.color} 0%, #222 100%);
            border: 4px solid #000;
            color: white;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        titleContainer.appendChild(btn);
    });

    console.log('MobileControls: Title screen buttons created');
    return titleContainer;
};

Mario.MobileControls.prototype.createMapScreenButtons = function () {
    console.log('MobileControls: Creating map screen buttons');

    const mapContainer = document.createElement('div');
    mapContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0 20px;
    `;

    // Navigation D-Pad (Left side)
    const navDPad = this.createNavDPad();
    mapContainer.appendChild(navDPad);

    // Action buttons (Right side)
    const mapActionContainer = document.createElement('div');
    mapActionContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
    `;

    const mapButtons = [
        { id: 'map-enter', action: 'jump', text: 'ENTER', color: '#00AA00', description: 'LEVEL' },
        { id: 'map-home', action: 'home', text: 'HOME', color: '#FF6B6B', description: 'MENU' }
    ];

    mapButtons.forEach(cfg => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `display: flex; flex-direction: column; align-items: center; gap: 5px;`;

        const btn = this.createButton(cfg.id, cfg.action);
        btn.innerHTML = cfg.text;

        // Adjust font size based on text length for better fit
        const fontSize = cfg.text.length > 3 ? '10px' : '12px';

        btn.style.cssText += `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(145deg, ${cfg.color} 0%, #222 100%);
            border: 4px solid #000;
            color: white;
            font-family: 'Press Start 2P', monospace;
            font-size: ${fontSize};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2);
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;

        const label = document.createElement('div');
        label.textContent = cfg.description;
        label.style.cssText = `color: #CCCCCC; font-family: 'Press Start 2P', monospace; font-size: 8px; text-align: center;`;

        wrapper.appendChild(btn);
        wrapper.appendChild(label);
        mapActionContainer.appendChild(wrapper);
    });

    mapContainer.appendChild(mapActionContainer);
    console.log('MobileControls: Map screen buttons created');
    return mapContainer;
};

Mario.MobileControls.prototype.createNavDPad = function () {
    console.log('MobileControls: Creating Navigation D-Pad');

    const dPadContainer = document.createElement('div');
    dPadContainer.style.cssText = `
        position: relative;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, #4A4A4A 60%, #2A2A2A 100%);
        border: 3px solid #1A1A1A;
        border-radius: 12px;
        box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.3);
    `;

    // Create individual D-Pad buttons for map navigation
    const dPadButtons = [
        { id: 'nav-up', action: 'up', style: 'top: 5px; left: 45px; width: 30px; height: 35px;', content: '▲' },
        { id: 'nav-left', action: 'left', style: 'top: 45px; left: 5px; width: 35px; height: 30px;', content: '◀' },
        { id: 'nav-right', action: 'right', style: 'top: 45px; right: 5px; width: 35px; height: 30px;', content: '▶' },
        { id: 'nav-down', action: 'down', style: 'bottom: 5px; left: 45px; width: 30px; height: 35px;', content: '▼' }
    ];

    dPadButtons.forEach(btnConfig => {
        const button = this.createButton(btnConfig.id, btnConfig.action);
        button.innerHTML = btnConfig.content;
        button.style.cssText += btnConfig.style + `
            position: absolute;
            background: linear-gradient(145deg, #6A6A6A 0%, #3A3A3A 100%);
            border: 2px solid #1A1A1A;
            border-radius: 4px;
            color: #FFFFFF;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;
        dPadContainer.appendChild(button);
    });

    console.log('MobileControls: Navigation D-Pad created');
    return dPadContainer;
};

Mario.MobileControls.prototype.createButton = function (id, action) {
    const button = document.createElement('div');
    button.id = id;
    button.dataset.action = action;
    button.style.cssText = `
        user-select: none;
        touch-action: manipulation;
        cursor: pointer;
        transition: all 0.1s ease;
        transform: scale(1);
    `;
    this.buttons[id] = button;
    console.log('MobileControls: Created button', id, 'for action', action);
    return button;
};

Mario.MobileControls.prototype.attachEventListeners = function () {
    console.log('MobileControls: Attaching event listeners to', Object.keys(this.buttons).length, 'buttons');
    Object.keys(this.buttons).forEach(id => {
        const btn = this.buttons[id];
        const action = btn.dataset.action;
        // touch events
        btn.addEventListener('touchstart', e => { e.preventDefault(); this.handleActionStart(action, id); }, { passive: false });
        btn.addEventListener('touchend', e => { e.preventDefault(); this.handleActionEnd(action, id); }, { passive: false });
        btn.addEventListener('touchcancel', e => { e.preventDefault(); this.handleActionEnd(action, id); }, { passive: false });
        // mouse events
        btn.addEventListener('mousedown', e => { e.preventDefault(); this.handleActionStart(action, id); });
        btn.addEventListener('mouseup', e => { e.preventDefault(); this.handleActionEnd(action, id); });
        btn.addEventListener('mouseleave', e => { e.preventDefault(); this.handleActionEnd(action, id); });
    });
    console.log('MobileControls: All event listeners attached');
};

Mario.MobileControls.prototype.handleActionStart = function (action, buttonId) {
    console.log('MobileControls: Action started:', action, 'from button:', buttonId);
    if (Mario.inputController) {
        // Map down to both down and duck during level gameplay for proper crouch
        if (this.currentScreen === 'level' && action === 'down') {
            Mario.inputController.setAction('down', true);
            Mario.inputController.setAction('duck', true);
        } else if (this.currentScreen === 'level' && action === 'up') {
            // Convenience: allow D-Pad up to act as jump in level
            Mario.inputController.setAction('jump', true);
            Mario.inputController.setAction('up', true);
        } else {
            Mario.inputController.setAction(action, true);
        }

        // Force immediate screen update for certain actions that change screens
        if (action === 'jump' || action === 'home') {
            console.log('MobileControls: Critical action detected, forcing immediate screen update');
            // Small delay to allow state transition to complete
            setTimeout(() => {
                this.checkAndUpdateScreen();
            }, 100);
        }
    } else {
        console.error('MobileControls: InputController not available!');
    }
    const btn = this.buttons[buttonId];
    if (btn) { btn.style.transform = 'scale(0.9)'; btn.style.filter = 'brightness(1.2)'; }
};

Mario.MobileControls.prototype.handleActionEnd = function (action, buttonId) {
    console.log('MobileControls: Action ended:', action, 'from button:', buttonId);
    if (Mario.inputController) {
        if (this.currentScreen === 'level' && action === 'down') {
            Mario.inputController.setAction('down', false);
            Mario.inputController.setAction('duck', false);
        } else if (this.currentScreen === 'level' && action === 'up') {
            Mario.inputController.setAction('jump', false);
            Mario.inputController.setAction('up', false);
        } else {
            Mario.inputController.setAction(action, false);
        }
    } else {
        console.error('MobileControls: InputController not available!');
    }
    const btn = this.buttons[buttonId];
    if (btn) { btn.style.transform = 'scale(1)'; btn.style.filter = 'brightness(1)'; }
};


// Create global instance and test immediately
Mario.mobileControls = new Mario.MobileControls();
console.log('🎮 MobileControls: Global instance created successfully!');
console.log('🎮 MobileControls: Object type:', typeof Mario.mobileControls);
console.log('🎮 MobileControls: Has initialize method:', typeof Mario.mobileControls.initialize);

// Expose debug methods for testing
Mario.mobileControls.debugInfo = function () {
    console.log('=== MobileControls Debug Info ===');
    console.log('isEnabled:', this.isEnabled);
    console.log('currentScreen:', this.currentScreen);
    console.log('buttons count:', Object.keys(this.buttons).length);
    console.log('container exists:', !!this.container);
    console.log('touchEnabled:', this.touchEnabled);
    console.log('Detected screen:', this.detectCurrentScreen());
    console.log('Game state:', this.getCurrentGameState());

    // Also inspect the stateContext
    this.inspectStateContext();

    console.log('=================================');
};

// Method to get current game state directly
Mario.mobileControls.getCurrentGameState = function () {
    if (window.Enjine?.Application?.Instance?.stateContext) {
        const stateContext = window.Enjine.Application.Instance.stateContext;

        // Try multiple ways to get the current state
        if (stateContext.State) {
            return stateContext.State.constructor.name;
        }
        if (stateContext.currentState) {
            return stateContext.currentState.constructor.name;
        }

        // Check if stateContext IS the actual state object
        if (stateContext.constructor && stateContext.constructor.name === 'MapState') {
            return 'MapState';
        } else if (stateContext.constructor && stateContext.constructor.name === 'LevelState') {
            return 'LevelState';
        } else if (stateContext.constructor && stateContext.constructor.name === 'TitleState') {
            return 'TitleState';
        }

        // Check if this is a wrapper object (like your JSON with "State" property)
        if (stateContext.State) {
            const wrappedState = stateContext.State;

            // Check LevelState first (more specific - has XMario/YMario positions)
            if (wrappedState.XMario !== undefined && wrappedState.YMario !== undefined) {
                return 'LevelState';
            }
            // Check MapState (has WorldNumber and map-specific structure)
            else if (wrappedState.WorldNumber !== undefined || wrappedState.MapImage !== undefined || wrappedState.CanEnterLevel !== undefined) {
                return 'MapState';
            }
            // Check constructor as final fallback
            else if (wrappedState.constructor?.name === 'MapState') {
                return 'MapState';
            } else if (wrappedState.constructor?.name === 'LevelState') {
                return 'LevelState';
            } else if (wrappedState.constructor?.name === 'TitleState') {
                return 'TitleState';
            }
        }

        // Final fallback: Check for state-specific properties
        if (stateContext && typeof stateContext === 'object') {
            // Check for MapState first (more specific properties)
            if (stateContext.WorldNumber !== undefined || stateContext.MapImage !== undefined || stateContext.CanEnterLevel !== undefined) {
                return 'MapState';
            }
            // Check for LevelState (has XMario/YMario positions)
            if (stateContext.XMario !== undefined && stateContext.YMario !== undefined) {
                return 'LevelState';
            }
        }
    }
    return 'unknown';
};

// Method to inspect the current stateContext for debugging
Mario.mobileControls.inspectStateContext = function () {
    if (window.Enjine?.Application?.Instance?.stateContext) {
        const stateContext = window.Enjine.Application.Instance.stateContext;
        console.log('=== StateContext Inspection ===');
        console.log('stateContext type:', typeof stateContext);
        console.log('stateContext keys:', Object.keys(stateContext));
        console.log('Has State property:', !!stateContext.State);
        console.log('Has currentState property:', !!stateContext.currentState);
        console.log('stateContext constructor:', stateContext.constructor?.name || 'no constructor');
        if (stateContext.State) {
            console.log('State constructor:', stateContext.State.constructor.name);
        }
        if (stateContext.currentState) {
            console.log('currentState constructor:', stateContext.currentState.constructor.name);
        }
        // Check for MapState indicators
        console.log('Has WorldNumber:', 'WorldNumber' in stateContext);
        console.log('Has Level:', 'Level' in stateContext);
        if (stateContext.Level) {
            console.log('Level type:', typeof stateContext.Level);
            console.log('Level is array:', Array.isArray(stateContext.Level));
        }
        // Check for wrapped state indicators (from your JSON)
        if (stateContext.State) {
            console.log('✅ WRAPPED STATE DETECTED!');
            console.log('Wrapped State constructor:', stateContext.State.constructor?.name || 'no constructor');
            console.log('Wrapped State keys:', Object.keys(stateContext.State));
            if (stateContext.State.Level) {
                console.log('Wrapped Level type:', typeof stateContext.State.Level);
                console.log('Wrapped Level is array:', Array.isArray(stateContext.State.Level));
            }
            console.log('Has WorldNumber:', 'WorldNumber' in stateContext.State);
            console.log('Has XMario:', 'XMario' in stateContext.State);
            console.log('Has YMario:', 'YMario' in stateContext.State);
        }
        console.log('============================');
        return stateContext;
    } else {
        console.log('❌ No stateContext available');
        console.log('Available Application properties:', window.Enjine?.Application?.Instance ? Object.keys(window.Enjine.Application.Instance) : 'No Application.Instance');
        return null;
    }
};

// Force refresh mobile controls (useful for testing)
Mario.mobileControls.refresh = function () {
    console.log('🔄 Forcing mobile controls refresh...');
    this.checkAndUpdateScreen();
    return 'Refreshed! Current screen: ' + this.currentScreen + ', Game state: ' + this.getCurrentGameState();
};

// Initialize when DOM is ready
console.log('🎮 MobileControls: Setting up initialization on DOM ready...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 MobileControls: DOM ready, initializing...');
    try {
        Mario.mobileControls.initialize();

        // Listen for engine state change events instead of polling
        document.addEventListener('stateChanged', () => {
            if (Mario.mobileControls && Mario.mobileControls.isEnabled) {
                console.log('MobileControls: Received stateChanged event');
                Mario.mobileControls.forceScreenUpdate();
            }
        });

        console.log('🎮 MobileControls: Dynamic update loop started');
    } catch (error) {
        console.error('🎮 MobileControls: Initialization failed:', error);
    }
});