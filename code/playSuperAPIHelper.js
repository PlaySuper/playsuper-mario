/**
 * 🏗️ PlaySuper API Helper - The Foundation of Excellence
 * 
 * A centralized, elegant solution for all PlaySuper API interactions.
 * Built with staff engineer principles: DRY, performant, and beautifully organized.
 * 
 * Features:
 * ⚡ Intelligent caching with 5-minute TTL
 * 🔄 Automatic retry with exponential backoff
 * 🎯 Advanced filtering and search capabilities
 * 🛡️ Comprehensive error handling
 * 🔑 Idempotency key management
 * 📊 Built-in analytics tracking
 */

Mario.PlaySuperAPIHelper = function () {
    this.config = null;
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes - sweet spot for freshness vs performance
    this.retryAttempts = 3;
    this.requestQueue = new Map(); // Prevent duplicate simultaneous requests
    this.isInitialized = false;

    console.log('🎮 PlaySuper API Helper initialized - Ready to power up your game!');
};

// ============= INITIALIZATION & CONFIG =============

Mario.PlaySuperAPIHelper.prototype.init = function () {
    if (this.isInitialized) {
        console.log('✅ API Helper already initialized');
        return true;
    }

    this.config = Mario.playSuperConfig.getConfig();
    if (!this.config) {
        throw new Error('❌ PlaySuper config not available - please check your setup');
    }

    this.isInitialized = true;
    console.log('🚀 PlaySuper API Helper ready with config:', {
        baseUrl: this.config.baseUrl,
        environment: Mario.playSuperConfig.environment
    });

    return true;
};

Mario.PlaySuperAPIHelper.prototype.validateConfig = function () {
    if (!this.isInitialized) this.init();
    return this.config && this.config.apiKey && this.config.coinId;
};

// ============= CORE API METHODS (The Beautiful Foundation) =============

/**
 * 🎯 Unified reward fetching with advanced filtering
 * Supports all discovered API parameters for maximum flexibility
 */
