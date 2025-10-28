/**
	Just create the global mario object.
	Code by Rob Kleffner, 2011
*/

var Mario = {};
Mario.GlobalMapState = null;

// Global coin balance display system
Mario.DrawCoinBalance = function (context, x, y) {
	// Default position if not specified
	if (typeof x === 'undefined') x = 10;
	if (typeof y === 'undefined') y = 10;

	// Only draw if:
	// 1. User has provided API credentials (has rewards enabled)
	// 2. PlaySuper integration is available and initialized
	// 3. All required dependencies are loaded
	if (window.playSuperCredentials &&
		Mario.playSuperIntegration &&
		Mario.playSuperIntegration.isInitialized &&
		typeof Mario.SpriteCuts !== 'undefined') {

		try {
			// Create font if it doesn't exist
			if (!Mario.coinBalanceFont) {
				Mario.coinBalanceFont = Mario.SpriteCuts.CreateYellowFont();
			}

			var balanceString = "COINS:" + Mario.playSuperIntegration.playerBalance;
			var textWidth = balanceString.length * 8 + 28; // Each char is ~8px + 28px padding

			// Draw rounded background box for better visibility
			context.fillStyle = 'rgba(0, 0, 0, 0.7)';
			context.beginPath();
			var boxX = x - 4;
			var boxY = y - 2;
			var boxWidth = textWidth;
			var boxHeight = 14;
			var radius = 4;

			context.moveTo(boxX + radius, boxY);
			context.lineTo(boxX + boxWidth - radius, boxY);
			context.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
			context.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
			context.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
			context.lineTo(boxX + radius, boxY + boxHeight);
			context.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
			context.lineTo(boxX, boxY + radius);
			context.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
			context.closePath();
			context.fill();

			// Draw the coin balance text
			Mario.coinBalanceFont.Strings[0] = { String: balanceString, X: x, Y: y };
			Mario.coinBalanceFont.Draw(context, { X: 0, Y: 0 }); // Use dummy camera

			console.log('Coin balance displayed:', Mario.playSuperIntegration.playerBalance);
		} catch (error) {
			console.log('DrawCoinBalance: Dependencies not ready yet', error.message);
		}
	} else {
		console.log('DrawCoinBalance: Skipped - no credentials or integration not ready');
	}
};