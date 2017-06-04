/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
var Util = require("./../../core/util");
const Ticks = require('./../../core/ticks.json');
const Packages = require('./../../core/packages');

var CursorLibrary = require('./../resources/resources.json').cursors.content;


var EVT_COLOR_CHANGES='colorchanged';
var EVT_PLAYER_INDEX_CHANGED='playerindexchanged';
var EVT_PLAYER_DISCONNECTED ='playerdisconnected';
var EVT_PLAYER_CONNECTED ='playerconnected';
/**
 * Inherites PIXI.Container,
 * used to display all player cursors, and to poll input of the player of this instance.
 *
 * explanation:
 * the objects inside of this container do not have any inpact to the gameplay,
 * they are just displayed to give the player an idea of what the other players are doing
 */
class PlayerManager extends PIXI.Container {

    constructor(lerpManager, cursorManager, inputHandler,gameTable) {
        super();

        this.lerpManager = lerpManager;
        this.cursorManager = cursorManager;

        /**
         * Contains all players
         * @type {object} --> id:sprite
         */
        this.players = {};

        /**
         * holds the player reference of the current player,
         * it is also available in the players hashmap
         * @type {pbject}
         */
    /*    this.currentPlayer = null;

        this.gameTable = gameTable;
        inputHandler.on("rawmousemove",this._processPlayerInput.bind(this));*/


        /**
         * contains the player assignedPlayerIndexes aka seats, false means,
         * the seat is free, otherwise the id of the player will be put in the cell,
         * if an ID is in an array cell instead of "false" this means, the seat was taken by a user
         * @type {boolean[]}
         */
        this.assignedPlayerIndexes=[];
        for(var i=0; i< Ticks.MAX_PLAYERS;i++){
            this.assignedPlayerIndexes.push(false);
        }


        this.assignedColors = {};
    }

    getAssignments(){
        return{
            indexes:this.assignedPlayerIndexes,
            colors:this.assignedColors
        }
    }

    /**
     * updates the players position
     * @param evt
     * @private
     */
   /* _processPlayerInput(evt){
        if(!this.currentPlayer) return;
        var localPos = evt.data.getLocalPosition(this.gameTable);

        this.currentPlayer.position.x = localPos.x;
        this.currentPlayer.position.y = localPos.y;
    }
*/
    /**
     * @param @type {aarray} player_data [{id,color,position,color,cursor_type}]
     */
    addPlayers(players) {
        players = [].concat(players);
        for(var i=0; i<players.length;i++) {
            let player_data = players[i];
            // load cursor from library and create sprite
            var cursor = CursorLibrary[player_data.cursor] || CursorLibrary["default"];
            this.players[player_data.id] = new PIXI.Sprite(PIXI.loader.resources[cursor.texture].texture);
            this.players[player_data.id].rawPlayerData = player_data;
            // set the anchor of the the cursor, depending on the texture defined in the json file
            this.players[player_data.id].anchor.x = cursor.anchor.x || 0;
            this.players[player_data.id].anchor.y = cursor.anchor.y || 0;
            this.players[player_data.id].playerIndex = player_data.playerIndex;
            this.players[player_data.id].PLAYER_ID = player_data.id;

            // assing the seat, if player already has chosen one
            if(player_data.playerIndex >=0){
                this.assignedPlayerIndexes[player_data.playerIndex] = player_data.id;
            }


            //set the initial position of the player
            if (player_data.position) {
                this.players[player_data.id].position.x = player_data.x || 0;
                this.players[player_data.id].position.y = player_data.y || 0;
            }

            // set color if available otherwise take default color defined in json
            if (player_data.color) {
                /* var color = parseInt(player_data.color.replace("#", "0x"));
                 color = !Number.isNaN(color)?color: parseInt(ColorLibrary.default_cursor);*/
                var color = Util.parseColor(player_data.color);
                this.players[player_data.id].tint = color;

                // assign color, if player has already chosen one
                this.assignedColors[color] = player_data.id;
            }

            // finaly add the cursor to this container
            this.addChild(this.players[player_data.id]);
            console.info(player_data.id,"connected");

            this.emit(EVT_PLAYER_CONNECTED,{id:player_data.id,player:this.players[player_data.id]});
        }
    }

    initCurrentPlayer(data){
        if(!data){
            console.error("cannot init player without data");
            return;
        }
        this.players[data.id] ={
            rawPlayerData:data,
            isCurrentPlayer: true
        };
        this.cursorManager.setCursor(data.cursor);
    }

