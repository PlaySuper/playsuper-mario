/**
 * 💎 Enhanced Treasure Chest System - Level Completion Rewards
 * 
 * A beautiful treasure chest that appears after every level completion,
 * powered by our staff engineer API helper architecture.
 * 
 * Features:
 * 🎁 Appears after every level completion
 * ⚡ Powered by our intelligent API helper
 * 🎨 Beautiful chest opening animation
 * 💰 Base coins + bonus rewards + API rewards
 * 🏆 Progressive rewards based on level milestones
 * 📱 Mobile-responsive design with touch support
 */

Mario.TreasureChest = function () {
    this.isOpen = false;
    this.rewards = [];
    this.animationTimer = 0;
    this.animationId = null;
    this.apiHelper = null;
    this.isInitialized = false;

    // Animation properties
    this.chestState = 'closed'; // closed, opening, open
    this.sparkles = [];
    this.bounceOffset = 0;

    console.log('💎 Enhanced Treasure Chest System initialized!');
};

// ============= INITIALIZATION =============

Mario.TreasureChest.prototype.init = function () {
    if (this.isInitialized) return true;

    // Connect to our beautiful API helper
    if (Mario.playSuperAPIHelper && Mario.playSuperAPIHelper.isInitialized) {
        this.apiHelper = Mario.playSuperAPIHelper;
        this.isInitialized = true;
        console.log('💎 Treasure chest connected to API helper');
        return true;
    } else {
        console.warn('⚠️ API helper not available for treasure chest');
        return false;
    }
};

// ============= REWARD GENERATION =============

/**
 * 🏆 Generate level completion rewards using our beautiful API helper
 * Combines base rewards with API-powered bonus rewards
 */
Mario.TreasureChest.prototype.generateLevelRewards = function (levelNumber = 1) {
    if (!this.init()) {
        return this.generateFallbackRewards(levelNumber);
    }

    console.log('🏆 Generating level', levelNumber, 'completion rewards...');

    // Use our API helper for intelligent reward generation
    return this.apiHelper.generateLevelRewards(levelNumber)
        .then(rewards => {
            console.log('✅ Generated', rewards.length, 'rewards for level', levelNumber);
            return rewards;
        })
        .catch(error => {
            console.warn('⚠️ API reward generation failed, using fallback:', error);
            return this.generateFallbackRewards(levelNumber);
        });
};

/**
 * 🔄 Generate fallback rewards when API is unavailable
 */
Mario.TreasureChest.prototype.generateFallbackRewards = function (levelNumber = 1) {
    const baseRewards = [
        { type: 'coins', amount: 25, source: 'level_completion' },
        { type: 'experience', amount: 10, source: 'level_completion' }
    ];

    // Every 5th level gets bonus coins
    if (levelNumber % 5 === 0) {
        baseRewards.push({
            type: 'coins',
            amount: 50,
            source: 'milestone_bonus',
            description: `Level ${levelNumber} Milestone!`
        });
    }

    console.log('🔄 Generated fallback rewards for level', levelNumber);
    return Promise.resolve(baseRewards);
};

// ============= TREASURE CHEST OPENING FLOW =============

/**
 * 💎 Open the treasure chest with beautiful animation
 */
Mario.TreasureChest.prototype.open = function (levelNumber, callback) {
    if (this.isOpen) {
        console.log('⚠️ Treasure chest already open');
        return;
    }

    console.log('💎 Opening treasure chest for level', levelNumber);

    // Play chest opening sound
    this.playOpenSound();

    // Generate rewards for this level
    this.generateLevelRewards(levelNumber)
        .then(rewards => {
            this.rewards = rewards;
            this.isOpen = true;
            this.chestState = 'opening';

            // Show the beautiful UI
            this.showTreasureChestUI(levelNumber, () => {
                this.startOpeningAnimation(() => {
                    this.chestState = 'open';
                    this.distributeRewards(() => {
                        if (callback) callback(rewards);
                    });
                });
            });
        })
        .catch(error => {
            console.error('❌ Failed to open treasure chest:', error);
            if (callback) callback([]);
        });
};

