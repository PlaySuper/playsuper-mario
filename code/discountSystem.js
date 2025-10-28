/**
 * PlaySuper Discount System Integration
 * Provides real discount codes from PlaySuper API when players die
 * Follows the same integration patterns as playSuperIntegration.js
 */

Mario.DiscountSystem = function () {
    this.apiUrl = null;
    this.apiKey = null;
    this.coinId = null;
    this.playerUUID = null;
    this.isInitialized = false;
    this.lastDiscountTime = null;
    this.discountCooldown = 10 * 1000; // 10 seconds cooldown for testing (was 30)
};

Mario.DiscountSystem.prototype.init = function () {
    console.log('🎯 Initializing PlaySuper Discount System...');

    if (!Mario.playSuperConfig) {
        console.error('❌ PlaySuper configuration not found');
        return;
    }

    const config = Mario.playSuperConfig.getConfig();
    if (!config) {
        console.warn('⚠️ PlaySuper configuration not valid - credentials likely not set');
        console.log('   To enable scratch cards, you need to set API credentials');
        return;
    }

    this.apiUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.coinId = config.coinId;
    this.playerUUID = Mario.playSuperIntegration.playerUUID;
    this.isInitialized = true;

    console.log('✅ Discount system initialized successfully!');
    console.log('   - API URL:', this.apiUrl);
    console.log('   - Coin ID:', this.coinId);
    console.log('   - Player UUID:', this.playerUUID ? 'Set' : 'Not set');
};

Mario.DiscountSystem.prototype.canGenerateDiscount = function () {
    const now = Date.now();
    if (!this.lastDiscountTime) return true;

    return (now - this.lastDiscountTime) > this.discountCooldown;
};

Mario.DiscountSystem.prototype.onPlayerDeath = function () {
    // Comprehensive check to prevent showing death cards on level completion
    console.log('=== DISCOUNT SYSTEM: onPlayerDeath CALLED ===');
    console.log('- Mario.MarioCharacter exists:', !!Mario.MarioCharacter);
    console.log('- Mario.MarioCharacter.WinTime:', Mario.MarioCharacter ? Mario.MarioCharacter.WinTime : 'undefined');
    console.log('- Mario.MarioCharacter.DeathTime:', Mario.MarioCharacter ? Mario.MarioCharacter.DeathTime : 'undefined');
    console.log('- Mario.MarioCharacter.DeathDiscountTriggered:', Mario.MarioCharacter ? Mario.MarioCharacter.DeathDiscountTriggered : 'undefined');
    console.log('- Can generate discount:', this.canGenerateDiscount());
    console.log('- Is initialized:', this.isInitialized);
    console.log('- Last discount time:', this.lastDiscountTime);
    console.log('- Time since last discount:', this.lastDiscountTime ? (Date.now() - this.lastDiscountTime) / 1000 + 's' : 'never');

    // Don't show death card if player is winning!
    if (Mario.MarioCharacter && Mario.MarioCharacter.WinTime > 0) {
        console.log('❌ DiscountSystem: Player is winning, skipping death discount');
        return;
    }

    // Check if discount already triggered for this death
    if (Mario.MarioCharacter && Mario.MarioCharacter.DeathDiscountTriggered) {
        console.log('❌ DiscountSystem: Death discount already triggered, skipping');
        return;
    }

    // Extra check - don't show if player hasn't actually died
    if (Mario.MarioCharacter && Mario.MarioCharacter.DeathTime === 0) {
        console.log('❌ DiscountSystem: Player has not actually died (DeathTime=0), skipping');
        return;
    }

    // Check cooldown
    if (!this.canGenerateDiscount()) {
        console.log('❌ DiscountSystem: Still in cooldown period, skipping');
        const timeLeft = Math.ceil((this.discountCooldown - (Date.now() - this.lastDiscountTime)) / 1000);
        console.log('   Cooldown remaining:', timeLeft + 's');
        return;
    }

    console.log('✅ DiscountSystem: All checks passed! Showing Mario-themed scratch card...');

    // Show immediate Mario-themed encouragement with scratch card
    this.showMarioScratchCard()
        .then(reward => {
            if (reward) {
                console.log('✅ Successfully generated reward from scratch card:', reward);
                // Mark as triggered after successful scratch card interaction
                if (Mario.MarioCharacter) {
                    Mario.MarioCharacter.DeathDiscountTriggered = true;
                }
                // Update cooldown timer
                this.lastDiscountTime = Date.now();
            }
        })
        .catch(error => {
            console.log('⚠️ Failed to show scratch card or user skipped:', error);
            // Even if failed/skipped, mark as triggered to prevent multiple attempts
            if (Mario.MarioCharacter) {
                Mario.MarioCharacter.DeathDiscountTriggered = true;
            }
        });
};

