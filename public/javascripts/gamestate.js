
/**
 * Created by Mick on 23.05.2017.
 *
 * Constains current shared global values, describing the current state of the game
 */
class GameState{
    constructor(){
        /**
         * {String} ID of the current user
         */
        this.USER_ID=null;

        /**
         * true, when the camera is moving,
         * otherwise false.
         *
         */
        this._camera_grabbed=false;

        /**
         * Contains all selected entities, which will be
         * get affected by the user input
         */
        this._selected_entities=[];
    }

    /**
     * camera loses grab if an entity is selected
     * @returns {boolean}
     * @constructor
     */
    get CAMERA_GRABBED(){
        if((this._selected_entities||[]).length >0) return false;
        return this._camera_grabbed;
    }

    set CAMERA_GRABBED(v){
        this._camera_grabbed = v;
    }

    get SELECTED_ENTITIES(){
        return this._selected_entities;
    }

    set SELECTED_ENTITIES(v){
        this._selected_entities = v || [];
    }


}

module.exports = new GameState();