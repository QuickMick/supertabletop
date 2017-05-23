/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
var Util = require("./../../core/util");

var CursorLibrary = require('./../resources/resources.json').cursors;
var ColorLibrary = require('./../resources/colors.json');

/**
 * Inherites PIXI.Container,
 * used to display all player cursors, and to poll input of the player of this instance.
 *
 * explanation:
 * the objects inside of this container do not have any inpact to the gameplay,
 * they are just displayed to give the player an idea of what the other players are doing
 */
class PlayerManager extends PIXI.Container {

    constructor() {
        super();
        /**
         * Contains all players
         * @type {object} --> id:sprite
         */
        this.players = {};
    }

    /**
     * @param @type {object} player_data {id,color,position,color,cursor_type}
     */
    addPlayer(player_data) {
        // load cursor from library and create sprite
        var cursor = CursorLibrary[cursor_type] || CursorLibrary["default"];
        this.players[player_data.id] = new PIXI.Sprite(PIXI.loader.resources[cursor.texture].texture);

        // set the anchor of the the cursor, depending on the texture defined in the json file
        this.players[player_data.id].anchor.x = cursor.anchor.x || 0;
        this.players[player_data.id].anchor.y = cursor.anchor.y || 0;

        //set the initial position of the player
        if (player_data.position) {
            this.players[player_data.id].position.x = player_data.x || 0;
            this.players[player_data.id].position.y = player_data.y || 0;
        }

        // set color if available otherwise take default color defined in json
        if (player_data.color) {
           /* var color = parseInt(player_data.color.replace("#", "0x"));
            color = !Number.isNaN(color)?color: parseInt(ColorLibrary.default_cursor);*/
            this.players[player_data.id].tint = Util.parseColor(player_data.color);
        }

        // finaly add the cursor to this container
        this.addChild(this.players[player_data.id]);
    };

    /**
     * changes the displayed image of the player
     * @param id of the player
     * @param cursor_type new cursortype
     */
    changeCursor(id,cursor_type){
        var cursor = CursorLibrary[cursor_type];
        if(!cursor){
            console.error("cursor not found: ",cursor_type);
            return;
        }
        this.players[id].texture = PIXI.loader.resources[cursor.texture].texture;

        // set the anchor of the the cursor, depending on the texture defined in the json file
        this.players[id].anchor.x = cursor.anchor.x || 0;
        this.players[id].anchor.y = cursor.anchor.y || 0;
    }

    /**
     * removes a player
     * @param @type{String} id of the player
     */
    removePlayer(id) {
        if (!this.players[id]) {
            console.error("player does not exist - id:", id);
            return;
        }

        this.removeChild(this.players[id]);
        delete this.players[id];
    }

}

/**
 * exports this module, implemented as singleton, because it is just needed exactly one time.
 * @type {PlayerManager}
 */
module.exports = new PlayerManager();