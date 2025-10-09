/**
 * PlaySuper Integration for Mario HTML5
 * Provides coin rewards after each level completion
 * Mobile-optimized store experience
 */

Mario.PlaySuperIntegration = function () {
    this.apiKey = null;
    this.coinId = null;
    this.playerUUID = null;
    this.playerToken = null;
    this.storeIframe = null;
    this.isInitialized = false;
    this.rewardsPerLevel = 10;
    this.apiUrl = null;
    this.storeUrl = null;
    this.isMobile = this.detectMobile();

    // Timer-based coin distribution (every 10 seconds)
    this.pendingCoins = 0;
    this.levelStartTime = null;
    this.coinDistributionTimer = null;
    this.distributionInterval = 10000; // 10 seconds in milliseconds
};

Mario.PlaySuperIntegration.prototype.detectMobile = function () {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768;
};

Mario.PlaySuperIntegration.prototype.init = function () {
    console.log('Initializing PlaySuper integration...');

    // Get configuration from the dynamic config system
    if (!Mario.playSuperConfig) {
        console.error('PlaySuper configuration not found. Please include playSuperConfig.js');
        return;
    }

    const config = Mario.playSuperConfig.getConfig();
    if (!config) {
        console.warn('PlaySuper configuration not valid. User may have skipped integration setup.');
        return;
    }

    // Set up configuration from user input
    this.apiKey = config.apiKey;
    this.coinId = config.coinId;
    this.apiUrl = config.baseUrl;
    this.storeUrl = config.storeUrl; // Use the dedicated store URL from config
    this.rewardsPerLevel = 10; // Default rewards per level

    // Generate or get player UUID
    this.playerUUID = this.getPlayerUUID();

    console.log('Environment:', Mario.playSuperConfig.getEnvironment().current);
    console.log('Device type:', this.isMobile ? 'Mobile' : 'Desktop');
    console.log('API Key present:', this.apiKey ? 'YES (hidden)' : 'NO');
    console.log('API URL:', this.apiUrl);
    console.log('Store URL:', this.storeUrl);

    // Initialize keyboard listener for treasure chest testing
    this.initKeyboardListeners();

    // Set up PlaySuper APIs following official documentation
    this.createPlayer()
        .then((createResult) => {
            return this.authenticatePlayer().then((authResult) => ({
                createResult,
                authResult
            }));
        })
        .then(({ createResult, authResult }) => {
            this.isInitialized = true;
            console.log('PlaySuper integration initialized successfully!');
            console.log('Player UUID:', this.playerUUID);
            console.log('Coins per level:', this.rewardsPerLevel);
            console.log('🎮 Press "T" key to show treasure chest with real rewards!');

            // Award welcome coins for new users
            if (createResult && createResult.isNewUser) {
                this.awardWelcomeCoins();
            }
        })
        .catch(error => {
            console.error('Failed to initialize PlaySuper:', error);
        });
};

Mario.PlaySuperIntegration.prototype.getPlayerUUID = function () {
    let uuid = localStorage.getItem('playsuper_player_uuid');
    let isNewUser = false;

    if (!uuid) {
        uuid = 'mario_player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('playsuper_player_uuid', uuid);
        isNewUser = true;

        // Mark as new user for welcome coin distribution
        localStorage.setItem('playsuper_new_user', 'true');
        console.log('🎉 New user detected! Will award welcome coins after registration.');
    }

    return uuid;
};

Mario.PlaySuperIntegration.prototype.createPlayer = function () {
    console.log('Creating player with UUID:', this.playerUUID);
    const isNewUser = localStorage.getItem('playsuper_new_user') === 'true';

    return fetch(this.apiUrl + '/player/create-with-uuid', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': 'application/json',
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid: this.playerUUID })
    })
        .then(response => {
            console.log('Create player response status:', response.status);

            if (!response.ok && response.status !== 409) {
                throw new Error(`Failed to create player: ${response.status} ${response.statusText}`);
            }

            if (response.status === 409) {
                console.log('Player already exists, continuing...');
                // Clear new user flag since player already exists
                localStorage.removeItem('playsuper_new_user');
                return { message: 'Player already exists', isNewUser: false };
            }

            // Player was successfully created (status 200/201)
            console.log('✅ New player created successfully!');
            return response.json().catch(() => ({
                message: 'Player created',
                isNewUser: isNewUser
            }));
        })
        .catch(error => {
            console.log('Player creation issue (might already exist):', error.message);
            // Clear new user flag on error
            localStorage.removeItem('playsuper_new_user');
            return { message: 'Continuing to authentication', isNewUser: false };
        });
};