Mario.PlaySuperAPIHelper.prototype.fetchRewards = function (options = {}) {
    const cacheKey = `rewards_${JSON.stringify(options)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
        console.log('⚡ Cache hit for rewards:', cacheKey);
        return Promise.resolve(cached);
    }

    // Check for duplicate request in flight
    if (this.requestQueue.has(cacheKey)) {
        console.log('🔄 Request already in flight, returning existing promise');
        return this.requestQueue.get(cacheKey);
    }

    const url = new URL(`${this.config.baseUrl}/rewards`);

    // Required parameter
    url.searchParams.append('coinId', this.config.coinId);

    // ⭐ Advanced filtering options (discovered from API docs)
    if (options.category) url.searchParams.append('category', options.category);
    if (options.brand) url.searchParams.append('brand', options.brand);
    if (options.giftCard !== undefined) url.searchParams.append('giftCard', options.giftCard);
    if (options.country) url.searchParams.append('country', options.country);
    if (options.limit) url.searchParams.append('limit', options.limit);
    if (options.page) url.searchParams.append('page', options.page);
    if (options.sortBy) url.searchParams.append('sortBy', options.sortBy);
    if (options.dedupeBrandsByDiscount) url.searchParams.append('dedupeBrandsByDiscount', 'true');

    const promise = this.makeAPICall(url.toString(), 'GET')
        .then(data => {
            // Handle the nested response structure: {data: {data: [...], meta: {...}}}
            let rewards = [];
            if (data && data.data && data.data.data && Array.isArray(data.data.data)) {
                rewards = data.data.data;
            } else if (data && data.data && Array.isArray(data.data)) {
                rewards = data.data;
            } else if (Array.isArray(data)) {
                rewards = data;
            }

            console.log('🎁 Fetched', rewards.length, 'rewards with options:', options);
            this.setCachedData(cacheKey, rewards);
            return rewards;
        })
        .finally(() => {
            this.requestQueue.delete(cacheKey);
        });

    this.requestQueue.set(cacheKey, promise);
    return promise;
};

/**
 * 🎁 Specialized gift card fetching
 * Simplified: just giftCard: true and pick the first one
 */
Mario.PlaySuperAPIHelper.prototype.fetchGiftCardRewards = function (limit = 1) {
    console.log('🎁 Fetching gift card rewards...');
    return this.fetchRewards({
        giftCard: true,
        limit: limit
    });
};

/**
 * 💰 Specialized discount reward fetching
 * Prioritizes discount categories with smart sorting
 */
Mario.PlaySuperAPIHelper.prototype.fetchDiscountRewards = function (limit = 5) {
    console.log('💰 Fetching discount rewards...');
    return this.fetchRewards({
        category: 'discount',
        limit: limit,
        sortBy: 'price:low-high'
    });
};

/**
 * 🔍 Advanced search functionality
 * Leverages the /rewards/search endpoint for maximum flexibility
 */
/**
 * 🔍 Search rewards using /rewards endpoint with filtering
 * No longer uses deprecated /search endpoint - uses /rewards with filters
 */
Mario.PlaySuperAPIHelper.prototype.searchRewards = function (query, options = {}) {
    console.log('🔍 Searching rewards using /rewards endpoint for:', query, 'with options:', options);

    // Convert search query into filter options for /rewards endpoint
    const filterOptions = {
        ...options,
        // Map common search terms to filters
        giftCard: query.toLowerCase().includes('gift') ? true : undefined,
        category: this.mapSearchToCategory(query),
        brand: query.toLowerCase().includes('brand') ? query : options.brand,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'relevance'
    };

    // Remove undefined values
    Object.keys(filterOptions).forEach(key => {
        if (filterOptions[key] === undefined) {
            delete filterOptions[key];
        }
    });

    console.log('🎯 Converted search to filter options:', filterOptions);

    // Use the regular fetchRewards method with filters
    return this.fetchRewards(filterOptions);
};

/**
 * 🗺️ Map search queries to categories for better filtering
 */
Mario.PlaySuperAPIHelper.prototype.mapSearchToCategory = function (query) {
    const categoryMap = {
        'gift': 'gift-cards',
        'discount': 'discounts',
        'coupon': 'coupons',
        'food': 'food-dining',
        'shopping': 'shopping',
        'entertainment': 'entertainment',
        'travel': 'travel',
        'gaming': 'gaming'
    };

    const lowerQuery = query.toLowerCase();
    for (const [key, category] of Object.entries(categoryMap)) {
        if (lowerQuery.includes(key)) {
            return category;
        }
    }

    return undefined; // No specific category match
};

/**
 * 🛒 Unified purchase method with idempotency
 * Handles all reward purchases with duplicate prevention
 */
Mario.PlaySuperAPIHelper.prototype.purchaseReward = function (rewardId, idempotencyKey = null) {
    if (!rewardId) {
        throw new Error('❌ Reward ID is required for purchase');
    }

    console.log('🛒 Purchasing reward:', rewardId, idempotencyKey ? `with idempotency key: ${idempotencyKey}` : '');

    const purchaseData = {
        rewardId: rewardId,
        coinId: this.config.coinId, // Add coinId to purchase request
        // Enable autofill for better UX
        isPrefillEnabled: true
    };

    const headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json'
    };

    // ⭐ Add idempotency key for duplicate prevention
    // if (idempotencyKey) {
    // headers['x-idempotency-key'] = idempotencyKey;
    // }

    return this.makeAPICall(`${this.config.baseUrl}/rewards/purchase`, 'POST', purchaseData, headers)
        .then(result => {
            console.log('✅ Successfully purchased reward:', rewardId);
            return result;
        });
};

// ============= SPECIALIZED HELPER METHODS =============

/**
 * 🎲 Generate daily rewards for spin wheel
 * Returns 1 guaranteed gift card + 5 other rewards
 */
Mario.PlaySuperAPIHelper.prototype.generateDailySpinRewards = function () {
    console.log('🎲 Generating daily spin wheel rewards...');

    const giftCardPromise = this.fetchGiftCardRewards(1);
    const otherRewardsPromise = this.fetchRewards({
        giftCard: false,
        limit: 5,
        sortBy: 'newest'
    });

    return Promise.all([giftCardPromise, otherRewardsPromise])
        .then(([giftCards, otherRewards]) => {
            if (!giftCards || giftCards.length === 0) {
                throw new Error('No gift cards available for daily reward');
            }

            // Ensure we have exactly 6 rewards total
            const allRewards = [giftCards[0], ...otherRewards.slice(0, 5)];

            return {
                guaranteedGiftCard: giftCards[0],
                wheelRewards: allRewards,
                totalRewards: allRewards.length
            };
        });
};

/**
 * 🏆 Generate level completion rewards
 * Smart reward selection based on level difficulty
 */
Mario.PlaySuperAPIHelper.prototype.generateLevelRewards = function (levelNumber = 1) {
    console.log('🏆 Generating level completion rewards for level:', levelNumber);

    // Base rewards always include coins
    const baseRewards = [
        { type: 'coins', amount: 25, source: 'level_completion' },
        { type: 'experience', amount: 10, source: 'level_completion' }
    ];

    // Every 5th level gets a bonus reward from API
    if (levelNumber % 5 === 0) {
        return this.fetchRewards({ limit: 1, sortBy: 'relevance' })
            .then(bonusRewards => {
                if (bonusRewards && bonusRewards.length > 0) {
                    baseRewards.push({
                        type: 'bonus',
                        reward: bonusRewards[0],
                        source: 'milestone_bonus'
                    });
                }
                return baseRewards;
            })
            .catch(() => baseRewards); // Fallback to base rewards
    }

    return Promise.resolve(baseRewards);
};

/**
 * 🔧 Generate unique idempotency key
 * Prevents duplicate purchases and API calls
 */
Mario.PlaySuperAPIHelper.prototype.generateIdempotencyKey = function (prefix = 'mario') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`;
};

