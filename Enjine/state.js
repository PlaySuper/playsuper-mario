/**
    Simple State pattern implementation for game states.
    Code by Rob Kleffner, 2011
*/

Enjine.GameStateContext = function (defaultState) {
    this.State = null;

    if (defaultState != null) {
        this.State = defaultState;
        this.State.Enter();
    }
};

Enjine.GameStateContext.prototype = {
    ChangeState: function (newState) {
        if (this.State != null) {
            this.State.Exit();
        }
        this.State = newState;
        this.State.Enter();

        // Notify mobile controls of state change for responsive UI updates
        if (window.Mario && Mario.mobileControls && Mario.mobileControls.isEnabled) {
            // Use setTimeout to ensure state is fully initialized before checking
            setTimeout(() => {
                console.log('🎮 State change detected, updating mobile controls for:', newState?.constructor?.name || 'unknown state');
                Mario.mobileControls.checkAndUpdateScreen();

                // Dispatch a custom event to signal state change
                document.dispatchEvent(new CustomEvent('stateChanged'));
            }, 25); // Even shorter delay for faster response
        }
    },

    Update: function (delta) {
        this.State.CheckForChange(this);
        this.State.Update(delta);
    },

    Draw: function (context) {
        this.State.Draw(context);
    }
};

/**
 * Base game state class to at least ensure that all the functions exist.
 */
Enjine.GameState = function () { }

Enjine.GameState.prototype = {
    Enter: function () { },
    Exit: function () { },
    Update: function (delta) { },
    Draw: function (context) { },
    CheckForChange: function (context) { }
};