Mario.PlaySuperIntegration.prototype.authenticatePlayer = function () {
    console.log('Authenticating player via federated login...');

    return fetch(this.apiUrl + '/player/login/federatedByStudio', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': '*/*',
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid: this.playerUUID })
    })
        .then(response => {
            console.log('Authenticate player response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to authenticate player: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Authentication response:', data);

            // Store the access token (the API returns it as 'access_token')
            this.playerToken = data.access_token;

            if (!this.playerToken) {
                throw new Error('No access token received from authentication');
            }

            console.log('Player authenticated successfully!');
            console.log('Access token received and stored:', this.playerToken ? 'YES' : 'NO');
        })
        .catch(error => {
            console.error('Authentication failed:', error);
            throw error;
        });
};

Mario.PlaySuperIntegration.prototype.awardWelcomeCoins = function () {
    const welcomeAmount = 10; // Award 10 welcome coins for new users

    console.log('🎉 Awarding welcome coins to new player!');

    // Small delay to ensure authentication is complete
    setTimeout(() => {
        this.distributeCoins(welcomeAmount)
            .then(() => {
                console.log(`✅ Successfully awarded ${welcomeAmount} welcome coins!`);
                this.showWelcomeNotification(welcomeAmount);

                // Clear the new user flag after successful welcome coin distribution
                localStorage.removeItem('playsuper_new_user');
            })
            .catch((error) => {
                console.error('❌ Failed to award welcome coins:', error);
                // Keep the new user flag for potential retry
            });
    }, 1000);
};

Mario.PlaySuperIntegration.prototype.showWelcomeNotification = function (amount) {
    // Play coin sound effect
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup");
    }

    // Create a Mario-themed welcome notification
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="text-align: center;">
            <div class="mario-coin-container">
                <div class="mario-coin mario-coin-1"></div>
                <div class="mario-coin mario-coin-2"></div>
                <div class="mario-coin mario-coin-3"></div>
            </div>
            <div class="mario-welcome-text">WELCOME TO MARIO!</div>
            <div class="mario-coin-text">+${amount} COINS!</div>
            <div class="mario-subtitle">START YOUR ADVENTURE!</div>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #0066CC 0%, #0088FF 50%, #0066CC 100%);
        border: 4px solid #FFFFFF;
        border-radius: 8px;
        padding: 25px 35px;
        font-family: monospace;
        font-weight: bold;
        z-index: 20000;
        box-shadow: 0 8px 25px rgba(0,0,0,0.6), inset 0 2px 0 #00AAFF, 0 0 0 2px #000000;
        animation: marioWelcomeBounce 0.8s ease-out;
        max-width: 400px;
        text-align: center;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    `;

    // Add comprehensive Mario-style CSS if not already added
    if (!document.getElementById('mario-notification-style')) {
        const style = document.createElement('style');
        style.id = 'mario-notification-style';
        style.textContent = `
            @keyframes marioWelcomeBounce {
                0% { 
                    opacity: 0; 
                    transform: translate(-50%, -50%) scale(0.5) rotate(-10deg); 
                }
                30% { 
                    transform: translate(-50%, -50%) scale(1.1) rotate(5deg); 
                }
                60% { 
                    transform: translate(-50%, -50%) scale(0.95) rotate(-2deg); 
                }
                100% { 
                    opacity: 1; 
                    transform: translate(-50%, -50%) scale(1) rotate(0deg); 
                }
            }
            
            @keyframes coinSpin {
                0% { transform: scaleX(1); }
                25% { transform: scaleX(0.8); }
                50% { transform: scaleX(0.6); }
                75% { transform: scaleX(0.8); }
                100% { transform: scaleX(1); }
            }
            
            @keyframes coinFloat {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
            }
            
            .mario-coin-container {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-bottom: 15px;
                height: 24px;
                align-items: center;
            }
            
            .mario-coin {
                width: 16px;
                height: 16px;
                background: linear-gradient(45deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
                border: 2px solid #FF8C00;
                border-radius: 50%;
                position: relative;
                animation: coinSpin 1s infinite, coinFloat 2s ease-in-out infinite;
            }
            
            .mario-coin::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                bottom: 2px;
                background: radial-gradient(circle at 30% 30%, #FFFF99, #FFD700);
                border-radius: 50%;
            }
            
            .mario-coin::after {
                content: '';
                position: absolute;
                top: 4px;
                left: 6px;
                width: 4px;
                height: 8px;
                background: linear-gradient(to bottom, #FFA500, #FF8C00);
                border-radius: 2px;
            }
            
            .mario-coin-2 {
                animation-delay: 0.3s, 0.6s;
            }
            
            .mario-coin-3 {
                animation-delay: 0.6s, 1.2s;
            }
            
            .mario-welcome-text {
                font-size: 14px;
                color: #FFFFFF;
                text-shadow: 2px 2px 0 #000000;
                margin-bottom: 8px;
                letter-spacing: 1px;
            }
            
            .mario-coin-text {
                font-size: 16px;
                color: #FFD700;
                text-shadow: 2px 2px 0 #000000, 0 0 10px #FFD700;
                margin-bottom: 8px;
                font-weight: bold;
                animation: glow 1.5s ease-in-out infinite alternate;
            }
            
            .mario-subtitle {
                font-size: 10px;
                color: #CCCCCC;
                text-shadow: 1px 1px 0 #000000;
                letter-spacing: 0.5px;
            }
            
            @keyframes glow {
                from { text-shadow: 2px 2px 0 #000000, 0 0 10px #FFD700; }
                to { text-shadow: 2px 2px 0 #000000, 0 0 20px #FFD700, 0 0 30px #FFD700; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 5 seconds with Mario-style fade
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'fadeOut 0.8s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 800);
        }
    }, 5000);
};

Mario.PlaySuperIntegration.prototype.distributeCoins = function (amount) {
    if (!this.isInitialized) {
        console.warn('PlaySuper not initialized yet');
        return Promise.resolve();
    }

    console.log('Distributing', amount, 'coins to player...');

    return fetch(`${this.apiUrl}/coins/${this.coinId}/distribute`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': '*/*',
            'x-game-uuid': this.playerUUID,
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: amount })
    })
        .then(response => {
            console.log('Coin distribution response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to distribute coins: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Successfully distributed', amount, 'PlaySuper coins!');
            this.showRewardNotification(amount);
            return data;
        })
        .catch(error => {
            console.error('Failed to distribute coins:', error);
            this.showErrorNotification('Failed to award coins. Please try again.');
            throw error;
        });
};