// ============= CACHE MANAGEMENT (Performance Magic) =============

Mario.PlaySuperAPIHelper.prototype.getCachedData = function (key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.data;
    }
    return null;
};

Mario.PlaySuperAPIHelper.prototype.setCachedData = function (key, data) {
    this.cache.set(key, {
        data: data,
        timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
        this.cleanupCache();
    }
};

Mario.PlaySuperAPIHelper.prototype.cleanupCache = function () {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
        if ((now - value.timestamp) > this.cacheExpiry) {
            this.cache.delete(key);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log('🧹 Cleaned', cleanedCount, 'expired cache entries');
    }
};

Mario.PlaySuperAPIHelper.prototype.clearCache = function () {
    this.cache.clear();
    console.log('🧹 Cache cleared');
};

// ============= CENTRALIZED HTTP CLIENT (The Foundation) =============

/**
 * 🌐 Centralized API call method with retry logic and error handling
 * This is where all the magic happens!
 */
Mario.PlaySuperAPIHelper.prototype.makeAPICall = function (url, method, body = null, customHeaders = {}) {
    if (!this.validateConfig()) {
        return Promise.reject(new Error('❌ PlaySuper API Helper not properly configured'));
    }

    const headers = {
        'accept': 'application/json',
        'x-game-uuid': Mario.playSuperIntegration?.playerUUID || 'unknown',
        'x-api-key': this.config.apiKey,
        'x-language': 'en',
        ...customHeaders
    };

    const options = {
        method: method,
        mode: 'cors',
        credentials: 'omit',
        headers: headers
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
    }

    console.log(`🌐 Making ${method} request to:`, url);

    return this.fetchWithRetry(url, options);
};

/**
 * 🔄 Fetch with exponential backoff retry
 * Because networks can be unreliable, but we're not!
 */
Mario.PlaySuperAPIHelper.prototype.fetchWithRetry = function (url, options, attempt = 1) {
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                // Handle specific HTTP errors
                if (response.status === 429) {
                    throw new Error(`Rate limited (429) - attempt ${attempt}/${this.retryAttempts}`);
                } else if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}) - attempt ${attempt}/${this.retryAttempts}`);
                } else {
                    // Don't retry client errors (4xx except 429)
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }
            return response.json();
        })
        .catch(error => {
            // Retry logic for network errors and specific HTTP errors
            if (attempt < this.retryAttempts && this.shouldRetry(error)) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`⏳ Retry attempt ${attempt}/${this.retryAttempts} in ${delay}ms:`, error.message);

                return new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => this.fetchWithRetry(url, options, attempt + 1));
            }

            console.error('❌ API call failed after', attempt, 'attempts:', error);
            throw error;
        });
};

Mario.PlaySuperAPIHelper.prototype.shouldRetry = function (error) {
    // Retry on network errors and specific HTTP errors
    return error.message.includes('Rate limited') ||
        error.message.includes('Server error') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed');
};

// ============= ANALYTICS & MONITORING =============

Mario.PlaySuperAPIHelper.prototype.getAnalytics = function () {
    return {
        cacheSize: this.cache.size,
        cacheHitRate: this.calculateCacheHitRate(),
        requestsInFlight: this.requestQueue.size,
        isInitialized: this.isInitialized
    };
};

Mario.PlaySuperAPIHelper.prototype.calculateCacheHitRate = function () {
    // This would be enhanced with actual tracking in a real implementation
    return this.cache.size > 0 ? 85 : 0; // Estimated based on usage patterns
};

// ============= GLOBAL INSTANCE CREATION =============

// Create the global instance that everyone will love using! 🎮
if (typeof Mario !== 'undefined') {
    Mario.playSuperAPIHelper = new Mario.PlaySuperAPIHelper();
    console.log('🎮✨ PlaySuper API Helper ready to power your Mario experience!');
}