/**
 * 🎨 Show beautiful treasure chest UI modal
 */
Mario.TreasureChest.prototype.showTreasureChestUI = function (levelNumber, callback) {
    // Remove any existing chest UI
    const existingOverlay = document.getElementById('mario-treasure-chest-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Create Mario-themed overlay
    const overlay = document.createElement('div');
    overlay.id = 'mario-treasure-chest-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(180deg, #5C94FC 0%, #5C94FC 50%, #00AA00 50%, #00AA00 100%);
        z-index: 30000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
        animation: treasureOverlayFadeIn 0.5s ease-out;
    `;

    // Create Mario-styled chest container
    const chestContainer = document.createElement('div');
    chestContainer.style.cssText = `
        background: #FFFF00;
        border: 6px solid #FF6B00;
        border-radius: 15px;
        padding: 30px;
        text-align: center;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        position: relative;
        animation: treasureChestBounce 0.8s ease-out;
    `;

    // Add Mario-style title
    const title = document.createElement('h2');
    title.innerHTML = `🏆 LEVEL ${levelNumber} COMPLETE! 🏆`;
    title.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #FF6B00;
        font-size: 14px;
        margin-bottom: 20px;
        text-shadow: 3px 3px 0px #000000, 0 0 15px #FFD700;
        animation: treasureTitleGlow 2s ease-in-out infinite alternate;
    `;

    // Add Mario-style message
    const message = document.createElement('div');
    message.innerHTML = `🍄 Princess Peach rewards you! 🍄`;
    message.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #8B0000;
        font-size: 10px;
        margin-bottom: 25px;
        line-height: 1.4;
    `;

    // Add Mario-themed chest visual
    const chestVisual = document.createElement('div');
    chestVisual.id = 'treasure-chest-visual';
    chestVisual.style.cssText = `
        width: 120px;
        height: 80px;
        background: linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #8B4513 100%);
        border: 4px solid #FF6B00;
        border-radius: 10px;
        margin: 20px auto;
        position: relative;
        cursor: pointer;
        transition: transform 0.3s ease;
    `;

    // Add chest lid
    const chestLid = document.createElement('div');
    chestLid.id = 'treasure-chest-lid';
    chestLid.style.cssText = `
        position: absolute;
        top: -8px;
        left: -3px;
        right: -3px;
        height: 25px;
        background: linear-gradient(135deg, #A0522D 0%, #8B4513 50%, #654321 100%);
        border: 3px solid #FFD700;
        border-radius: 10px 10px 5px 5px;
        transform-origin: bottom;
        transition: transform 0.8s ease-out;
    `;

    // Add lock
    const lock = document.createElement('div');
    lock.style.cssText = `
        position: absolute;
        top: 5px;
        left: 50%;
        transform: translateX(-50%);
        width: 15px;
        height: 15px;
        background: #FFD700;
        border: 2px solid #FFA500;
        border-radius: 3px;
        transition: opacity 0.5s ease;
    `;

    chestLid.appendChild(lock);
    chestVisual.appendChild(chestLid);

    // Add instructions
    const instructions = document.createElement('p');
    instructions.innerHTML = '🖱️ Click the chest to open it!';
    instructions.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #FFFFFF;
        font-size: 10px;
        margin-top: 20px;
        text-shadow: 1px 1px 0px #000;
        animation: treasureInstructionsPulse 1.5s ease-in-out infinite;
    `;

    // Assemble the chest UI
    chestContainer.appendChild(title);
    chestContainer.appendChild(chestVisual);
    chestContainer.appendChild(instructions);
    overlay.appendChild(chestContainer);

    // Add CSS animations
    this.addTreasureChestStyles();

    // Add click handler
    chestVisual.onclick = () => {
        chestVisual.onclick = null; // Prevent double-clicks
        instructions.innerHTML = '✨ Opening treasure chest...';
        if (callback) callback();
    };

    // Add to document
    document.body.appendChild(overlay);

    console.log('💎 Treasure chest UI displayed');
};

/**
 * ✨ Start the beautiful chest opening animation
 */
Mario.TreasureChest.prototype.startOpeningAnimation = function (callback) {
    const lid = document.getElementById('treasure-chest-lid');
    const visual = document.getElementById('treasure-chest-visual');

    if (!lid || !visual) {
        if (callback) callback();
        return;
    }

    // Play opening sound
    this.playOpenSound();

    // Animate lid opening
    lid.style.transform = 'rotateX(-120deg)';

    // Add sparkle effects
    setTimeout(() => {
        this.addSparkleEffects(visual);
    }, 400);

    // Complete animation
    setTimeout(() => {
        if (callback) callback();
    }, 1000);
};

/**
 * ✨ Add magical sparkle effects
 */
Mario.TreasureChest.prototype.addSparkleEffects = function (container) {
    const sparkleCount = 12;

    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.innerHTML = '✨';
        sparkle.style.cssText = `
            position: absolute;
            font-size: 16px;
            color: #FFD700;
            animation: sparkleFloat 2s ease-out forwards;
            animation-delay: ${i * 0.1}s;
            pointer-events: none;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        `;

        // Random direction for sparkles
        const angle = (i / sparkleCount) * 360;
        const distance = 50 + Math.random() * 30;

        sparkle.style.setProperty('--end-x', `${Math.cos(angle * Math.PI / 180) * distance}px`);
        sparkle.style.setProperty('--end-y', `${Math.sin(angle * Math.PI / 180) * distance}px`);

        container.appendChild(sparkle);

        // Remove sparkle after animation
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 2000);
    }
};