Mario.PlaySuperIntegration.prototype.showRewardNotification = function (amount) {
    // Play coin sound effect
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }

    const notification = document.createElement('div');
    notification.innerHTML = `
        <div class="mario-reward-content">
            <div class="mario-reward-coin"></div>
            <span class="mario-reward-text">+${amount}</span>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: ${this.isMobile ? '20px' : '30px'};
        right: ${this.isMobile ? '15px' : '25px'};
        background: linear-gradient(135deg, #0066CC 0%, #0088FF 50%, #0066CC 100%);
        color: #FFFFFF;
        padding: ${this.isMobile ? '12px 18px' : '16px 22px'};
        border-radius: 8px;
        font-family: monospace;
        font-weight: bold;
        font-size: ${this.isMobile ? '14px' : '16px'};
        box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4), inset 0 2px 0 #00AAFF, 0 0 0 2px #000000;
        z-index: 10000;
        transform: translateX(350px);
        transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 2px solid #FFFFFF;
        max-width: ${this.isMobile ? '280px' : '320px'};
        text-shadow: 1px 1px 0 #000000;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    `;

    // Add Mario-style reward CSS if not already added
    if (!document.getElementById('mario-reward-style')) {
        const style = document.createElement('style');
        style.id = 'mario-reward-style';
        style.textContent = `
            .mario-reward-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .mario-reward-coin {
                width: 20px;
                height: 20px;
                background: linear-gradient(45deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
                border: 2px solid #FF8C00;
                border-radius: 50%;
                position: relative;
                animation: rewardCoinSpin 0.8s ease-out, rewardCoinBounce 0.6s ease-out;
                flex-shrink: 0;
            }
            
            .mario-reward-coin::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                right: 2px;
                bottom: 2px;
                background: radial-gradient(circle at 35% 35%, #FFFF99, #FFD700);
                border-radius: 50%;
            }
            
            .mario-reward-coin::after {
                content: '';
                position: absolute;
                top: 5px;
                left: 7px;
                width: 6px;
                height: 10px;
                background: linear-gradient(to bottom, #FFA500, #FF8C00);
                border-radius: 3px;
            }
            
            .mario-reward-text {
                color: #FFD700;
                text-shadow: 2px 2px 0 #000000, 0 0 8px #FFD700;
                font-weight: bold;
                animation: rewardTextGlow 0.8s ease-out;
            }
            
            @keyframes rewardCoinSpin {
                0% { transform: scaleX(1) rotate(0deg); }
                25% { transform: scaleX(0.7) rotate(90deg); }
                50% { transform: scaleX(0.4) rotate(180deg); }
                75% { transform: scaleX(0.7) rotate(270deg); }
                100% { transform: scaleX(1) rotate(360deg); }
            }
            
            @keyframes rewardCoinBounce {
                0%, 100% { transform: translateY(0px); }
                30% { transform: translateY(-5px); }
                60% { transform: translateY(-2px); }
            }
            
            @keyframes rewardTextGlow {
                0% { 
                    transform: scale(0.8);
                    text-shadow: 2px 2px 0 #000000;
                }
                50% { 
                    transform: scale(1.1);
                    text-shadow: 2px 2px 0 #000000, 0 0 15px #FFD700;
                }
                100% { 
                    transform: scale(1);
                    text-shadow: 2px 2px 0 #000000, 0 0 8px #FFD700;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Slide in animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Slide out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(350px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 600);
    }, 3500);
};

Mario.PlaySuperIntegration.prototype.showErrorNotification = function (message) {
    // Play error sound effect (using bump sound as error indicator)
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("bump");
    }

    const notification = document.createElement('div');
    notification.innerHTML = `
        <div class="mario-error-content">
            <div class="mario-error-icon">!</div>
            <span class="mario-error-text">${message}</span>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: ${this.isMobile ? '20px' : '30px'};
        right: ${this.isMobile ? '15px' : '25px'};
        background: linear-gradient(135deg, #CC0000 0%, #FF3333 50%, #CC0000 100%);
        color: #FFFFFF;
        padding: ${this.isMobile ? '12px 18px' : '16px 22px'};
        border-radius: 8px;
        font-family: monospace;
        font-weight: bold;
        font-size: ${this.isMobile ? '12px' : '14px'};
        box-shadow: 0 6px 20px rgba(204, 0, 0, 0.4), inset 0 2px 0 #FF6666, 0 0 0 2px #000000;
        z-index: 10000;
        transform: translateX(350px);
        transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 2px solid #FFFFFF;
        max-width: ${this.isMobile ? '280px' : '320px'};
        text-shadow: 1px 1px 0 #000000;
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
    `;

    // Add Mario-style error CSS if not already added
    if (!document.getElementById('mario-error-style')) {
        const style = document.createElement('style');
        style.id = 'mario-error-style';
        style.textContent = `
            .mario-error-content {
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 10px;
            }
            
            .mario-error-icon {
                width: 20px;
                height: 20px;
                background: linear-gradient(45deg, #FFFF00 0%, #FFD700 50%, #FFFF00 100%);
                border: 2px solid #FFA500;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: bold;
                color: #CC0000;
                text-shadow: 1px 1px 0 rgba(0,0,0,0.3);
                animation: errorIconShake 0.6s ease-out;
                flex-shrink: 0;
            }
            
            .mario-error-text {
                color: #FFFFFF;
                text-shadow: 1px 1px 0 #000000;
                font-weight: bold;
                line-height: 1.2;
            }
            
            @keyframes errorIconShake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-3px) rotate(-5deg); }
                75% { transform: translateX(3px) rotate(5deg); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Slide in animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Slide out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(350px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 600);
    }, 4500);
};

