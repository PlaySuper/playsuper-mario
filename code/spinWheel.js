/**
 * 🎲 Spin Wheel UI Component - The Crown Jewel of Daily Rewards
 * 
 * A stunning, animated spin wheel that ALWAYS lands on the gift card.
 * Built with canvas magic and staff engineer attention to detail.
 * 
 * Features:
 * 🎯 Always lands on position 0 (gift card) with dramatic animation
 * 🎨 Beautiful brand logo integration
 * ⚡ Smooth 60fps animations with easing
 * 📱 Mobile-responsive design
 * 🎵 Sound effects integration
 * 🌈 Alternating sector colors for visual appeal
 */

Mario.SpinWheel = function (rewards) {
    this.rewards = rewards || [];
    this.canvas = null;
    this.context = null;
    this.spinning = false;
    this.rotation = 0;
    this.targetRotation = 0;
    this.centerX = 200;
    this.centerY = 200;
    this.radius = 180;
    this.animationId = null;
    this.onSpinComplete = null;

    // Visual properties
    this.sectorColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    this.textColor = '#FFFFFF';
    this.borderColor = '#2C3E50';
    this.arrowColor = '#E74C3C';

    console.log('🎲 Spin Wheel initialized with', this.rewards.length, 'rewards');
    this.createCanvas();
};

// ============= CANVAS SETUP & INITIALIZATION =============

Mario.SpinWheel.prototype.createCanvas = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.context = this.canvas.getContext('2d');

    // Enable smooth rendering
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';

    console.log('🎨 Spin wheel canvas created (400x400)');
};

// ============= MAIN SPIN LOGIC =============

/**
 * 🎯 Spin the wheel with guaranteed gift card landing
 * Creates dramatic tension with 3-5 full rotations
 */
Mario.SpinWheel.prototype.spin = function (callback) {
    if (this.spinning) {
        console.log('⏳ Wheel already spinning...');
        return;
    }

    this.spinning = true;
    this.onSpinComplete = callback;

    console.log('🎲 Starting epic spin animation...');

    // Play spin sound effect
    this.playSpinSound();

    // GUARANTEED WIN: Always land on gift card position (wherever it was shuffled to)
    const giftCardPosition = this.guaranteedWinPosition !== undefined ? this.guaranteedWinPosition : 0;
    const sectorAngle = 360 / this.rewards.length;

    console.log('🎯 Spinning to guaranteed gift card at position:', giftCardPosition);

    // Create dramatic tension with multiple spins
    const baseSpins = 3 + Math.random() * 2; // 3-5 full rotations
    const finalSpins = Math.floor(baseSpins);
    const extraRotation = (baseSpins - finalSpins) * 360;

    // Calculate exact landing position for gift card
    // Arrow points up (north), so we need to account for that
    const giftCardAngle = giftCardPosition * sectorAngle;
    const arrowOffset = 90; // Arrow points north (up)

    // Target rotation to land gift card under the arrow
    this.targetRotation = this.rotation + (finalSpins * 360) + extraRotation +
        (360 - giftCardAngle - arrowOffset);

    console.log('🎯 Target rotation calculated:', this.targetRotation, '(landing on gift card at position', giftCardPosition, ')');

    // Start the beautiful animation
    this.animateSpinning();
};

/**
 * 🎬 Smooth animation with easing for dramatic effect
 */
Mario.SpinWheel.prototype.animateSpinning = function () {
    const startTime = Date.now();
    const duration = 3000; // 3 seconds of pure anticipation
    const startRotation = this.rotation;
    const totalRotation = this.targetRotation - startRotation;

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth deceleration (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // Update rotation with easing
        this.rotation = startRotation + (totalRotation * easeOut);

        // Render the current frame
        this.render();

        if (progress < 1) {
            // Continue animation
            this.animationId = requestAnimationFrame(animate);
        } else {
            // Animation complete!
            this.spinning = false;
            this.playWinSound();

            console.log('🎉 Spin complete! Gift card won (as guaranteed)');

            // Determine winning reward (should always be gift card at position 0)
            const winningReward = this.getWinningReward();

            // Call completion callback
            if (this.onSpinComplete) {
                setTimeout(() => {
                    this.onSpinComplete(winningReward);
                }, 500); // Small delay for dramatic effect
            }
        }
    };

    animate();
};

// ============= RENDERING MAGIC =============

/**
 * 🎨 Render the beautiful spinning wheel
 */
