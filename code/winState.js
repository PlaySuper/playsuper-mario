/**
    State that's shown when the player wins the game!
    Code by Rob Kleffner, 2011
*/

Mario.WinState = function () {
    this.waitTime = 2;
    this.drawManager = null;
    this.camera = null;
    this.font = null;
    this.kissing = null;
    this.wasKeyDown = false;
    this.treasureChestShown = false;
    this.treasureDelay = 1.5; // Show treasure after 1.5 seconds
    this.treasureTimer = 0;
    this.levelCompleteRewards = null;
};

Mario.WinState.prototype = new Enjine.GameState();

Mario.WinState.prototype.Enter = function () {
    this.drawManager = new Enjine.DrawableManager();
    this.camera = new Enjine.Camera();

    this.font = Mario.SpriteCuts.CreateBlackFont();
    this.font.Strings[0] = { String: "Thank you for saving me, Mario!", X: 36, Y: 160 };

    this.kissing = new Enjine.AnimatedSprite();
    this.kissing.Image = Enjine.Resources.Images["endScene"];
    this.kissing.X = 112;
    this.kissing.Y = 52;
    this.kissing.SetColumnCount(2);
    this.kissing.SetRowCount(1);
    this.kissing.AddNewSequence("loop", 0, 0, 0, 1);
    this.kissing.PlaySequence("loop", true);
    this.kissing.FramesPerSecond = 1 / 2;

    this.waitTime = 2;
    this.treasureChestShown = false;
    this.treasureTimer = 0;

    this.drawManager.Add(this.font);
    this.drawManager.Add(this.kissing);

    // Generate level completion rewards
    this.generateLevelRewards();
};

Mario.WinState.prototype.Exit = function () {
    this.drawManager.Clear();
    delete this.drawManager;
    delete this.camera;
};

Mario.WinState.prototype.Update = function (delta) {
    this.drawManager.Update(delta);

    if (this.waitTime > 0) {
        this.waitTime -= delta;
    } else {
        // Update treasure chest timer
        if (!this.treasureChestShown) {
            this.treasureTimer += delta;
            if (this.treasureTimer >= this.treasureDelay) {
                this.showTreasureChest();
            }
        }

        if (Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
            this.wasKeyDown = true;
        }
    }
};

Mario.WinState.prototype.Draw = function (context) {
    this.drawManager.Draw(context, this.camera);
};

Mario.WinState.prototype.CheckForChange = function (context) {
    if (this.waitTime <= 0) {
        if (this.wasKeyDown && !Enjine.KeyboardInput.IsKeyDown(Enjine.Keys.S)) {
            context.ChangeState(new Mario.TitleState());
        }
    }
};

Mario.WinState.prototype.generateLevelRewards = function () {
    if (typeof Mario.treasureChest !== 'undefined' && Mario.treasureChest.generateLevelRewards) {
        // Calculate level performance bonus
        var timeBonus = Math.max(0, Mario.LevelState ? Mario.LevelState.TimeLeft : 0);
        var performanceScore = timeBonus > 10 ? 'excellent' : timeBonus > 5 ? 'good' : 'completed';

        this.levelCompleteRewards = Mario.treasureChest.generateLevelRewards(performanceScore);
    }
};

Mario.WinState.prototype.showTreasureChest = function () {
    if (this.treasureChestShown) return;

    this.treasureChestShown = true;

    if (typeof Mario.treasureChest !== 'undefined' && Mario.treasureChest.open) {
        Mario.treasureChest.open(this.levelCompleteRewards || [
            { type: 'coins', amount: 100, rarity: 'common' },
            { type: 'points', amount: 500, rarity: 'common' }
        ]);
    } else {
        // Fallback visual feedback
        console.log('Level completed! Rewards would be shown here.');
    }
};