Mario.PlaySuperIntegration.prototype.openStore = function () {
    if (!this.isInitialized) {
        console.warn('PlaySuper not initialized yet');
        return;
    }

    if (!this.playerToken) {
        console.error('Player token not available. Cannot open store.');
        return;
    }

    console.log('Opening PlaySuper store...');

    // Create mobile-optimized store container
    let storeContainer = document.getElementById('playsuper-store-container');
    if (!storeContainer) {
        storeContainer = document.createElement('div');
        storeContainer.id = 'playsuper-store-container';
        storeContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            box-sizing: border-box;
        `;
        document.body.appendChild(storeContainer);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X Close Store';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        z-index: 20001;
        font-family: 'Courier New', monospace;
        font-weight: bold;
    `;
    closeButton.onclick = () => this.closeStore();

    // Create mobile-restricted iframe (375px x 667px - iPhone dimensions)
    this.storeIframe = document.createElement('iframe');
    this.storeIframe.style.cssText = `
        width: 375px;
        height: 667px;
        max-width: 100vw;
        max-height: 100vh;
        border: none;
        border-radius: 10px;
        background: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Add API key as URL parameter and force mobile view
    const storeUrl = new URL(this.storeUrl);
    storeUrl.searchParams.set('apiKey', this.apiKey);
    storeUrl.searchParams.set('view', 'mobile');
    storeUrl.searchParams.set('embedded', 'true');

    this.storeIframe.src = storeUrl.toString();

    // Configure iframe security settings
    this.storeIframe.setAttribute('sandbox',
        'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation'
    );
    this.storeIframe.setAttribute('allow', 'cross-origin-isolated');

    // Send auth token immediately when iframe loads
    this.storeIframe.onload = () => {
        console.log('Store iframe loaded, sending auth token immediately...');
        // Small delay to ensure iframe is ready
        setTimeout(() => {
            this.sendAuthToken();
        }, 500);
    };

    storeContainer.innerHTML = '';
    storeContainer.appendChild(closeButton);
    storeContainer.appendChild(this.storeIframe);
    storeContainer.style.display = 'flex';

    console.log('Mobile store iframe created (375x667px) and configured');
};

Mario.PlaySuperIntegration.prototype.sendAuthToken = function () {
    if (!this.storeIframe) {
        console.error('Cannot send auth token: iframe not available');
        return;
    }

    if (!this.playerToken) {
        console.error('Cannot send auth token: player token not available');
        console.error('Current token value:', this.playerToken);
        return;
    }

    console.log('Sending auth token directly to store...');
    console.log('Token being sent:', this.playerToken.substring(0, 20) + '...');

    // Create auth message following exact documentation format
    const authMessage = {
        type: 'SET_AUTH_TOKEN',
        value: this.playerToken  // Send token without Bearer prefix as per documentation
    };

    try {
        // Send message to iframe immediately
        this.storeIframe.contentWindow.postMessage(authMessage, '*');
        console.log('Auth token sent to store successfully (direct method)');
    } catch (error) {
        console.error('Error sending auth token:', error);
        // Retry after a short delay
        setTimeout(() => {
            try {
                this.storeIframe.contentWindow.postMessage(authMessage, '*');
                console.log('Auth token sent to store successfully (retry)');
            } catch (retryError) {
                console.error('Failed to send auth token on retry:', retryError);
            }
        }, 1000);
    }
};

Mario.PlaySuperIntegration.prototype.openStoreToMyRewards = function () {
    if (!this.isInitialized) {
        console.warn('PlaySuper not initialized yet');
        return;
    }

    if (!this.playerToken) {
        console.error('Player token not available. Cannot open store.');
        return;
    }

    console.log('Opening PlaySuper store to My Rewards page...');

    // Create mobile-optimized store container
    let storeContainer = document.getElementById('playsuper-store-container');
    if (!storeContainer) {
        storeContainer = document.createElement('div');
        storeContainer.id = 'playsuper-store-container';
        storeContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0;
            box-sizing: border-box;
        `;
        document.body.appendChild(storeContainer);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'X Close Store';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        z-index: 20001;
        font-family: 'Courier New', monospace;
        font-weight: bold;
    `;
    closeButton.onclick = () => this.closeStore();

    // Create mobile-restricted iframe (375px x 667px - iPhone dimensions)
    this.storeIframe = document.createElement('iframe');
    this.storeIframe.style.cssText = `
        width: 375px;
        height: 667px;
        max-width: 100vw;
        max-height: 100vh;
        border: none;
        border-radius: 10px;
        background: white;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Add API key as URL parameter and navigate to my-rewards page
    const storeUrl = new URL(this.storeUrl);
    storeUrl.pathname = '/rewards/my-rewards'; // Navigate directly to my-rewards page
    storeUrl.searchParams.set('apiKey', this.apiKey);
    storeUrl.searchParams.set('view', 'mobile');
    storeUrl.searchParams.set('embedded', 'true');

    this.storeIframe.src = storeUrl.toString();

    // Configure iframe security settings
    this.storeIframe.setAttribute('sandbox',
        'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation'
    );
    this.storeIframe.setAttribute('allow', 'cross-origin-isolated');

    // Send auth token immediately when iframe loads
    this.storeIframe.onload = () => {
        console.log('My Rewards store iframe loaded, sending auth token immediately...');
        // Small delay to ensure iframe is ready
        setTimeout(() => {
            this.sendAuthToken();
        }, 500);
    };

    storeContainer.innerHTML = '';
    storeContainer.appendChild(closeButton);
    storeContainer.appendChild(this.storeIframe);
    storeContainer.style.display = 'flex';

    console.log('My Rewards store iframe created and configured');
};

Mario.PlaySuperIntegration.prototype.closeStore = function () {
    const storeContainer = document.getElementById('playsuper-store-container');
    if (storeContainer) {
        storeContainer.style.display = 'none';
    }

    console.log('Store closed');
};

// Timer-based coin distribution methods
Mario.PlaySuperIntegration.prototype.onLevelStart = function () {
    this.pendingCoins = 0;
    this.levelStartTime = Date.now();
    console.log('Level started - resetting coin counter and starting 10-second timer');

    // Clear any existing timer
    this.stopCoinDistributionTimer();

    // Start the 10-second distribution timer
    this.startCoinDistributionTimer();
};

Mario.PlaySuperIntegration.prototype.startCoinDistributionTimer = function () {
    if (!this.isInitialized) {
        return;
    }

    console.log('Starting coin distribution timer (every 10 seconds)');

    this.coinDistributionTimer = setInterval(() => {
        if (this.pendingCoins > 0) {
            console.log(`⏰ 10 seconds elapsed! Distributing ${this.pendingCoins} pending coins...`);

            const coinsToDistribute = this.pendingCoins;
            this.pendingCoins = 0; // Reset counter before API call

            this.distributeCoins(coinsToDistribute)
                .then(() => {
                    console.log(`✅ Successfully distributed ${coinsToDistribute} coins via timer`);
                })
                .catch((error) => {
                    console.warn(`❌ Failed to distribute coins via timer, adding back to pending`);
                    this.pendingCoins += coinsToDistribute; // Add back on failure
                });
        } else {
            console.log('⏰ 10 seconds elapsed, but no coins to distribute');
        }
    }, this.distributionInterval);
};

Mario.PlaySuperIntegration.prototype.stopCoinDistributionTimer = function () {
    if (this.coinDistributionTimer) {
        clearInterval(this.coinDistributionTimer);
        this.coinDistributionTimer = null;
        console.log('Coin distribution timer stopped');
    }
};

Mario.PlaySuperIntegration.prototype.onCoinCollected = function (amount = 1) {
    if (!this.isInitialized) {
        return;
    }

    this.pendingCoins += amount;
    console.log(`Coin collected! Pending coins: ${this.pendingCoins}`);

    // Optional: Show visual feedback without API call
    this.showCoinCollectedFeedback(amount);
};

Mario.PlaySuperIntegration.prototype.showCoinCollectedFeedback = function (amount) {
    // Create a small visual indicator for collected coins
    const feedback = document.createElement('div');
    feedback.textContent = `+${amount} 🪙`;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 215, 0, 0.9);
        color: #000;
        padding: 5px 10px;
        border-radius: 20px;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        z-index: 10000;
        animation: fadeInOut 2s ease-in-out;
        pointer-events: none;
    `;

    // Add CSS animation if not already added
    if (!document.getElementById('coin-feedback-style')) {
        const style = document.createElement('style');
        style.id = 'coin-feedback-style';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(10px); }
                20% { opacity: 1; transform: translateY(0px); }
                80% { opacity: 1; transform: translateY(0px); }
                100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(feedback);

    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 2000);
};

// ============= KEYBOARD TESTING =============

Mario.PlaySuperIntegration.prototype.initKeyboardListeners = function () {
    console.log('🎮 Initializing keyboard listeners...');

    // Track key states to prevent spam
    this.tKeyPressed = false;

    // Add keyboard event listeners for treasure chest testing
    const self = this;
    document.addEventListener('keydown', function (event) {
        console.log('🔧 Key pressed:', event.keyCode, 'Key:', event.key);

        // T key (84) for treasure chest with real API calls
        if (event.keyCode === 84 && !self.tKeyPressed) { // T key
            self.tKeyPressed = true;
            console.log('🎮 T key pressed - showing treasure chest with real API calls!');
            self.showTreasureChest(); // Call the real treasure chest function
        }
    });

    document.addEventListener('keyup', function (event) {
        if (event.keyCode === 84) { // T key
            self.tKeyPressed = false;
        }
    });

    console.log('✅ Keyboard listeners initialized successfully!');
};

Mario.PlaySuperIntegration.prototype.onLevelComplete = function () {
    const levelDuration = this.levelStartTime ? (Date.now() - this.levelStartTime) / 1000 : 0;

    console.log(`🏁 Level completed in ${levelDuration.toFixed(1)}s!`);

    // Stop the timer
    this.stopCoinDistributionTimer();

    // Calculate total coins: any remaining pending coins + level completion bonus
    const remainingCoins = this.pendingCoins;
    const totalCoins = remainingCoins + this.rewardsPerLevel;

    console.log(`Remaining coins from current timer cycle: ${remainingCoins}`);
    console.log(`Level completion bonus: ${this.rewardsPerLevel}`);
    console.log(`Total PlaySuper coins to award: ${totalCoins}`);

    // Award final coins (remaining + bonus)
    if (totalCoins > 0) {
        this.distributeCoins(totalCoins)
            .then(() => {
                console.log('✅ Final level rewards distributed successfully');
                // Reset everything after successful distribution
                this.pendingCoins = 0;
                this.levelStartTime = null;

                // Show treasure chest after coin distribution
                setTimeout(() => {
                    this.showTreasureChest();
                }, 1000);
            })
            .catch(() => {
                console.warn('❌ Failed to distribute final level rewards');
                // Keep the coins for potential retry
            });
    } else {
        // Even if no coins to distribute, show treasure chest
        setTimeout(() => {
            this.showTreasureChest();
        }, 500);
    }
};

Mario.PlaySuperIntegration.prototype.onLevelExit = function () {
    console.log('🚪 Level exited - stopping coin distribution timer');

    // Stop the timer when leaving level (death, exit, etc.)
    this.stopCoinDistributionTimer();

    // Optionally distribute any pending coins before exit
    if (this.pendingCoins > 0) {
        console.log(`Distributing ${this.pendingCoins} pending coins before level exit`);
        const coinsToDistribute = this.pendingCoins;
        this.pendingCoins = 0;

        this.distributeCoins(coinsToDistribute)
            .catch(() => {
                this.pendingCoins += coinsToDistribute; // Add back on failure
            });
    }
};

// ============= TREASURE CHEST FEATURE =============

Mario.PlaySuperIntegration.prototype.showTreasureChest = function () {
    console.log('🎮 showTreasureChest called!');

    if (!this.isInitialized) {
        console.warn('PlaySuper not initialized - skipping treasure chest');
        return;
    }

    console.log('✅ PlaySuper is initialized, fetching rewards...');

    // Play special chest sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup");
    }

    // Fetch available rewards
    this.fetchAvailableRewards()
        .then(rewards => {
            console.log('📦 Rewards fetched successfully:', rewards.length, 'rewards');
            if (rewards && rewards.length > 0) {
                console.log('🎁 Displaying treasure chest UI...');
                this.displayTreasureChestUI(rewards);
            } else {
                console.log('❌ No rewards available for treasure chest');
                // Show a message to the user
                alert('No rewards available at the moment. Please try again later!');
            }
        })
        .catch(error => {
            console.error('❌ Failed to fetch rewards for treasure chest:', error);
            // Show error to user
            alert('Failed to load rewards. Please check your internet connection and try again!');
        });
};

Mario.PlaySuperIntegration.prototype.fetchAvailableRewards = function () {
    const config = Mario.playSuperConfig.getConfig();
    if (!config) {
        return Promise.reject('PlaySuper configuration not available');
    }

    const url = new URL(`${config.baseUrl}/rewards`);
    url.searchParams.append('coinId', config.coinId);
    url.searchParams.append('limit', '10'); // Get up to 10 rewards

    return fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': 'application/json',
            'x-game-uuid': this.playerUUID,
            'x-api-key': config.apiKey,
            'x-language': 'en'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch rewards: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            console.log('📥 Raw API response:', responseData);

            // Handle the API response structure: {data: {data: [...], meta: {...}}}
            if (responseData && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
                console.log('✅ Found rewards in responseData.data.data:', responseData.data.data.length);
                return responseData.data.data; // Return the rewards array from data.data property
            } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                console.log('✅ Found rewards in responseData.data:', responseData.data.length);
                return responseData.data; // Fallback for responseData.data
            } else if (Array.isArray(responseData)) {
                console.log('✅ Response is already an array:', responseData.length);
                return responseData; // Fallback if data is already an array
            } else {
                console.warn('❌ Unexpected rewards data structure:', responseData);
                return [];
            }
        });
};

Mario.PlaySuperIntegration.prototype.displayTreasureChestUI = function (rewards) {
    console.log('[TreasureChest] Creating UI with', rewards.length, 'rewards');

    // Remove any existing treasure chest
    const existingOverlay = document.getElementById('mario-treasure-chest-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create simple, guaranteed-visible overlay
    const overlay = document.createElement('div');
    overlay.id = 'mario-treasure-chest-overlay';
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 100, 0.8) !important;
        z-index: 999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    `;

    // Create simple container that WILL be visible
    const container = document.createElement('div');
    container.style.cssText = `
        background: #8B4513 !important;
        border: 8px solid #FFD700 !important;
        border-radius: 15px !important;
        padding: 30px !important;
        width: 500px !important;
        max-width: 90vw !important;
        text-align: center !important;
        font-family: monospace !important;
        color: white !important;
        font-size: 16px !important;
        font-weight: bold !important;
    `;

    // Simple, guaranteed content
    container.innerHTML = `
        <h1 style="color: #FFD700; margin-bottom: 20px; font-size: 24px;">
            🏰 MARIO TREASURE CHEST 🏰
        </h1>
        <p style="margin-bottom: 20px;">Choose your mystery reward!</p>
        <div id="treasure-mystery-boxes" style="display: flex; justify-content: center; gap: 20px; margin: 30px 0;">
            <!-- Mystery boxes will be added here -->
        </div>
        <button id="treasure-skip-btn" class="mario-treasure-button mario-treasure-skip-btn">
            🚪 SKIP TREASURE
        </button>
    `;

    // Append container to overlay
    overlay.appendChild(container);

    // Add Mario treasure button styles
    if (!document.getElementById('mario-treasure-button-style')) {
        const style = document.createElement('style');
        style.id = 'mario-treasure-button-style';
        style.textContent = `
            .mario-treasure-button {
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 14px;
                padding: 12px 20px;
                margin: 8px;
                border: 3px solid;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
                min-width: 160px;
                display: inline-block;
            }
            
            .mario-treasure-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: left 0.5s ease;
            }
            
            .mario-treasure-button:hover::before {
                left: 100%;
            }
            
            .mario-treasure-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            }
            
            .mario-treasure-button:active {
                transform: translateY(0px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
            
            /* Skip Button - Red (Danger) */
            .mario-treasure-skip-btn {
                background: linear-gradient(145deg, #CC0000 0%, #AA0000 50%, #880000 100%);
                border-color: #FFD700;
                color: #FFFFFF;
            }
            
            .mario-treasure-skip-btn:hover {
                background: linear-gradient(145deg, #DD1111 0%, #BB1111 50%, #991111 100%);
                border-color: #FFF700;
                filter: brightness(1.1);
            }
            
            /* Primary Button - Gold (Success) */
            .mario-treasure-primary-btn {
                background: linear-gradient(145deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
                border-color: #8B4513;
                color: #8B4513;
                text-shadow: 1px 1px 0 rgba(255,255,255,0.3);
            }
            
            .mario-treasure-primary-btn:hover {
                background: linear-gradient(145deg, #FFE55C 0%, #FFB347 50%, #FFA500 100%);
                border-color: #654321;
                filter: brightness(1.1);
                box-shadow: 0 6px 15px rgba(255,215,0,0.4);
            }
            
            /* Secondary Button - Blue (Info) */
            .mario-treasure-secondary-btn {
                background: linear-gradient(145deg, #0066CC 0%, #0088FF 50%, #0066CC 100%);
                border-color: #FFFFFF;
                color: #FFFFFF;
            }
            
            .mario-treasure-secondary-btn:hover {
                background: linear-gradient(145deg, #0077DD 0%, #0099FF 50%, #0077DD 100%);
                border-color: #FFD700;
                filter: brightness(1.1);
                box-shadow: 0 6px 15px rgba(0,102,204,0.4);
            }
            
            /* Button animations */
            @keyframes buttonPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            .mario-treasure-button:focus {
                animation: buttonPulse 0.6s ease-in-out;
                outline: none;
            }
            
            /* Pixelated rendering for retro feel */
            .mario-treasure-button {
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            }
            
            /* Responsive design */
            @media (max-width: 600px) {
                .mario-treasure-button {
                    font-size: 12px;
                    padding: 10px 16px;
                    min-width: 140px;
                    margin: 6px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Append to document body with debugging
    document.body.appendChild(overlay); console.log('[TreasureChest] ✅ UI Elements created and added to DOM');
    console.log('[TreasureChest] Overlay element:', overlay);
    console.log('[TreasureChest] Container element:', container);
    console.log('[TreasureChest] Document body children:', document.body.children.length);

    // Generate simple mystery boxes
    this.generateSimpleMysteryBoxes(rewards);

    // Add simple event listeners
    this.setupSimpleTreasureEvents(overlay, rewards);
};

Mario.PlaySuperIntegration.prototype.generateSimpleMysteryBoxes = function (rewards) {
    const container = document.getElementById('treasure-mystery-boxes');
    if (!container) {
        console.error('[TreasureChest] Mystery boxes container not found!');
        return;
    }

    console.log('[TreasureChest] Generating mystery boxes for', rewards.length, 'rewards');

    // Select 3 random rewards (or duplicate if less than 3)
    const selectedRewards = [];
    for (let i = 0; i < 3; i++) {
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        selectedRewards.push(randomReward);
    }

    selectedRewards.forEach((reward, index) => {
        const box = document.createElement('div');
        box.style.cssText = `
            width: 80px;
            height: 80px;
            background: #FF8C00;
            border: 4px solid #8B4513;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            cursor: pointer;
            color: white;
            font-weight: bold;
            transition: transform 0.3s ease;
        `;
        box.textContent = '?';
        box.dataset.rewardIndex = index;
        box.dataset.rewardId = reward.id;

        // Hover effect
        box.addEventListener('mouseenter', () => {
            box.style.transform = 'scale(1.1)';
        });
        box.addEventListener('mouseleave', () => {
            box.style.transform = 'scale(1)';
        });

        // Click handler
        box.addEventListener('click', () => {
            this.openSimpleMysteryBox(box, reward, index);
        });

        container.appendChild(box);
    });

    console.log('[TreasureChest] ✅ Generated', selectedRewards.length, 'mystery boxes');
};

Mario.PlaySuperIntegration.prototype.openSimpleMysteryBox = function (box, reward, index) {
    console.log('[TreasureChest] Opening mystery box:', reward.name);

    // Play coin sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }

    // Disable all boxes
    const allBoxes = document.querySelectorAll('#treasure-mystery-boxes > div');
    allBoxes.forEach(b => {
        b.style.pointerEvents = 'none';
        b.style.opacity = '0.5';
    });

    // Reveal the reward
    box.style.background = '#FFD700';
    box.style.color = '#8B4513';
    box.style.transform = 'scale(1.2)';
    box.style.opacity = '1';

    const rewardName = reward.name || 'Mystery Reward';
    const shortName = rewardName.length > 8 ? rewardName.substring(0, 8) + '...' : rewardName;

    box.innerHTML = `<div style="font-size: 12px; line-height: 1.1; text-align: center;">${shortName}</div>`;

    // Purchase the reward after a delay
    setTimeout(() => {
        this.purchaseSelectedReward(reward);
    }, 1500);

    // Auto-redirect to store after 3 seconds if brand logo exists
    if (reward.metadata?.brandLogoImage) {
        setTimeout(() => {
            console.log('[TreasureChest] Auto-redirecting to My Rewards...');
            this.closeTreasureChest();
            this.openStoreToMyRewards();
        }, 3000);
    }
};

Mario.PlaySuperIntegration.prototype.setupSimpleTreasureEvents = function (overlay, rewards) {
    // Skip button
    const skipBtn = document.getElementById('treasure-skip-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            console.log('[TreasureChest] Skip button clicked');
            this.closeTreasureChest();
        });
    }

    // Close on overlay click (outside container)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            console.log('[TreasureChest] Overlay clicked - closing');
            this.closeTreasureChest();
        }
    });

    Mario.PlaySuperIntegration.prototype.setupTreasureChestEvents = function (overlay, rewards) {
        // Skip button
        const skipBtn = document.getElementById('treasure-skip-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                console.log('[TreasureChest] Skip button clicked');
                this.closeTreasureChest();
            });
        }

        // Close on overlay click (outside container)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                console.log('[TreasureChest] Overlay clicked - closing');
                this.closeTreasureChest();
            }
        });

        console.log('[TreasureChest] ✅ Event listeners set up');
    };
};

Mario.PlaySuperIntegration.prototype.setupTreasureChestEvents = function (overlay, rewards) {
    // Skip button
    const skipBtn = document.getElementById('treasure-skip-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            overlay.remove();
        });
    }

    // Close on overlay click (outside container)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
};



Mario.PlaySuperIntegration.prototype.purchaseSelectedReward = function (reward) {
    const config = Mario.playSuperConfig.getConfig();
    if (!config) {
        this.showTreasureError('Configuration not available');
        return;
    }

    const purchaseData = {
        rewardId: reward.id,
        coinId: config.coinId,
        isPrefillEnabled: true
    };

    fetch(`${config.baseUrl}/rewards/purchase`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': 'application/json',
            'x-game-uuid': this.playerUUID,
            'x-api-key': config.apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Purchase failed: ${response.status}`);
            }
            return response.json();
        })
        .then(purchaseResult => {
            console.log('Treasure reward purchased successfully:', purchaseResult);
            this.showTreasureSuccess(reward, purchaseResult);
        })
        .catch(error => {
            console.error('Failed to purchase treasure reward:', error);
            this.showTreasureError('Failed to claim reward. Please try again.');
        });
};