/**
 * 💰 Distribute rewards and show them to the player
 */
Mario.TreasureChest.prototype.distributeRewards = function (callback) {
    console.log('💰 Distributing', this.rewards.length, 'rewards...');

    // Update the UI to show rewards
    const overlay = document.getElementById('mario-treasure-chest-overlay');
    if (!overlay) {
        if (callback) callback();
        return;
    }

    // Create rewards display
    const rewardsContainer = document.createElement('div');
    rewardsContainer.style.cssText = `
        margin-top: 30px;
        background: rgba(0,0,0,0.5);
        border-radius: 15px;
        padding: 20px;
        border: 2px solid #FFD700;
    `;

    const rewardsTitle = document.createElement('h3');
    rewardsTitle.innerHTML = '🎁 YOUR REWARDS 🎁';
    rewardsTitle.style.cssText = `
        font-family: 'Press Start 2P', 'Courier New', monospace;
        color: #FFD700;
        font-size: 12px;
        margin-bottom: 15px;
        text-shadow: 1px 1px 0px #000;
    `;

    rewardsContainer.appendChild(rewardsTitle);

    // Display each reward
    this.rewards.forEach((reward, index) => {
        const rewardElement = this.createRewardElement(reward, index);
        rewardsContainer.appendChild(rewardElement);

        // Distribute actual coins through PlaySuper
        if (reward.type === 'coins' && Mario.playSuperIntegration && Mario.playSuperIntegration.isInitialized) {
            setTimeout(() => {
                Mario.playSuperIntegration.distributeCoins(reward.amount)
                    .then(() => {
                        console.log(`✅ Distributed ${reward.amount} coins from treasure chest`);
                    })
                    .catch(error => {
                        console.warn(`⚠️ Failed to distribute treasure chest coins:`, error);
                    });
            }, index * 500);
        }
    });

    // Add continue button
    const continueButton = document.createElement('button');
    continueButton.innerHTML = '🎮 CONTINUE ADVENTURE';
    continueButton.style.cssText = `
        background: linear-gradient(180deg, #32CD32 0%, #228B22 100%);
        color: white;
        border: 3px solid #006400;
        padding: 15px 30px;
        border-radius: 10px;
        font-family: 'Press Start 2P', 'Courier New', monospace;
        font-size: 10px;
        cursor: pointer;
        margin-top: 20px;
        transition: transform 0.1s ease;
    `;

    continueButton.onmouseover = () => continueButton.style.transform = 'scale(1.05)';
    continueButton.onmouseout = () => continueButton.style.transform = 'scale(1)';
    continueButton.onclick = () => {
        this.closeTreasureChest();
        if (callback) callback();
    };

    rewardsContainer.appendChild(continueButton);

    // Add to overlay
    const chestContainer = overlay.querySelector('div');
    chestContainer.appendChild(rewardsContainer);

    // Play reward sound
    setTimeout(() => {
        this.playRewardSound();
    }, 500);
};

