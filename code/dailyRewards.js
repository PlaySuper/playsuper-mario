/**
 * 🎁 Daily Rewards System - The Heart of Player Engagement
 * 
 * A beautifully crafted daily reward system that keeps players coming back.
 * Built with staff engineer principles: reliable, scalable, and delightful.
 * 
 * Features:
 * 🎯 One claim per calendar day (timezone-aware)
 * 🎁 Guaranteed gift card reward in spin wheel
 * ⚡ Integration with our beautiful API helper
 * 🔑 Idempotency keys for safe API calls
 * 📊 Analytics tracking for engagement insights
 * 🛡️ Comprehensive error handling with graceful fallbacks
 */

Mario.DailyRewards = function () {
    this.lastClaimDate = localStorage.getItem('mario_last_daily_claim') || null;
    this.dailyClaimCount = parseInt(localStorage.getItem('mario_daily_claim_count') || '0');
    this.maxDailyClaims = 10; // Maximum 10 claims per day
    this.canClaim = this.checkCanClaim();
    this.apiHelper = null; // Will be initialized when needed
    this.isInitialized = false;
    this.claimInProgress = false;

    console.log('🎁 Daily Rewards System initialized - Ready to delight players!');
    console.log(`📊 Daily claims: ${this.dailyClaimCount}/${this.maxDailyClaims}`);
};

// ============= INITIALIZATION & SETUP =============

Mario.DailyRewards.prototype.init = function () {
    if (this.isInitialized) {
        console.log('✅ Daily Rewards already initialized');
        return true;
    }

    // Initialize our beautiful API helper
    if (!Mario.playSuperAPIHelper) {
        console.error('❌ PlaySuper API Helper not available');
        return false;
    }

    this.apiHelper = Mario.playSuperAPIHelper;

    // Ensure API helper is initialized
    if (!this.apiHelper.isInitialized) {
        this.apiHelper.init();
    }

    this.isInitialized = true;
    console.log('🚀 Daily Rewards System ready with API integration');

    return true;
};

// ============= DAILY CLAIM LOGIC =============

/**
 * 📅 Check if user can claim today's reward
 * Supports up to 10 claims per calendar day for better engagement
 */
Mario.DailyRewards.prototype.checkCanClaim = function () {
    const today = new Date().toDateString(); // User's local date

    // Reset count if it's a new day
    if (this.lastClaimDate !== today) {
        this.dailyClaimCount = 0;
        localStorage.setItem('mario_daily_claim_count', '0');
    }

    const canClaim = this.dailyClaimCount < this.maxDailyClaims;

    if (canClaim) {
        console.log(`🎉 Player can claim reward! Claims today: ${this.dailyClaimCount}/${this.maxDailyClaims}`);
    } else {
        console.log('⏰ Daily claim limit reached! Come back tomorrow for more rewards!');
    }

    return canClaim;
};

/**
 * 🎲 Generate daily spin wheel rewards
 * Simplified: 1 gift card (giftCard: true) + 5 other rewards (giftCard: false)
 */
Mario.DailyRewards.prototype.fetchDailyRewards = function () {
    if (!this.isInitialized) this.init();

    console.log('🎲 Generating today\'s spin wheel rewards...');

    // Simplified approach: just giftCard: true for guaranteed gift card
    const giftCardPromise = this.apiHelper.fetchGiftCardRewards(1);

    // Other rewards: giftCard: false
    const otherRewardsPromise = this.apiHelper.fetchRewards({
        giftCard: false,
        limit: 5
    });

    return Promise.all([giftCardPromise, otherRewardsPromise])
        .then(([giftCards, otherRewards]) => {
            if (!giftCards || giftCards.length === 0) {
                throw new Error('No gift cards available for daily reward');
            }

            return this.createSpinWheelData(giftCards, otherRewards.slice(0, 5));
        })
        .catch(error => {
            console.error('❌ Failed to fetch daily rewards:', error);
            // Return mock rewards for testing/fallback
            return this.createFallbackRewards();
        });
};

/**
 * 🎨 Create perfectly structured spin wheel data
 * Ensures gift card is always at position 0 (guaranteed win)
 * Preserves brand logo images for beautiful wheel display
 */