Mario.DiscountSystem.prototype.generateDiscountCode = function () {
    if (!this.isInitialized) {
        console.warn('Discount system not initialized');
        return Promise.reject('Not initialized');
    }

    if (!this.canGenerateDiscount()) {
        console.log('Discount cooldown active, skipping discount generation');
        return Promise.reject('Cooldown active');
    }

    console.log('Generating discount code from PlaySuper API...');

    // Fetch actual discount rewards from PlaySuper API
    return this.fetchDiscountRewards()
        .then(rewards => {
            if (rewards && rewards.length > 0) {
                // Filter for discount/coupon type rewards
                const discountRewards = rewards.filter(reward =>
                    reward.type === 'discount' ||
                    reward.type === 'coupon' ||
                    reward.name?.toLowerCase().includes('discount') ||
                    reward.name?.toLowerCase().includes('coupon')
                );

                if (discountRewards.length > 0) {
                    // Select a random discount reward
                    const randomReward = discountRewards[Math.floor(Math.random() * discountRewards.length)];
                    return this.purchaseDiscountReward(randomReward);
                } else {
                    // If no specific discount rewards, create a generic one
                    return this.createGenericDiscount();
                }
            } else {
                throw new Error('No discount rewards available');
            }
        })
        .then(discount => {
            this.lastDiscountTime = Date.now();
            return discount;
        });
};

Mario.DiscountSystem.prototype.fetchDiscountRewards = function () {
    const config = Mario.playSuperConfig.getConfig();
    const url = new URL(`${config.baseUrl}/rewards`);
    url.searchParams.append('coinId', config.coinId);
    url.searchParams.append('limit', '10'); // Get more rewards to filter from

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
            console.log('Discount rewards fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch discount rewards: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Discount rewards API response:', responseData);

            // Handle the API response structure following your existing pattern
            if (responseData && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
                console.log('Found rewards in responseData.data.data:', responseData.data.data.length);
                return responseData.data.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                console.log('Found rewards in responseData.data:', responseData.data.length);
                return responseData.data;
            } else if (Array.isArray(responseData)) {
                console.log('Response is already an array:', responseData.length);
                return responseData;
            } else {
                console.warn('Unexpected rewards data structure:', responseData);
                return [];
            }
        })
        .catch(error => {
            console.error('Failed to fetch discount rewards:', error);
            throw error;
        });
};

Mario.DiscountSystem.prototype.purchaseDiscountReward = function (reward) {
    const config = Mario.playSuperConfig.getConfig();

    console.log('Purchasing discount reward:', reward.name || reward.id);

    const purchaseData = {
        rewardId: reward.id,
        coinId: config.coinId,
        isPrefillEnabled: true
    };

    return fetch(`${config.baseUrl}/rewards/purchase`, {
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
            console.log('Discount reward purchase response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to purchase discount reward: ${response.status}`);
            }
            return response.json();
        })
        .then(purchaseResult => {
            console.log('Discount reward purchased successfully:', purchaseResult);

            // Extract the actual coupon code from the API response
            const couponCode = purchaseResult.couponCode ||
                purchaseResult.code ||
                purchaseResult.data?.couponCode ||
                purchaseResult.data?.code ||
                'MARIO' + Math.random().toString(36).substring(2, 8).toUpperCase();

            // Store the discount in localStorage following your existing pattern
            const userDiscounts = JSON.parse(localStorage.getItem('user_discounts') || '[]');
            const discountData = {
                code: couponCode,
                discount: reward.discountPercentage || reward.discount || 10,
                description: reward.name || reward.description || 'Special Mario Discount',
                timestamp: Date.now(),
                used: false,
                rewardId: reward.id,
                purchaseId: purchaseResult.id || purchaseResult.purchaseId
            };

            userDiscounts.push(discountData);
            localStorage.setItem('user_discounts', JSON.stringify(userDiscounts));

            console.log('Discount stored locally:', discountData);

            return discountData;
        })
        .catch(error => {
            console.error('Failed to purchase discount reward:', error);
            throw error;
        });
};