/**
 * 🎁 Create individual reward display element
 */
Mario.TreasureChest.prototype.createRewardElement = function (reward, index) {
    const element = document.createElement('div');
    element.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 10px 15px;
        margin-bottom: 8px;
        animation: rewardSlideIn 0.5s ease-out forwards;
        animation-delay: ${index * 0.2}s;
        opacity: 0;
        border: 1px solid rgba(255,215,0,0.3);
    `;

    let icon = '💰';
    let description = '';

    switch (reward.type) {
        case 'coins':
            icon = '🪙';
            description = `${reward.amount} Coins`;
            break;
        case 'experience':
            icon = '⭐';
            description = `${reward.amount} XP`;
            break;
        case 'bonus':
            icon = '🎁';
            description = reward.description || 'Bonus Reward';
            break;
        default:
            icon = '🎊';
            description = reward.name || 'Special Reward';
    }

    element.innerHTML = `
        <span style="font-size: 20px;">${icon}</span>
        <span style="font-family: 'Press Start 2P'; color: white; font-size: 10px; text-shadow: 1px 1px 0px #000;">
            ${description}
        </span>
        <span style="font-size: 16px;">✨</span>
    `;

    return element;
};

// ============= SOUND EFFECTS =============

Mario.TreasureChest.prototype.playOpenSound = function () {
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup");
    }
};

Mario.TreasureChest.prototype.playRewardSound = function () {
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin");
    }
};

// ============= UI MANAGEMENT =============

/**
 * ❌ Close the treasure chest UI
 */
Mario.TreasureChest.prototype.closeTreasureChest = function () {
    const overlay = document.getElementById('mario-treasure-chest-overlay');
    if (overlay) {
        overlay.style.animation = 'treasureOverlayFadeOut 0.5s ease-in';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }

    this.isOpen = false;
    this.chestState = 'closed';
    this.rewards = [];

    console.log('💎 Treasure chest closed');
};

/**
 * 🎨 Add beautiful CSS animations for treasure chest
 */
Mario.TreasureChest.prototype.addTreasureChestStyles = function () {
    if (document.head.querySelector('#treasure-chest-styles')) return;

    const style = document.createElement('style');
    style.id = 'treasure-chest-styles';
    style.textContent = `
        @keyframes treasureOverlayFadeIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(5px); }
        }
        
        @keyframes treasureOverlayFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes treasureChestBounce {
            0% { transform: scale(0.3) translateY(50px); opacity: 0; }
            50% { transform: scale(1.1) translateY(-10px); }
            70% { transform: scale(0.9) translateY(5px); }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        @keyframes treasureTitleGlow {
            from { text-shadow: 2px 2px 0px #000, 0 0 10px #FFD700; }
            to { text-shadow: 2px 2px 0px #000, 0 0 20px #FFD700, 0 0 30px #FFD700; }
        }
        
        @keyframes treasureInstructionsPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
        }
        
        @keyframes sparkleFloat {
            0% { 
                opacity: 0; 
                transform: translate(-50%, -50%) scale(0); 
            }
            50% { 
                opacity: 1; 
                transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(0); 
            }
        }
        
        @keyframes rewardSlideIn {
            from { 
                opacity: 0; 
                transform: translateX(-50px); 
            }
            to { 
                opacity: 1; 
                transform: translateX(0); 
            }
        }
    `;
    document.head.appendChild(style);
};

// ============= GLOBAL INSTANCE =============

// Create global instance for easy access
if (typeof Mario !== 'undefined') {
    Mario.treasureChest = new Mario.TreasureChest();
    console.log('💎✨ Enhanced Treasure Chest System ready to reward players!');
}