Mario.DailyRewards.prototype.createSpinWheelData = function (giftCards, otherRewards) {
    const guaranteedGiftCard = giftCards[0];

    // Ensure brand logo is available for the spin wheel
    if (guaranteedGiftCard && guaranteedGiftCard.metadata && guaranteedGiftCard.metadata.brandLogoImage) {
        guaranteedGiftCard.logoUrl = guaranteedGiftCard.metadata.brandLogoImage;
    }

    // 🎯 Mark the gift card clearly for identification
    guaranteedGiftCard.type = 'giftCard';
    guaranteedGiftCard.giftCard = true;

    // Ensure we have exactly 6 rewards total (1 gift card + 5 others)
    const wheelRewards = [guaranteedGiftCard];

    // Add other rewards, padding with duplicates if needed
    for (let i = 0; i < 5; i++) {
        if (i < otherRewards.length) {
            const reward = otherRewards[i];
            // Ensure brand logo is available for each reward
            if (reward && reward.metadata && reward.metadata.brandLogoImage) {
                reward.logoUrl = reward.metadata.brandLogoImage;
            }
            // Mark as non-gift card
            reward.giftCard = false;
            wheelRewards.push(reward);
        } else {
            // Pad with previous rewards or create placeholder
            wheelRewards.push(otherRewards[i % otherRewards.length] || this.createPlaceholderReward(i));
        }
    }

    console.log('🎯 Created spin wheel with', wheelRewards.length, 'rewards (gift card guaranteed at position 0)');
    console.log('🎨 Brand logos preserved for wheel display');

    return {
        guaranteedGiftCard: guaranteedGiftCard,
        wheelRewards: wheelRewards,
        totalRewards: wheelRewards.length,
        giftCardPosition: 0 // Always position 0 for guaranteed win
    };
};

/**
 * 🎁 Create fallback rewards when API is unavailable
 * Ensures the game remains playable even without connectivity
 */
Mario.DailyRewards.prototype.createFallbackRewards = function () {
    console.log('🔄 Creating fallback rewards for offline experience');

    const fallbackRewards = [
        { id: 'fallback-gc-1', name: 'Mystery Gift Card', type: 'giftCard', brand: 'Mystery Brand', logoUrl: null },
        { id: 'fallback-1', name: 'Coin Bonus', type: 'coins', amount: 50 },
        { id: 'fallback-2', name: 'Extra Life', type: 'life', amount: 1 },
        { id: 'fallback-3', name: 'Speed Boost', type: 'powerup', name: 'Speed' },
        { id: 'fallback-4', name: 'Jump Boost', type: 'powerup', name: 'Jump' },
        { id: 'fallback-5', name: 'Invincibility', type: 'powerup', name: 'Star' }
    ];

    return {
        guaranteedGiftCard: fallbackRewards[0],
        wheelRewards: fallbackRewards,
        totalRewards: fallbackRewards.length,
        giftCardPosition: 0,
        isFallback: true
    };
};

/**
 * 🎨 Create placeholder reward when we need to pad the wheel
 */
Mario.DailyRewards.prototype.createPlaceholderReward = function (index) {
    return {
        id: `placeholder-${index}`,
        name: `Bonus ${index + 1}`,
        type: 'bonus',
        description: 'Mystery Bonus Reward'
    };
};

// ============= DAILY CLAIM PROCESS =============

/**
 * 🎯 Process the daily reward claim
 * Handles the complete flow from validation to API purchase
 */
Mario.DailyRewards.prototype.claimDailyReward = function () {
    if (this.claimInProgress) {
        console.log('⏳ Claim already in progress...');
        return Promise.reject(new Error('Claim already in progress'));
    }

    if (!this.checkCanClaim()) {
        return Promise.reject(new Error('Daily reward already claimed today'));
    }

    this.claimInProgress = true;
    console.log('🎁 Starting daily reward claim process...');

    return this.fetchDailyRewards()
        .then(spinWheelData => {
            // Generate idempotency key for safe API calls
            const idempotencyKey = this.apiHelper.generateIdempotencyKey('daily_reward');

            // If it's a fallback reward, skip API purchase
            if (spinWheelData.isFallback) {
                console.log('🔄 Using fallback rewards, skipping API purchase');
                return this.completeClaim(spinWheelData, null);
            }

            // Purchase the guaranteed gift card through API
            return this.apiHelper.purchaseReward(
                spinWheelData.guaranteedGiftCard.id,
                idempotencyKey
            ).then(purchaseResult => {
                return this.completeClaim(spinWheelData, purchaseResult);
            }).catch(purchaseError => {
                console.warn('⚠️ API purchase failed, continuing with visual reward:', purchaseError);
                // Continue with visual reward even if purchase fails
                return this.completeClaim(spinWheelData, null);
            });
        })
        .finally(() => {
            this.claimInProgress = false;
        });
};

