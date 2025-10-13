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

    // Centralized configuration for easier theming and tweaking
    this.config = {
        sectorColors: ['#D92518', '#F9A035', '#43B047', '#3498DB', '#F8D84A', '#8E44AD'],
        textColor: '#FFFFFF',
        borderColor: '#442416',
        arrowColor: '#F8D84A',
        font: 'bold 16px "Press Start 2P", monospace',
        placeholderFont: 'bold 24px "Press Start 2P", monospace',
        logoSize: 38,
        textRadiusFactor: 0.45,
        logoRadiusFactor: 0.65,
        starIndicator: {
            fill: '#F8D84A',
            stroke: '#F9A035',
            lineWidth: 2,
            outerRadius: 10,
            innerRadius: 4,
            points: 5
        },
        arrow: {
            height: 25,
            width: 20,
            lineWidth: 4,
            offsetY: 15
        },
        rim: {
            lineWidth: 10,
            offset: 5
        },
        centerHub: {
            outerRingFill: '#F9A035',
            innerRingFill: '#D92518',
            lineWidth: 4,
            outerRadius: 35,
            innerRadius: 25,
            dotRadius: 8
        }
    };

    console.log('🎲 Spin Wheel initialized with', this.rewards.length, 'rewards');
    this.createCanvas();
};

// ============= CANVAS SETUP & INITIALIZATION =============

Mario.SpinWheel.prototype.createCanvas = function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.context = this.canvas.getContext('2d');

    // Disable smoothing for a crisp, pixelated aesthetic
    this.context.imageSmoothingEnabled = false;

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

    // Calculate exact landing position for Flipkart - simple degrees approach
    const flipkartCenterAngle = giftCardPosition * sectorAngle + sectorAngle / 2;

    // Arrow points up at 270° (12 o'clock position)
    const arrowAngle = 270;

    // Calculate rotation needed: flipkartCenter + rotation = 270°
    let rotationNeeded = arrowAngle - flipkartCenterAngle;

    // Normalize to positive rotation (0-360 range)
    while (rotationNeeded <= 0) {
        rotationNeeded += 360;
    }
    while (rotationNeeded > 360) {
        rotationNeeded -= 360;
    }

    // Target rotation with dramatic spins
    this.targetRotation = this.rotation + (finalSpins * 360) + extraRotation + rotationNeeded;

    console.log('Flipkart at position:', giftCardPosition, 'of', this.rewards.length);
    console.log('Flipkart sector center angle:', flipkartCenterAngle + '°');
    console.log('Arrow angle:', arrowAngle + '°');
    console.log('Rotation needed:', rotationNeeded + '°');
    console.log('Final target rotation:', this.targetRotation + '° (landing on Flipkart at position', giftCardPosition, ')');

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
    const colorIndex = index % this.config.sectorColors.length;
    this.context.fillStyle = this.config.sectorColors[colorIndex];

    // Draw sector
    this.context.beginPath();
    this.context.moveTo(this.centerX, this.centerY);
    this.context.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
    this.context.closePath();
    this.context.fill();

    // Draw sector border
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = 2;
    this.context.stroke();

    this.context.restore();
};

/**
 * 🎁 Draw reward content (logo + text)
 */
Mario.SpinWheel.prototype.drawRewardContent = function (reward, angle, index) {
    // --- Custom Mario Aesthetic: Brand logo and brandName together, as in provided image ---
    const logoRadius = this.radius * this.config.logoRadiusFactor;
    const logoSize = this.config.logoSize;

    // Draw brand logo (if available) and brandName together, vertically aligned
    let brandLogoUrl = (reward.metadata && reward.metadata.brandLogoImage) ? reward.metadata.brandLogoImage : reward.logoUrl;
    let brandName = (reward.metadata && reward.metadata.brandName) ? reward.metadata.brandName : (reward.name || reward.title || 'Mystery Reward');

    // --- LOGO ---
    // Calculate position for the logo
    const logoX = this.centerX + Math.cos(angle) * logoRadius;
    const logoY = this.centerY + Math.sin(angle) * logoRadius;

    // Draw logo, rotated to match sector
    this.context.save();
    this.context.translate(logoX, logoY);
    this.context.rotate(angle + Math.PI / 2); // Rotate logo to be upright within sector
    if (brandLogoUrl) {
        this.drawBrandLogoAligned(brandLogoUrl, 0, 0, logoSize);
    } else {
        this.drawLogoPlaceholder(0, 0, logoSize);
    }
    this.context.restore();


    // --- TEXT ---
    // Draw brandName text curved below the logo
    const textRadius = this.radius * this.config.textRadiusFactor;
    this.drawCurvedBrandNameText(brandName, angle, textRadius);


    // Special indicator for gift card (guaranteed win) - check if this is the gift card position
    const giftCardPosition = this.guaranteedWinPosition !== undefined ? this.guaranteedWinPosition : 0;
    if (index === giftCardPosition && !this.spinning) {
        // Draw the indicator slightly outside the logo
        this.drawGiftCardIndicator(angle, logoRadius);
    }
};