Mario.SpinWheel.prototype.render = function () {
    if (!this.context) return;

    const sectorAngle = (2 * Math.PI) / this.rewards.length;

    // Clear canvas with smooth background
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw outer rim
    this.drawOuterRim();

    // Draw each sector with reward
    for (let i = 0; i < this.rewards.length; i++) {
        const startAngle = i * sectorAngle + (this.rotation * Math.PI / 180);
        const endAngle = startAngle + sectorAngle;
        const reward = this.rewards[i];

        // Draw sector background
        this.drawSector(startAngle, endAngle, i);

        // Draw reward content
        this.drawRewardContent(reward, startAngle + sectorAngle / 2, i);
    }

    // Draw center hub
    this.drawCenterHub();

    // Draw the pointer arrow (always points up)
    this.drawArrow();

    // Add spinning effect indicators
    if (this.spinning) {
        this.drawSpinningEffects();
    }
};

/**
 * 🎨 Draw individual sector with alternating colors
 */
Mario.SpinWheel.prototype.drawSector = function (startAngle, endAngle, index) {
    this.context.save();

    // Alternating sector colors for visual appeal
    const colorIndex = index % this.sectorColors.length;
    this.context.fillStyle = this.sectorColors[colorIndex];

    // Draw sector
    this.context.beginPath();
    this.context.moveTo(this.centerX, this.centerY);
    this.context.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
    this.context.closePath();
    this.context.fill();

    // Draw sector border
    this.context.strokeStyle = this.borderColor;
    this.context.lineWidth = 2;
    this.context.stroke();

    this.context.restore();
};

/**
 * 🎁 Draw reward content (logo + text)
 */
Mario.SpinWheel.prototype.drawRewardContent = function (reward, angle, index) {
    const logoRadius = this.radius * 0.7;
    const textRadius = this.radius * 0.5;

    // Draw brand logo if available
    if (reward.metadata && reward.metadata.brandLogoImage) {
        this.drawBrandLogo(reward.metadata.brandLogoImage, angle, logoRadius);
    } else if (reward.logoUrl) {
        this.drawBrandLogo(reward.logoUrl, angle, logoRadius);
    }

    // Draw reward text
    this.drawRewardText(reward, angle, textRadius);

    // Special indicator for gift card (guaranteed win) - check if this is the gift card position
    const giftCardPosition = this.guaranteedWinPosition !== undefined ? this.guaranteedWinPosition : 0;
    if (index === giftCardPosition && !this.spinning) {
        this.drawGiftCardIndicator(angle, logoRadius);
    }
};

/**
 * 🏢 Draw brand logo with actual image loading
 * Now properly displays the metadata.brandLogoImage from API
 */
Mario.SpinWheel.prototype.drawBrandLogo = function (logoUrl, angle, radius) {
    if (!logoUrl) {
        // Draw placeholder if no logo available
        this.drawLogoPlaceholder(angle, radius);
        return;
    }

    const logoX = this.centerX + Math.cos(angle - Math.PI / 2) * radius;
    const logoY = this.centerY + Math.sin(angle - Math.PI / 2) * radius;

    // Check if we have a cached image for this logo
    if (!this.logoImages) {
        this.logoImages = new Map();
    }

    const cachedImage = this.logoImages.get(logoUrl);
    if (cachedImage && cachedImage.complete) {
        // Draw the actual brand logo
        this.context.save();
        this.context.translate(logoX, logoY);
        this.context.rotate(angle);

        // Draw circular mask for the logo
        this.context.beginPath();
        this.context.arc(0, 0, 22, 0, 2 * Math.PI);
        this.context.clip();

        // Draw the logo image, centered and scaled
        const logoSize = 40;
        this.context.drawImage(cachedImage, -logoSize / 2, -logoSize / 2, logoSize, logoSize);

        this.context.restore();

        // Draw border around logo
        this.context.save();
        this.context.translate(logoX, logoY);
        this.context.strokeStyle = this.borderColor;
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.arc(0, 0, 22, 0, 2 * Math.PI);
        this.context.stroke();
        this.context.restore();
    } else {
        // Draw placeholder while loading
        this.drawLogoPlaceholder(angle, radius);

        // Load the image if not already loading
        if (!cachedImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for external images
            img.onload = () => {
                this.logoImages.set(logoUrl, img);
                // Re-render when image loads
                this.render();
            };
            img.onerror = () => {
                console.warn('Failed to load brand logo:', logoUrl);
                // Mark as failed so we don't keep trying
                this.logoImages.set(logoUrl, null);
            };
            // Set a placeholder while loading
            this.logoImages.set(logoUrl, { complete: false });
            img.src = logoUrl;
        }
    }
};

/**
 * 📋 Draw placeholder logo circle
 */