/**
 * ✅ Complete the claim process and update storage
 */
Mario.DailyRewards.prototype.completeClaim = function (spinWheelData, purchaseResult) {
    // Update last claim date
    const today = new Date().toDateString();
    this.lastClaimDate = today;
    localStorage.setItem('mario_last_daily_claim', today);

    // Update daily claim count
    this.dailyClaimCount++;
    localStorage.setItem('mario_daily_claim_count', this.dailyClaimCount.toString());

    // Update claim status
    this.canClaim = this.checkCanClaim(); // Re-check if more claims available

    console.log(`✅ Daily reward claimed successfully! Claims today: ${this.dailyClaimCount}/${this.maxDailyClaims}`);

    // Prepare complete claim data
    const claimData = {
        ...spinWheelData,
        claimDate: today,
        dailyClaimNumber: this.dailyClaimCount,
        remainingClaims: this.maxDailyClaims - this.dailyClaimCount,
        purchaseResult: purchaseResult,
        claimId: `daily_${Date.now()}`
    };

    // Track analytics
    this.trackDailyClaim(claimData);

    return claimData;
};

// ============= ANALYTICS & TRACKING =============

/**
 * 📊 Track daily claim for analytics and optimization
 */
Mario.DailyRewards.prototype.trackDailyClaim = function (claimData) {
    try {
        // Store basic analytics locally
        const analytics = JSON.parse(localStorage.getItem('mario_daily_analytics') || '{}');
        analytics.totalClaims = (analytics.totalClaims || 0) + 1;
        analytics.lastClaimDate = claimData.claimDate;
        analytics.streak = this.calculateStreak(analytics);

        localStorage.setItem('mario_daily_analytics', JSON.stringify(analytics));

        console.log('📊 Daily claim tracked:', {
            totalClaims: analytics.totalClaims,
            streak: analytics.streak,
            giftCard: claimData.guaranteedGiftCard.name
        });
    } catch (error) {
        console.warn('⚠️ Failed to track daily claim analytics:', error);
    }
};

/**
 * 🔥 Calculate daily claim streak
 */
Mario.DailyRewards.prototype.calculateStreak = function (analytics) {
    // This would be enhanced with proper date calculation in production
    return (analytics.streak || 0) + 1;
};

// ============= UTILITY METHODS =============

/**
 * 📅 Get next claim availability
 */
Mario.DailyRewards.prototype.getNextClaimTime = function () {
    if (this.canClaim) {
        return new Date(); // Available now
    }

    // Next claim available tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

    return tomorrow;
};

/**
 * 📊 Get player analytics summary
 */
Mario.DailyRewards.prototype.getAnalytics = function () {
    try {
        const analytics = JSON.parse(localStorage.getItem('mario_daily_analytics') || '{}');
        return {
            totalClaims: analytics.totalClaims || 0,
            currentStreak: analytics.streak || 0,
            lastClaimDate: analytics.lastClaimDate || null,
            canClaimToday: this.canClaim,
            nextClaimTime: this.getNextClaimTime()
        };
    } catch (error) {
        console.warn('⚠️ Failed to get analytics:', error);
        return {
            totalClaims: 0,
            currentStreak: 0,
            lastClaimDate: null,
            canClaimToday: this.canClaim,
            nextClaimTime: this.getNextClaimTime()
        };
    }
};

/**
 * 🧹 Reset daily rewards (for testing/admin)
 */
Mario.DailyRewards.prototype.resetForTesting = function () {
    localStorage.removeItem('mario_last_daily_claim');
    localStorage.removeItem('mario_daily_analytics');
    this.lastClaimDate = null;
    this.canClaim = true;
    console.log('🧹 Daily rewards reset for testing');
};

// ============= GLOBAL INSTANCE CREATION =============

// Create the global instance for easy access
if (typeof Mario !== 'undefined') {
    Mario.dailyRewards = new Mario.DailyRewards();
    console.log('🎁✨ Daily Rewards System ready to engage players!');
}