    /**
     * updates a value of a player
     * @param evt
     */
    updatePlayerValue(id,changes){

        if(!changes || changes.length <= 0){
            console.log("no changes passed!");
            return;
        }

        if(!this.players[id]){
            console.log("updatePlayerValue: player not found",id);
            return;
        }
        for(var i=0; i<changes.length;i++){
            var key = changes[i].key;
            var value = changes[i].value;

            if(!key){
                console.log("updatePlayerValue: no key passed");
                return;
            }

            switch(key){
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR:
                    if(this.players[id].tint == value) return;  // return if there is no change

                    var old = this.players[id].tint;
                    var newColor =Util.parseColor(value);
                    this.players[id].tint = value;

                    this.assignedColors[newColor] = id;

                    if(this.assignedColors[old]){
                        delete this.assignedColors[old];
                    }

                    // emit color change event
                    this.emit(EVT_COLOR_CHANGES,{
                        player:this.players[id],
                        oldColor:old,
                        newColor:newColor
                    });
                    return;

                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.PLAYER_INDEX:
                    if(this.players[id].playerIndex == value) return;  // return if there is no change

                    var old =this.players[id].playerIndex;
                    this.players[id].playerIndex = value;

                    // assign seat
                    this.assignedPlayerIndexes[value] = id;

                    //if seat was changed, releas old one
                    if(old >=0){
                        this.assignedPlayerIndexes[value] = false;
                    }

                    // emit index change event
                    this.emit(EVT_PLAYER_INDEX_CHANGED,{
                        player:this.players[id],
                        oldPlayerIndex:old,
                        newPlayerIndex:value
                    });
                    return;
            }
        }
    }

    /**
     * changes the displayed image of a player
     * @param id of the player
     * @param cursor_type new cursortype
     */
    changeCursor(playerID,cursor_type){
        if(!playerID || !playerID.length || playerID.length <=0){
            console.warn("no player id passed");
            return;
        }

        if(!this.players[playerID]){
            console.warn("player",playerID,"does not exist! cursor cannot get updated");
            return;
        }

        // if the passed player is the current human player
        if(this.players[playerID].isCurrentPlayer){
            this.cursorManager.setCursor(cursor_type);
            return;
        }

        // followed code is just used, when the passed player is a remote player
        var cursor = CursorLibrary[cursor_type];
        if(!cursor){
            console.error("cursor not found: ",cursor_type);
            return;
        }
        this.players[playerID].texture = PIXI.loader.resources[cursor.texture].texture;

        // set the anchor of the the cursor, depending on the texture defined in the json file
        this.players[playerID].anchor.x = cursor.anchor.x || 0;
        this.players[playerID].anchor.y = cursor.anchor.y || 0;
    }

    /**
     * removes a player
     * @param @type{String} id of the player
     */
    removePlayer(id) {
        if(!id || !id.length || id.length <=0){
            console.warn("no player id passed");
            return;
        }

        if (!this.players[id]) {
            console.warn("player does not exist - id:", id);
            return;
        }

        this.removeChild(this.players[id]);

        delete this.assignedColors[this.players[id].color];
        delete this.assignedPlayerIndexes[this.players[id].playerIndex];

        this.emit(EVT_PLAYER_DISCONNECTED,{id:id,player:this.players[id]});
        delete this.players[id];

        console.info(id,"disconnected");


    }

    /**
     * updates the player positions.
     * the passed data should be an object in the format {entityID:{<updated data<}}
     * calls updatePlayerPosition for every element in the object
     * @param data {object}
     */
    batchUpdatePlayerPosition(data,timeSinceLastUpdate=0){
        for(var clientID in data) {
            if(!data.hasOwnProperty(clientID)) continue;
            this.updatePlayerPosition(clientID,data[clientID],timeSinceLastUpdate);
        }
    }

    /**
     * Updates the position of an player,
     * if the updateposition is the player of this current session,
     * then the update has no impact
     * @param playerID id of the player whos position updates
     * @param data update data {x:0,y:0};
     */
    updatePlayerPosition(playerID, data,timeSinceLastUpdate=0){
        if(!playerID || !playerID.length || playerID.length <=0){
            console.warn("no player id passed");
            return;
        }

        if(!this.players[playerID]){
            console.warn("player",playerID,"does not exist! position cannot get updated");
            return;
        }

        // do not update, if id refers to the human player
        if(this.players[playerID].isCurrentPlayer){
           // console.warn("cannot update human player");
            return;
        }

        if(!data){
            console.warn("no updated data passed for id",playerID);
            return;
        }

        var cur = this.players[playerID].position;
        // if no data is passed, do not change
        /*cur.x = data.x || cur.x;
        cur.y = data.y || cur.y;*/

        var nPos = {
            x: data.x || cur.x,
            y: data.y || cur.y
        };

        if(cur.x == nPos.x && cur.y == nPos.y){
            return; // nothing to to, if nothing has changed
        }

        this.lerpManager.push(playerID,"position",{
            get value() {
                return cur
            },
            set value(v){
                cur.x = v.x || 0;
                cur.y = v.y || 0;
            },
            start: {x: cur.x, y: cur.y},
            end: nPos,
            type: "position",
            interval: Math.min(timeSinceLastUpdate,Ticks.MAX_DELAY), //Ticks.SERVER_UPDATE_INTERVAL,
            minDiff:1
        });
    }
}

/**
 * exports this module, implemented as singleton, because it is just needed exactly one time.
 * @type {PlayerManager}
 */
module.exports = PlayerManager;