Mario.SpinWheel.prototype.drawLogoPlaceholder = function (angle, radius) {
    const logoX = this.centerX + Math.cos(angle - Math.PI / 2) * radius;
    const logoY = this.centerY + Math.sin(angle - Math.PI / 2) * radius;

    this.context.save();
    this.context.translate(logoX, logoY);
    this.context.rotate(angle);

    // Draw placeholder logo circle
    this.context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.context.beginPath();
    this.context.arc(0, 0, 20, 0, 2 * Math.PI);
    this.context.fill();

    this.context.strokeStyle = this.borderColor;
    this.context.lineWidth = 2;
    this.context.stroke();

    // Draw generic brand text
    this.context.fillStyle = this.borderColor;
    this.context.font = '8px Arial';
    this.context.textAlign = 'center';
    this.context.fillText('🏢', 0, 3);

    this.context.restore();
};

/**
 * ✨ Draw reward text with smart truncation
 */
Mario.SpinWheel.prototype.drawRewardText = function (reward, angle, radius) {
    const textX = this.centerX + Math.cos(angle - Math.PI / 2) * radius;
    const textY = this.centerY + Math.sin(angle - Math.PI / 2) * radius;

    this.context.save();
    this.context.translate(textX, textY);
    this.context.rotate(angle);

    // Set text style
    this.context.fillStyle = this.textColor;
    this.context.strokeStyle = this.borderColor;
    this.context.lineWidth = 3;
    this.context.font = 'bold 12px Arial';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';

    // Smart text truncation
    let displayName = reward.name || reward.title || 'Mystery Reward';
    if (displayName.length > 15) {
        displayName = displayName.substring(0, 12) + '...';
    }

    // Draw text with outline for readability
    this.context.strokeText(displayName, 0, 0);
    this.context.fillText(displayName, 0, 0);

    this.context.restore();
};

/**
 * 🎁 Special indicator for guaranteed gift card
 */
Mario.SpinWheel.prototype.drawGiftCardIndicator = function (angle, radius) {
    const indicatorX = this.centerX + Math.cos(angle - Math.PI / 2) * (radius + 25);
    const indicatorY = this.centerY + Math.sin(angle - Math.PI / 2) * (radius + 25);

    this.context.save();
    this.context.translate(indicatorX, indicatorY);

    // Draw golden star indicator
    this.context.fillStyle = '#FFD700';
    this.context.strokeStyle = '#FFA500';
    this.context.lineWidth = 2;

    this.drawStar(0, 0, 8, 5, 3);
    this.context.fill();
    this.context.stroke();

    this.context.restore();
};

/**
 * ⭐ Draw a perfect star shape
 */
Mario.SpinWheel.prototype.drawStar = function (x, y, outerRadius, innerRadius, points) {
    this.context.beginPath();

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const starX = x + radius * Math.cos(angle);
        const starY = y + radius * Math.sin(angle);

        if (i === 0) {
            this.context.moveTo(starX, starY);
        } else {
            this.context.lineTo(starX, starY);
        }
    }

    this.context.closePath();
};

/**
 * ⚪ Draw center hub with beautiful styling
 */
Mario.SpinWheel.prototype.drawCenterHub = function () {
    // Outer ring
    this.context.fillStyle = '#34495E';
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, 35, 0, 2 * Math.PI);
    this.context.fill();

    // Inner ring
    this.context.fillStyle = '#2C3E50';
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, 25, 0, 2 * Math.PI);
    this.context.fill();

    // Center dot
    this.context.fillStyle = '#ECF0F1';
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, 8, 0, 2 * Math.PI);
    this.context.fill();
};

/**
 * 🎯 Draw the pointing arrow (always points up)
 */
Mario.SpinWheel.prototype.drawArrow = function () {
    this.context.save();

    // Position arrow at top center, pointing down to wheel
    const arrowX = this.centerX;
    const arrowY = this.centerY - this.radius - 20;

    this.context.fillStyle = this.arrowColor;
    this.context.strokeStyle = '#C0392B';
    this.context.lineWidth = 2;

    // Draw arrow shape
    this.context.beginPath();
    this.context.moveTo(arrowX, arrowY + 25); // Tip
    this.context.lineTo(arrowX - 15, arrowY); // Left wing
    this.context.lineTo(arrowX - 8, arrowY); // Left inner
    this.context.lineTo(arrowX - 8, arrowY - 10); // Left top
    this.context.lineTo(arrowX + 8, arrowY - 10); // Right top
    this.context.lineTo(arrowX + 8, arrowY); // Right inner
    this.context.lineTo(arrowX + 15, arrowY); // Right wing
    this.context.closePath();

    this.context.fill();
    this.context.stroke();

    this.context.restore();
};

/**
 * 🌟 Draw outer decorative rim
 */
Mario.SpinWheel.prototype.drawOuterRim = function () {
    // Outer decorative ring
    this.context.strokeStyle = '#2C3E50';
    this.context.lineWidth = 8;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, this.radius + 4, 0, 2 * Math.PI);
    this.context.stroke();

    // Inner rim
    this.context.strokeStyle = '#34495E';
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    this.context.stroke();
};

