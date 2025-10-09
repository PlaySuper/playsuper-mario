/**
 * PlaySuper Configuration with Dynamic Credential Management
 * This configuration allows users to input their own API credentials
 * for secure and personalized PlaySuper integration
 */

window.Mario = window.Mario || {};

Mario.playSuperConfig = {
    // Default environment (can be 'development' or 'production')
    environment: 'development',

    // Dynamic credentials (set by user input)
    credentials: {
        apiKey: null,
        coinId: null
    },

    // Environment-specific base URLs
    environments: {
        development: {
            baseUrl: 'https://dev.playsuper.club',
            storeUrl: 'https://dev-store.playsuper.club'
            // baseUrl: 'http://localhost:3000', // Local backend for development
            // storeUrl: 'http://localhost:3001' // Local store for development
        },
        production: {
            baseUrl: 'https://api.playsuper.club',
            storeUrl: 'https://store.playsuper.club'
        }
    },

    // Update credentials dynamically
    updateCredentials: function (apiKey, coinId) {
        this.credentials.apiKey = apiKey;
        this.credentials.coinId = coinId;
        console.log('PlaySuper credentials updated successfully');
    },

    // Get current API configuration
    getConfig: function () {
        const env = this.environments[this.environment];

        if (!this.credentials.apiKey || !this.credentials.coinId) {
            console.warn('PlaySuper credentials not set. Please configure them in the setup screen.');
            return null;
        }

        return {
            baseUrl: env.baseUrl,
            storeUrl: env.storeUrl,
            apiKey: this.credentials.apiKey,
            coinId: this.credentials.coinId,
            endpoints: {
                createPlayer: '/player/create-with-uuid',
                loginPlayer: '/player/login/federatedByStudio'
            }
        };
    },

    // Validate configuration
    isValid: function () {
        return this.credentials.apiKey &&
            this.credentials.coinId &&
            this.credentials.apiKey.length > 0 &&
            this.credentials.coinId.length > 0;
    },

    // Clear credentials (for security)
    clearCredentials: function () {
        this.credentials.apiKey = null;
        this.credentials.coinId = null;
        console.log('PlaySuper credentials cleared');
    },

    // Get environment info
    getEnvironment: function () {
        return {
            current: this.environment,
            available: Object.keys(this.environments),
            baseUrl: this.environments[this.environment].baseUrl
        };
    }
};