Mario.PlaySuperIntegration.prototype.showTreasureSuccess = function (reward, purchaseResult) {
    // Play success sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("1up");
    }

    const overlay = document.getElementById('mario-treasure-chest-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(145deg, #00AA00 0%, #00CC00 50%, #00AA00 100%);
            border: 6px solid #FFD700;
            border-radius: 15px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            font-family: monospace;
            font-weight: bold;
            color: #FFFFFF;
            text-shadow: 2px 2px 0 #000000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            animation: treasureSuccessBounce 0.6s ease-out;
        ">
            <div style="font-size: 40px; margin-bottom: 15px;">🎉</div>
            <h2 style="margin: 0 0 15px 0; color: #FFD700; font-size: 18px;">TREASURE CLAIMED!</h2>
            <p style="margin: 10px 0; font-size: 14px;">
                You received: <strong>${reward.name || 'Mystery Reward'}</strong>
            </p>
            ${purchaseResult.couponCode ? `
                <div style="
                    background: rgba(255,255,255,0.2);
                    padding: 10px;
                    border-radius: 8px;
                    margin: 15px 0;
                    font-size: 12px;
                ">
                    Coupon Code: <strong>${purchaseResult.couponCode}</strong>
                </div>
            ` : ''}
            <div style="margin-top: 20px;">
                <button id="treasure-view-rewards-btn" class="mario-treasure-button mario-treasure-primary-btn">
                    🏆 VIEW MY REWARDS
                </button>
                <button id="treasure-continue-btn" class="mario-treasure-button mario-treasure-secondary-btn">
                    🎮 CONTINUE PLAYING
                </button>
            </div>
        </div>
    `;

    // Add success animation style
    if (!document.getElementById('treasure-success-style')) {
        const style = document.createElement('style');
        style.id = 'treasure-success-style';
        style.textContent = `
            @keyframes treasureSuccessBounce {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Add button handlers
    document.getElementById('treasure-view-rewards-btn').addEventListener('click', () => {
        this.closeTreasureChest();
        this.openStoreToMyRewards();
    });

    document.getElementById('treasure-continue-btn').addEventListener('click', () => {
        this.closeTreasureChest();
    });

    // Auto-close after 8 seconds
    setTimeout(() => {
        this.closeTreasureChest();
    }, 8000);
};

Mario.PlaySuperIntegration.prototype.showTreasureError = function (message) {
    // Play error sound
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("bump");
    }

    const overlay = document.getElementById('mario-treasure-chest-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
        <div style="
            background: linear-gradient(145deg, #CC0000 0%, #FF3333 50%, #CC0000 100%);
            border: 6px solid #FFD700;
            border-radius: 15px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            font-family: monospace;
            font-weight: bold;
            color: #FFFFFF;
            text-shadow: 2px 2px 0 #000000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        ">
            <div style="font-size: 40px; margin-bottom: 15px;">❌</div>
            <h2 style="margin: 0 0 15px 0; color: #FFD700; font-size: 18px;">TREASURE ERROR</h2>
            <p style="margin: 10px 0; font-size: 14px;">${message}</p>
            <button id="treasure-retry-btn" class="mario-button" style="margin-top: 20px;">
                Try Again
            </button>
        </div>
    `;

    // Add retry button handler
    document.getElementById('treasure-retry-btn').addEventListener('click', () => {
        this.closeTreasureChest();
        setTimeout(() => {
            this.showTreasureChest();
        }, 500);
    });
};

Mario.PlaySuperIntegration.prototype.setupTreasureChestEvents = function (overlay, rewards) {
    // Skip button
    const skipBtn = document.getElementById('treasure-skip-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            this.closeTreasureChest();
        });
    }

    // Close on escape key
    const handleKeyPress = (event) => {
        if (event.key === 'Escape') {
            this.closeTreasureChest();
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);

    // Auto-close after 30 seconds if no interaction
    setTimeout(() => {
        const currentOverlay = document.getElementById('mario-treasure-chest-overlay');
        if (currentOverlay && currentOverlay === overlay) {
            this.closeTreasureChest();
        }
    }, 30000);
};

Mario.PlaySuperIntegration.prototype.closeTreasureChest = function () {
    const overlay = document.getElementById('mario-treasure-chest-overlay');
    if (overlay) {
        overlay.style.animation = 'treasureOverlayFadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
};

// Create global instance
Mario.playSuperIntegration = new Mario.PlaySuperIntegration();