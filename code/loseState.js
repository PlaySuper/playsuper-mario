/**
    State shown when the player loses!
    Code by Rob Kleffner, 2011
*/

Mario.LoseState = function () {
    this.drawManager = null;
    this.camera = null;
    this.gameOver = null;
    this.font = null;
    this.wasKeyDown = false;
    this.discountCheckDelay = 2.5; // Wait 2.5 seconds before checking for discounts
    this.discountTimer = 0;
    this.discountOffered = false;
};

Mario.LoseState.prototype = new Enjine.GameState();

Mario.LoseState.prototype.Enter = function () {
    this.drawManager = new Enjine.DrawableManager();
    this.camera = new Enjine.Camera();

    this.gameOver = new Enjine.AnimatedSprite();
    this.gameOver.Image = Enjine.Resources.Images["gameOverGhost"];
    this.gameOver.SetColumnCount(9);
    this.gameOver.SetRowCount(1);
    this.gameOver.AddNewSequence("turnLoop", 0, 0, 0, 8);
    this.gameOver.PlaySequence("turnLoop", true);
    this.gameOver.FramesPerSecond = 1 / 15;
    this.gameOver.X = 112;
    this.gameOver.Y = 68;

    this.font = Mario.SpriteCuts.CreateBlackFont();
    this.font.Strings[0] = { String: "Game over!", X: 116, Y: 160 };
    this.font.Strings[1] = { String: "Press S to continue", X: 80, Y: 180 };

    // Reset discount state
    this.discountTimer = 0;
    this.discountOffered = false;

    this.drawManager.Add(this.font);
    this.drawManager.Add(this.gameOver);
};

Mario.LoseState.prototype.Exit = function () {
    this.drawManager.Clear();
    delete this.drawManager;
    delete this.camera;
    delete this.gameOver;
    delete this.font;
};

Mario.LoseState.prototype.Update = function (delta) {
    this.drawManager.Update(delta);

    // Handle discount system integration
    if (!this.discountOffered) {
        this.discountTimer += delta;
        if (this.discountTimer >= this.discountCheckDelay) {
            this.checkForDiscountOffer();
        }
    }

    if (Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
        this.wasKeyDown = true;
    }

    // Add 'R' key for retry with potential discount
    if (Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.R)) {
        this.handleRetryWithDiscount();
    }
};

Mario.LoseState.prototype.Draw = function (context) {
    this.drawManager.Draw(context, this.camera);
};

Mario.LoseState.prototype.CheckForChange = function (context) {
    if (this.wasKeyDown && !Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
        context.ChangeState(new Mario.TitleState());
    }
};

Mario.LoseState.prototype.checkForDiscountOffer = function () {
    this.discountOffered = true;

    // Check if discount system is available and can generate discount
    if (typeof Mario.discountSystem !== 'undefined' &&
        Mario.discountSystem.isInitialized &&
        Mario.discountSystem.canGenerateDiscount()) {

        console.log('LoseState: Checking for recovery discount offer...');

        // Add contextual message about possible discounts
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Looking for recovery options...", X: 60, Y: 200 };
        }

        // Slight delay to build anticipation
        setTimeout(() => {
            Mario.discountSystem.onPlayerDeath();
        }, 1000);
    } else {
        console.log('LoseState: No discount available or system not ready');

        // Show alternative message
        if (this.font.Strings.length < 3) {
            this.font.Strings[2] = { String: "Press R to retry!", X: 90, Y: 200 };
        }
    }
};

Mario.LoseState.prototype.handleRetryWithDiscount = function () {
    console.log('LoseState: Player wants to retry');

    // If discount system is available, show a special retry offer
    if (typeof Mario.discountSystem !== 'undefined' &&
        Mario.discountSystem.isInitialized) {

        // Show a quick retry discount if available
        Mario.discountSystem.generateDiscountCode()
            .then(discount => {
                console.log('Retry discount available:', discount);
                Mario.discountSystem.showDiscountModal(discount);
            })
            .catch(error => {
                console.log('No retry discount available:', error);
                // Just restart the level
                this.restartLevel();
            });
    } else {
        // No discount system, just restart
        this.restartLevel();
    }
};

Mario.LoseState.prototype.restartLevel = function () {
    console.log('LoseState: Restarting level...');

    // Reset Mario's state and restart the level
    if (typeof Mario.MarioCharacter !== 'undefined') {
        Mario.MarioCharacter.DeathTime = 0;
        Mario.MarioCharacter.WinTime = 0;
    }

    // Transition to level state (this might need adjustment based on level system)
    if (typeof Mario.LevelState !== 'undefined') {
        var app = Enjine.Application.Instance;
        if (app && app.stateContext) {
            app.stateContext.ChangeState(new Mario.LevelState());
        }
    }
};