/**
 * 🏢 Draw brand logo with actual image loading
 * Now properly displays the metadata.brandLogoImage from API
 */

// Draw brand logo at (x, y) relative to current context, with circular mask and border
Mario.SpinWheel.prototype.drawBrandLogoAligned = function (logoUrl, x, y, size) {
    if (!logoUrl) {
        this.drawLogoPlaceholder(x, y, size);
        return;
    }
    if (!this.logoImages) {
        this.logoImages = new Map();
    }
    const cachedImage = this.logoImages.get(logoUrl);
    if (cachedImage && cachedImage.complete) {
        // Draw circular mask for the logo
        this.context.save();
        this.context.beginPath();
        this.context.arc(x, y, size / 2, 0, 2 * Math.PI);
        this.context.clip();
        this.context.drawImage(cachedImage, x - size / 2, y - size / 2, size, size);
        this.context.restore();
        // Draw border
        this.context.save();
        this.context.strokeStyle = this.config.borderColor;
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.arc(x, y, size / 2, 0, 2 * Math.PI);
        this.context.stroke();
        this.context.restore();
    } else {
        this.drawLogoPlaceholder(x, y, size);
        if (!cachedImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.logoImages.set(logoUrl, img);
                this.render();
            };
            img.onerror = () => {
                console.warn('Failed to load brand logo:', logoUrl);
                this.logoImages.set(logoUrl, null);
            };
            this.logoImages.set(logoUrl, { complete: false });
            img.src = logoUrl;
        }
    }
};


// Draw placeholder logo at (x, y) relative to current context
Mario.SpinWheel.prototype.drawLogoPlaceholder = function (x, y, size) {
    this.context.save();
    this.context.beginPath();
    this.context.arc(x, y, size / 2, 0, 2 * Math.PI);
    this.context.fillStyle = 'rgba(255,255,255,0.9)';
    this.context.fill();
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = 2;
    this.context.stroke();
    // Draw a question mark for the placeholder
    this.context.fillStyle = this.config.borderColor;
    this.context.font = this.config.placeholderFont;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('?', x, y + 2);
    this.context.restore();
};


/**
 * ✍️ Draw brandName text along a curve for the retro game aesthetic
 * This ensures the text is not truncated and follows the wheel's curve.
 */
Mario.SpinWheel.prototype.drawCurvedBrandNameText = function (text, angle, radius) {
    this.context.save();
    this.context.font = this.config.font;
    this.context.fillStyle = this.config.textColor;
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = 4;
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';

    // Move to the center of the wheel to establish a rotation point
    this.context.translate(this.centerX, this.centerY);

    // Spread the text across an angle of about 60 degrees in the sector
    const arc = Math.PI / 3;
    const totalAngle = text.length > 1 ? arc : 0;
    const startAngle = angle - totalAngle / 2;

    for (let i = 0; i < text.length; i++) {
        const charAngle = startAngle + (i / (text.length - 1)) * totalAngle;
        const x = Math.cos(charAngle) * radius;
        const y = Math.sin(charAngle) * radius;

        this.context.save();
        this.context.translate(x, y);
        this.context.rotate(charAngle + Math.PI / 2); // Orient character upright

        // Draw outline and then the character
        this.context.strokeText(text[i], 0, 0);
        this.context.fillText(text[i], 0, 0);
        this.context.restore();
    }

    this.context.restore();
};


// 🎁 Special indicator for guaranteed gift card
Mario.SpinWheel.prototype.drawGiftCardIndicator = function (angle, radius) {
    const indicatorX = this.centerX + Math.cos(angle) * (radius + 25);
    const indicatorY = this.centerY + Math.sin(angle) * (radius + 25);

    this.context.save();
    this.context.translate(indicatorX, indicatorY);
    this.context.rotate(angle + Math.PI / 2); // Rotate star to align with sector

    // Draw golden star indicator - now more vibrant
    const starConfig = this.config.starIndicator;
    this.context.fillStyle = starConfig.fill;
    this.context.strokeStyle = starConfig.stroke;
    this.context.lineWidth = starConfig.lineWidth;

    this.drawStar(0, 0, starConfig.outerRadius, starConfig.innerRadius, starConfig.points);
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
        // Correct angle calculation to make the star point upwards
        const angle = (i * Math.PI) / points - (Math.PI / 2);
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
    const hubConfig = this.config.centerHub;
    // Outer ring (like a Mario block)
    this.context.fillStyle = hubConfig.outerRingFill;
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = hubConfig.lineWidth;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, hubConfig.outerRadius, 0, 2 * Math.PI);
    this.context.fill();
    this.context.stroke();

    // Inner ring
    this.context.fillStyle = hubConfig.innerRingFill;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, hubConfig.innerRadius, 0, 2 * Math.PI);
    this.context.fill();

    // Center dot (like a bolt)
    this.context.fillStyle = this.config.borderColor;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, hubConfig.dotRadius, 0, 2 * Math.PI);
    this.context.fill();
};