Mario.DiscountSystem.prototype.createGenericDiscount = function () {
    // Create a generic discount when no specific discount rewards are available
    console.log('Creating generic discount (no specific discount rewards available)');

    const genericDiscounts = [
        { discount: 10, description: '10% off your next purchase' },
        { discount: 15, description: '15% off premium items' },
        { discount: 20, description: '20% off everything' }
    ];

    const selectedDiscount = genericDiscounts[Math.floor(Math.random() * genericDiscounts.length)];
    const couponCode = 'MARIO' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const discountData = {
        code: couponCode,
        discount: selectedDiscount.discount,
        description: selectedDiscount.description,
        timestamp: Date.now(),
        used: false,
        isGeneric: true
    };

    // Store the generic discount
    const userDiscounts = JSON.parse(localStorage.getItem('user_discounts') || '[]');
    userDiscounts.push(discountData);
    localStorage.setItem('user_discounts', JSON.stringify(userDiscounts));

    return Promise.resolve(discountData);
};

Mario.DiscountSystem.prototype.showDiscountModal = function (discount) {
    console.log('Showing discount modal:', discount);

    // Play encouraging sound (using coin sound as positive reinforcement)
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }

    const modal = document.createElement('div');
    modal.className = 'mario-discount-modal';
    modal.innerHTML = `
        <div class="mario-discount-content">
            <div class="mario-discount-header">
                <h2>🍄 Don't worry if you died! 🍄</h2>
                <h3>Here's a special deal for you!</h3>
            </div>
            <div class="mario-discount-code-container">
                <div class="mario-discount-label">Your Discount Code:</div>
                <div class="mario-discount-code">${discount.code}</div>
                <div class="mario-discount-description">${discount.description}</div>
            </div>
            <div class="mario-discount-buttons">
                <button id="mario-view-rewards-btn" class="mario-discount-button mario-discount-primary">
                    🏆 VIEW MY REWARDS
                </button>
                <button id="mario-continue-playing-btn" class="mario-discount-button mario-discount-secondary">
                    🎮 CONTINUE PLAYING
                </button>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 15000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Courier New', monospace;
        animation: discountModalFadeIn 0.5s ease-out;
    `;

    // Add discount modal styles if not already added
    if (!document.getElementById('mario-discount-modal-style')) {
        const style = document.createElement('style');
        style.id = 'mario-discount-modal-style';
        style.textContent = `
            @keyframes discountModalFadeIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .mario-discount-content {
                background: linear-gradient(145deg, #8B4513 0%, #A0522D 50%, #8B4513 100%);
                border: 6px solid #FFD700;
                border-radius: 15px;
                padding: 30px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                color: #FFFFFF;
                text-shadow: 2px 2px 0 #000000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                position: relative;
                overflow: hidden;
            }
            
            .mario-discount-content::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, 
                    transparent 0%, 
                    rgba(255,215,0,0.1) 25%, 
                    transparent 50%, 
                    rgba(255,215,0,0.1) 75%, 
                    transparent 100%);
                animation: discountShimmer 3s ease-in-out infinite;
                pointer-events: none;
            }
            
            @keyframes discountShimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .mario-discount-header h2 {
                color: #FFD700;
                font-size: 18px;
                margin: 0 0 8px 0;
                text-shadow: 3px 3px 0 #000000;
            }
            
            .mario-discount-header h3 {
                color: #FFFFFF;
                font-size: 14px;
                margin: 0 0 20px 0;
                font-weight: normal;
            }
            
            .mario-discount-code-container {
                background: rgba(0,0,0,0.3);
                border: 3px solid #FFD700;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .mario-discount-label {
                color: #CCCCCC;
                font-size: 12px;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .mario-discount-code {
                color: #FFD700;
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
                text-shadow: 3px 3px 0 #000000, 0 0 15px #FFD700;
                letter-spacing: 2px;
                animation: discountCodeGlow 2s ease-in-out infinite alternate;
            }
            
            @keyframes discountCodeGlow {
                from { text-shadow: 3px 3px 0 #000000, 0 0 15px #FFD700; }
                to { text-shadow: 3px 3px 0 #000000, 0 0 25px #FFD700, 0 0 35px #FFD700; }
            }
            
            .mario-discount-description {
                color: #FFFFFF;
                font-size: 12px;
                margin-top: 8px;
                font-style: italic;
            }
            
            .mario-discount-buttons {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 25px;
                flex-wrap: wrap;
            }
            
            .mario-discount-button {
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 12px;
                padding: 12px 20px;
                border: 3px solid;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                text-shadow: 1px 1px 0 rgba(0,0,0,0.5);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                min-width: 140px;
                position: relative;
                overflow: hidden;
            }
            
            .mario-discount-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: left 0.5s ease;
            }
            
            .mario-discount-button:hover::before {
                left: 100%;
            }
            
            .mario-discount-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(0,0,0,0.4);
            }
            
            .mario-discount-primary {
                background: linear-gradient(145deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
                border-color: #8B4513;
                color: #8B4513;
            }
            
            .mario-discount-primary:hover {
                background: linear-gradient(145deg, #FFE55C 0%, #FFB347 50%, #FFA500 100%);
                filter: brightness(1.1);
            }
            
            .mario-discount-secondary {
                background: linear-gradient(145deg, #0066CC 0%, #0088FF 50%, #0066CC 100%);
                border-color: #FFFFFF;
                color: #FFFFFF;
            }
            
            .mario-discount-secondary:hover {
                background: linear-gradient(145deg, #0077DD 0%, #0099FF 50%, #0077DD 100%);
                border-color: #FFD700;
                filter: brightness(1.1);
            }
            
            @media (max-width: 600px) {
                .mario-discount-buttons {
                    flex-direction: column;
                    align-items: center;
                }
                
                .mario-discount-button {
                    width: 100%;
                    max-width: 200px;
                }
                
                .mario-discount-code {
                    font-size: 20px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('mario-view-rewards-btn').addEventListener('click', () => {
        console.log('Opening My Rewards from discount modal');
        this.closeDiscountModal(modal);
        Mario.playSuperIntegration.openStoreToMyRewards();
    });

    document.getElementById('mario-continue-playing-btn').addEventListener('click', () => {
        console.log('Continuing game from discount modal');
        this.closeDiscountModal(modal);
    });

    // Auto-close after 15 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            console.log('Auto-closing discount modal after 15 seconds');
            this.closeDiscountModal(modal);
        }
    }, 15000);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            console.log('Closing discount modal - overlay clicked');
            this.closeDiscountModal(modal);
        }
    });
};

Mario.DiscountSystem.prototype.closeDiscountModal = function (modal) {
    if (modal && modal.parentNode) {
        modal.style.animation = 'discountModalFadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
};

Mario.DiscountSystem.prototype.showGenericEncouragement = function () {
    console.log('Showing generic encouragement message');

    const encouragementMessages = [
        "Don't give up! Every great plumber started somewhere! 🍄",
        "Try again! Princess Peach believes in you! 👑",
        "Keep going! You're getting better with each attempt! ⭐",
        "One more time! Victory is just around the corner! 🏆"
    ];

    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];

    // Simple encouragement notification
    const notification = document.createElement('div');
    notification.textContent = randomMessage;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(145deg, #0066CC 0%, #0088FF 50%, #0066CC 100%);
        color: #FFFFFF;
        padding: 20px 30px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        font-size: 14px;
        text-align: center;
        border: 3px solid #FFFFFF;
        box-shadow: 0 8px 25px rgba(0,0,0,0.6);
        z-index: 15000;
        max-width: 300px;
        text-shadow: 2px 2px 0 #000000;
        animation: encouragementBounce 0.6s ease-out;
    `;

    // Add encouragement animation if not already added
    if (!document.getElementById('encouragement-style')) {
        const style = document.createElement('style');
        style.id = 'encouragement-style';
        style.textContent = `
            @keyframes encouragementBounce {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'encouragementBounce 0.4s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 400);
        }
    }, 4000);
};

Mario.DiscountSystem.prototype.showMarioScratchCard = function () {
    console.log('Showing Mario-themed reward card (no scratching required)...');

    return new Promise((resolve, reject) => {
        // Fetch rewards first to display them directly
        this.fetchScratchCardRewards()
            .then(rewards => {
                if (!rewards || rewards.length === 0) {
                    console.log('No rewards available');
                    reject(new Error('No rewards available'));
                    return;
                }

                const selectedReward = rewards[0];
                console.log('Selected reward to display:', selectedReward);

                // Create Mario-themed reward overlay
                const overlay = document.createElement('div');
                overlay.id = 'mario-reward-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(180deg, #5C94FC 0%, #5C94FC 50%, #00AA00 50%, #00AA00 100%);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Press Start 2P', 'Courier New', monospace;
                    animation: fadeIn 0.5s ease-in;
                `;

                // Create reward card container
                const cardContainer = document.createElement('div');
                cardContainer.style.cssText = `
                    background: #FFD700;
                    border: 8px solid #B8860B;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    color: #8B4513;
                    position: relative;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    animation: bounceIn 0.6s ease-out;
                `;

                cardContainer.innerHTML = `
                    <div style="font-size: 14px; margin-bottom: 20px; color: #DC143C; font-weight: bold;">
                        🎉 REWARD UNLOCKED! 🎉
                    </div>
                    <div style="font-size: 40px; margin-bottom: 15px;">MARIO</div>
                    <div style="font-size: 12px; margin-bottom: 20px; line-height: 1.4;">
                        <div style="color: #228B22; margin-bottom: 10px;">Don't worry if you died!</div>
                        <div style="color: #8B4513;">Here's your reward!</div>
                    </div>
                    
                    <div id="reward-display" style="
                        background: #FFFFFF;
                        border: 4px solid #4169E1;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 20px 0;
                        position: relative;
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        <div id="brand-logo" style="margin-bottom: 15px;"></div>
                        <div id="offer-name" style="font-size: 14px; color: #DC143C; margin-bottom: 10px; font-weight: bold;">
                            ${selectedReward.name || 'Mystery Reward'}
                        </div>
                        <div id="offer-description" style="font-size: 10px; color: #8B4513; line-height: 1.3;">
                            ${selectedReward.description || 'Special reward for your gaming spirit!'}
                        </div>
                    </div>
                    
                    <div style="margin-top: 25px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button id="mario-reward-claim" style="
                            background: linear-gradient(180deg, #FF6B6B 0%, #E74C3C 100%);
                            border: 3px solid #C0392B;
                            color: white;
                            padding: 12px 20px;
                            font-size: 10px;
                            font-family: inherit;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                        ">🛒 OPEN STORE</button>
                        <button id="mario-reward-close" style="
                            background: transparent;
                            border: 3px solid #8B4513;
                            color: #8B4513;
                            padding: 12px 20px;
                            font-size: 10px;
                            font-family: inherit;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                        ">✖️ CLOSE</button>
                    </div>
                `;

                // Add animations
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes bounceIn {
                        0% { opacity: 0; transform: scale(0.3); }
                        50% { transform: scale(1.05); }
                        70% { transform: scale(0.9); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes fadeIn {
                        0% { opacity: 0; }
                        100% { opacity: 1; }
                    }
                    #mario-reward-claim:hover {
                        transform: scale(1.05);
                        background: linear-gradient(180deg, #E74C3C 0%, #C0392B 100%);
                    }
                    #mario-reward-close:hover {
                        background: rgba(139, 69, 19, 0.1) !important;
                        transform: scale(1.05);
                    }
                `;
                document.head.appendChild(style);

                overlay.appendChild(cardContainer);
                document.body.appendChild(overlay);

                // Display brand logo if available
                const logoContainer = document.getElementById('brand-logo');
                if (selectedReward.brandLogo) {
                    logoContainer.innerHTML = `
                        <img src="${selectedReward.brandLogo}" 
                             alt="Brand Logo" 
                             style="max-width: 80px; max-height: 40px; object-fit: contain;"
                             onerror="this.style.display='none'">
                    `;
                } else if (selectedReward.brand) {
                    logoContainer.innerHTML = `
                        <div style="font-size: 12px; color: #4169E1; font-weight: bold;">
                            ${selectedReward.brand}
                        </div>
                    `;
                }

                const claimButton = document.getElementById('mario-reward-claim');
                const closeButton = document.getElementById('mario-reward-close');

                // Set up claim button to purchase reward and open store
                claimButton.onclick = () => {
                    console.log('🛒 Claiming reward and opening store:', selectedReward.id);
                    claimButton.disabled = true;
                    claimButton.innerHTML = '⏳ PURCHASING...';

                    Mario.playSuperAPIHelper.purchaseReward(selectedReward.id)
                        .then(purchaseResult => {
                            console.log('✅ Successfully purchased reward:', purchaseResult);
                            console.log('📦 Purchase result structure:', JSON.stringify(purchaseResult, null, 2));

                            // Extract orderId from various possible response structures
                            let orderId = null;
                            if (purchaseResult.data?.orderId) {
                                orderId = purchaseResult.data.orderId;
                            } else if (purchaseResult.orderId) {
                                orderId = purchaseResult.orderId;
                            } else if (purchaseResult.id) {
                                orderId = purchaseResult.id;
                            } else if (purchaseResult.order_id) {
                                orderId = purchaseResult.order_id;
                            } else if (purchaseResult.data?.id) {
                                orderId = purchaseResult.data.id;
                            }

                            console.log('🆔 Extracted Order ID:', orderId);

                            if (!orderId) {
                                console.error('❌ No orderId found in purchase result!');
                                console.error('Purchase result keys:', Object.keys(purchaseResult));
                                throw new Error('Order ID not found in purchase response');
                            }

                            console.log('🏪 Opening store iframe to specific reward...');

                            // Open store iframe to the specific reward (no window.open needed!)
                            let storeUrl; // Define storeUrl before using it
                            if (typeof Mario.playSuperIntegration !== 'undefined') {
                                Mario.playSuperIntegration.openStoreToSpecificReward(orderId);
                                console.log('✅ Store iframe opened to reward:', orderId);
                                const config = Mario.playSuperConfig.getConfig();
                                storeUrl = `${config.storeUrl}/rewards/my-rewards/${orderId}`;
                            } else {
                                console.error('❌ PlaySuper integration not available');
                                // Fallback to window.open if integration not available
                                const config = Mario.playSuperConfig.getConfig();
                                storeUrl = `${config.storeUrl}/rewards/my-rewards/${orderId}`;
                                window.open(storeUrl, '_blank');
                            }

                            // Close scratch card and resolve
                            this.removeScratchCard(overlay);
                            resolve({
                                reward: selectedReward,
                                purchase: purchaseResult,
                                orderId: orderId,
                                storeUrl: storeUrl,
                                type: 'direct_reward_claim'
                            });
                        })
                        .catch(purchaseError => {
                            console.error('❌ Failed to purchase reward:', purchaseError);
                            claimButton.disabled = false;
                            claimButton.innerHTML = '🛒 OPEN STORE';
                            alert('Failed to claim reward. Please try again later.');
                        });
                };

                // Set up close button
                closeButton.onclick = () => {
                    console.log('User closed reward without claiming');
                    this.removeScratchCard(overlay);
                    resolve({
                        reward: selectedReward,
                        action: 'closed',
                        type: 'reward_closed'
                    });
                };

                // ESC key to close
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.removeScratchCard(overlay);
                        resolve({
                            reward: selectedReward,
                            action: 'escaped',
                            type: 'reward_escaped'
                        });
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);

            })
            .catch(error => {
                console.error('Failed to fetch rewards:', error);
                reject(error);
            });
    });
};

/**
 * Fetch rewards specifically for scratch cards with authenticated requests
 * Uses the same auth token as the store for secure, personalized rewards
 */
Mario.DiscountSystem.prototype.fetchScratchCardRewards = function () {
    console.log('Fetching scratch card rewards with unique game UUID...');

    if (!this.isInitialized) {
        return Promise.reject(new Error('Discount system not initialized'));
    }

    const config = Mario.playSuperConfig.getConfig();
    const url = new URL(`${config.baseUrl}/rewards`);

    // Add query parameters for scratch card rewards
    url.searchParams.append('coinId', config.coinId);
    url.searchParams.append('giftCard', 'false'); // Non-gift card rewards
    url.searchParams.append('limit', '10');

    // Use auth token for authenticated requests (more secure than UUID)
    const authToken = Mario.playSuperIntegration?.playerToken;
    if (!authToken) {
        console.warn('No auth token available for scratch card rewards');
        return Promise.reject(new Error('Authentication required for scratch card rewards'));
    }
    console.log('🔐 Using auth token for scratch card rewards:', authToken.substring(0, 20) + '...');

    return fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${authToken}`, // Use Bearer token for authentication
            'x-api-key': config.apiKey,
            'x-language': 'en'
        }
    })
        .then(response => {
            console.log('Scratch card rewards fetch response status:', response.status);
            if (!response.ok) {
                throw new Error(`Failed to fetch scratch card rewards: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            console.log('Scratch card rewards API response:', responseData);

            // Handle the API response structure
            let rewards = [];
            if (responseData && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
                rewards = responseData.data.data;
            } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                rewards = responseData.data;
            } else if (Array.isArray(responseData)) {
                rewards = responseData;
            }

            console.log('Processed scratch card rewards:', rewards.length);
            return rewards;
        })
        .catch(error => {
            console.error('Failed to fetch scratch card rewards:', error);
            throw error;
        });
};

Mario.DiscountSystem.prototype.removeScratchCard = function (overlay) {
    if (overlay && overlay.parentNode) {
        overlay.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
};

// Create global instance
Mario.discountSystem = new Mario.DiscountSystem();