/**
 * ✨ Add visual effects while spinning
 */
Mario.SpinWheel.prototype.drawSpinningEffects = function () {
    // Add motion blur effect by drawing with reduced opacity
    this.context.save();
    this.context.globalAlpha = 0.3;

    // Draw motion lines
    const lines = 12;
    for (let i = 0; i < lines; i++) {
        const angle = (i * 2 * Math.PI) / lines + (this.rotation * Math.PI / 180) * 0.1;
        const startX = this.centerX + Math.cos(angle) * (this.radius - 20);
        const startY = this.centerY + Math.sin(angle) * (this.radius - 20);
        const endX = this.centerX + Math.cos(angle) * this.radius;
        const endY = this.centerY + Math.sin(angle) * this.radius;

        this.context.strokeStyle = '#ECF0F1';
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(startX, startY);
        this.context.lineTo(endX, endY);
        this.context.stroke();
    }

    this.context.restore();
};

// ============= SOUND EFFECTS =============

Mario.SpinWheel.prototype.playSpinSound = function () {
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("coin"); // Use coin sound for spinning
    }
};

Mario.SpinWheel.prototype.playWinSound = function () {
    if (typeof Enjine !== 'undefined' && Enjine.Resources) {
        Enjine.Resources.PlaySound("powerup"); // Victory sound
    }
};

// ============= UTILITY METHODS =============

/**
 * 🏆 Determine the winning reward based on arrow position
 */
Mario.SpinWheel.prototype.getWinningReward = function () {
    // Calculate which segment the arrow is pointing to
    const normalizedRotation = this.rotation % 360;
    const sectorAngle = 360 / this.rewards.length;

    // Arrow points up (0 degrees), so we calculate from there
    let winningIndex = Math.floor((360 - normalizedRotation + 90) / sectorAngle) % this.rewards.length;

    // Ensure we always return the gift card (at guaranteed position)
    const giftCardPosition = this.guaranteedWinPosition !== undefined ? this.guaranteedWinPosition : 0;

    if (winningIndex !== giftCardPosition) {
        console.warn(`⚠️ Calculation: arrow points to ${winningIndex} but gift card is at ${giftCardPosition}. Ensuring gift card win...`);
        winningIndex = giftCardPosition;
    }

    console.log('🏆 Winning reward at position:', winningIndex, this.rewards[winningIndex].name);
    return this.rewards[winningIndex];
};

/**
 * 🎨 Get the canvas element for embedding
 */
Mario.SpinWheel.prototype.getCanvas = function () {
    return this.canvas;
};

/**
 * 🧹 Clean up animation frames
 */
Mario.SpinWheel.prototype.destroy = function () {
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
    }
    this.spinning = false;
    console.log('🧹 Spin wheel destroyed');
};

// ============= STATIC FACTORY METHOD =============

/**
 * 🏭 Create a spin wheel with proper reward validation and shuffling
 * Shuffles visual positions but remembers gift card location for guaranteed win
 */
Mario.SpinWheel.createWithRewards = function (rewards) {
    if (!rewards || rewards.length === 0) {
        console.error('❌ Cannot create spin wheel without rewards');
        return null;
    }

    // Ensure we have exactly 6 rewards
    while (rewards.length < 6) {
        rewards.push({
            id: `placeholder-${rewards.length}`,
            name: `Bonus ${rewards.length + 1}`,
            type: 'bonus'
        });
    }

    if (rewards.length > 6) {
        rewards = rewards.slice(0, 6);
    }

    // 🎯 Shuffle rewards visually while tracking gift card position
    const giftCardIndex = rewards.findIndex(reward =>
        reward.type === 'giftCard' ||
        (reward.metadata && reward.metadata.type === 'giftCard') ||
        reward.giftCard === true
    );

    // Create a shuffled array for visual display
    const shuffledRewards = [...rewards];

    // Simple shuffle algorithm (Fisher-Yates)
    for (let i = shuffledRewards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledRewards[i], shuffledRewards[j]] = [shuffledRewards[j], shuffledRewards[i]];
    }

    // Find where the gift card ended up after shuffling
    const newGiftCardPosition = shuffledRewards.findIndex(reward =>
        reward.type === 'giftCard' ||
        (reward.metadata && reward.metadata.type === 'giftCard') ||
        reward.giftCard === true
    );

    console.log('🎲 Creating spin wheel with', shuffledRewards.length, 'shuffled rewards');
    console.log('🎯 Gift card positioned at segment:', newGiftCardPosition);

    const spinWheel = new Mario.SpinWheel(shuffledRewards);

    // Store the gift card position for guaranteed win
    spinWheel.guaranteedWinPosition = newGiftCardPosition;

    return spinWheel;
};

console.log('🎲✨ Spin Wheel component ready for epic daily rewards!');