/**
 * 🎯 Draw the pointing arrow (always points up)
 */
Mario.SpinWheel.prototype.drawArrow = function () {
    this.context.save();
    const arrowConfig = this.config.arrow;

    // Position arrow at top center, pointing down to wheel
    const arrowX = this.centerX;
    const arrowY = this.centerY - this.radius - arrowConfig.offsetY;

    this.context.fillStyle = this.config.arrowColor;
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = arrowConfig.lineWidth;

    // Draw chunky, simple arrow shape
    this.context.beginPath();
    this.context.moveTo(arrowX, arrowY + arrowConfig.height); // Tip
    this.context.lineTo(arrowX - arrowConfig.width, arrowY); // Left corner
    this.context.lineTo(arrowX + arrowConfig.width, arrowY); // Right corner
    this.context.closePath();

    this.context.fill();
    this.context.stroke();

    this.context.restore();
};

/**
 * 🌟 Draw outer decorative rim
 */
Mario.SpinWheel.prototype.drawOuterRim = function () {
    const rimConfig = this.config.rim;
    // Outer decorative ring
    this.context.strokeStyle = this.config.borderColor;
    this.context.lineWidth = rimConfig.lineWidth;
    this.context.beginPath();
    this.context.arc(this.centerX, this.centerY, this.radius + rimConfig.offset, 0, 2 * Math.PI);
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
    const normalizedRotation = (this.rotation % 360 + 360) % 360; // Ensure positive
    const sectorAngle = 360 / this.rewards.length;

    // Arrow is stationary at 270°. Find which sector contains this position after rotation.
    // After rotation, sector i spans from (i * sectorAngle + rotation) to ((i+1) * sectorAngle + rotation)
    // We need to find which sector contains 270°
    const arrowAngle = 270;

    // Find the angle relative to the rotated wheel
    const relativeAngle = (arrowAngle - normalizedRotation + 360) % 360;

    // Determine which sector this angle falls into
    let winningIndex = Math.floor(relativeAngle / sectorAngle);

    // Handle edge case where we're exactly on a boundary
    if (winningIndex >= this.rewards.length) {
        winningIndex = 0;
    }

    const giftCardPosition = this.guaranteedWinPosition !== undefined ? this.guaranteedWinPosition : 0;

    console.log('Final rotation:', this.rotation + '°');
    console.log('Normalized rotation:', normalizedRotation + '°');
    console.log('Arrow angle:', arrowAngle + '°');
    console.log('Relative angle on wheel:', relativeAngle + '°');
    console.log('Sector angle:', sectorAngle + '°');
    console.log('Calculated winning index:', winningIndex);
    console.log('Expected Flipkart position:', giftCardPosition);

    if (winningIndex !== giftCardPosition) {
        console.warn(`⚠️ Math mismatch: arrow points to sector ${winningIndex} but Flipkart is at ${giftCardPosition}. Ensuring Flipkart win...`);
        winningIndex = giftCardPosition;
    }

    console.log('🏆 Final winning reward at position:', winningIndex, this.rewards[winningIndex].name);
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

    // Shuffle rewards visually
    const shuffledRewards = [...rewards];
    for (let i = shuffledRewards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledRewards[i], shuffledRewards[j]] = [shuffledRewards[j], shuffledRewards[i]];
    }

    // Find the index of the reward with brandName 'flipkart' (case-insensitive)
    const flipkartIndex = shuffledRewards.findIndex(reward => {
        if (reward.metadata && reward.metadata.brandName) {
            return reward.metadata.brandName.toLowerCase() === 'flipkart';
        }
        if (reward.name) {
            return reward.name.toLowerCase() === 'flipkart';
        }
        return false;
    });

    if (flipkartIndex === -1) {
        console.error('❌ No reward with brandName "flipkart" found! The wheel will not guarantee flipkart win.');
    }

    // Always set guaranteedWinPosition to flipkartIndex (if found), else fallback to 0
    const guaranteedWinPosition = flipkartIndex !== -1 ? flipkartIndex : 0;

    console.log('🎲 Creating spin wheel with', shuffledRewards.length, 'shuffled rewards');
    console.log('🎯 Flipkart positioned at segment:', guaranteedWinPosition);

    const spinWheel = new Mario.SpinWheel(shuffledRewards);
    spinWheel.guaranteedWinPosition = guaranteedWinPosition;
    return spinWheel;
};

console.log('🎲✨ Spin Wheel component ready for epic daily rewards!');