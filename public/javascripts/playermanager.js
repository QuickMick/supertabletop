/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
var Util = require("./../../core/util");
const Ticks = require('./../../core/ticks.json');
const Packages = require('./../../core/packages');

const Config = require('./../resources/config.json');

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

        this.playerHTMLContainer = document.getElementById("player-container");
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

        this._currentPlayer = null;

        this.assignedColors = {};
    }

    get currentPlayer(){
        return this._currentPlayer;
    }

    get assignments(){
        return{
            indexes:this.assignedPlayerIndexes,
            colors:this.assignedColors
        };
    }

    getPlayer(id){
        if(!this.players[id]) return null;

        return this.players[id];
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
            this.players[player_data.id].color = player_data.color;
            this.players[player_data.id].name = player_data.name;
            this.players[player_data.id].userStatus = player_data.userStatus;
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
            if (player_data.color && player_data.color >=0) {
                /* var color = parseInt(player_data.color.replace("#", "0x"));
                 color = !Number.isNaN(color)?color: parseInt(ColorLibrary.default_cursor);*/
                var color = Util.parseColor(player_data.color);
                this.players[player_data.id].tint = color;

                // assign color, if player has already chosen one
                this.assignedColors[color] = player_data.id;
            }

            // finaly add the cursor to this container
            this.addChild(this.players[player_data.id]);

            this._createPlayerHTMLItem(
                this.playerHTMLContainer,
                player_data.id,
                player_data.userStatus,
                player_data.name,
                player_data.color,
                player_data.playerIndex
            );

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
            isCurrentPlayer: true,
            playerIndex:data.playerIndex,
            PLAYER_ID:data.id,
            color:data.color,
            name:data.name,
            userStatus:data.userStatus,
            cursor:data.cursor
        };
        this._currentPlayer =this.players[data.id];
        this.cursorManager.setCursor(data.cursor,data.color);

        // assing the seat, if player already has chosen one
        if(data.playerIndex >=0){
            this.assignedPlayerIndexes[data.playerIndex] = data.id;
        }
        // set color if available otherwise take default color defined in json
        if (data.color && data.color >=0) {
            // assign color, if player has already chosen one
            this.assignedColors[data.color] = data.id;
        }

        this._createPlayerHTMLItem(this.playerHTMLContainer,data.id,data.userStatus,data.name,data.color,data.playerIndex);

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
                //update player color
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR:
                    if(this.players[id].tint == value) return;  // return if there is no change

                    var old = this.players[id].tint;
                    var newColor =Util.parseColor(value);
                    this.players[id].tint = value;
                    this.players[id].color = value;

                    this.assignedColors[newColor] = id;

                    if(this.assignedColors[old]){
                        delete this.assignedColors[old];
                    }

                    if(value >= 0) {    // set color if available
                        var playerItem = document.getElementById(id);
                        var colorNode = playerItem.getElementsByClassName("player-color");

                        if(this.players[id].isCurrentPlayer) {   // if current player is updating his color, update his cursor too
                            this.cursorManager.setCursor(this.players[id].cursor, value);
                        }
                        colorNode[0].style.backgroundColor = Util.intToColorString(value);
                    }

                    // emit color change event
                    this.emit(EVT_COLOR_CHANGES,{
                        player:this.players[id],
                        oldColor:old,
                        newColor:newColor
                    });
                    return;

                // update playerIndex aka seat
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

                     // set color if available
                    var playerItem = document.getElementById(id);
                    playerItem.dataset.index = value;
                    var indexNode = playerItem.getElementsByClassName("player-seat");
                    if(value >= 0) {
                        indexNode[0].innerHTML = (value+1);
                    }else{
                        indexNode[0].innerHTML = "";
                    }

                    this._sortPlayerItems();

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
            this.players[playerID].cursor = cursor_type;
            this.cursorManager.setCursor(cursor_type,this.players[playerID].color);
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
        this._removePlayerHTMLItem(id);

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

    /**
     * creates and addes an html based on all passed informations to the passed container
     * the id of the new node is the passed id
     * @param container
     * @param id {string}
     * @param prefix {string}
     * @param name {string}
     * @param color {number}
     * @private
     */
    _createPlayerHTMLItem(container,id,prefix,name,color,index){

        var e = document.getElementById(id);
        if(e){
            console.log("player item already added to header");
            return;
        }

        var itemNode = document.createElement("div");
        itemNode.className = "player-item";
        itemNode.id = id;

        itemNode.dataset.index = index;

        var imageNode = document.createElement("img");
        imageNode.className = "player-image";
        imageNode.onerror = function(){
            console.log("err");
            this.src = Config.PATHS.RESOURCE_BASE+"/default/missing_avatar.png";
        };
        if(prefix != "guest") { //TODO: i18n translation here
            imageNode.src = Config.PATHS.USERS_RESOURCES + "/" + name + "/" + name + "_avatar.png";//"url('/"+Config.PATHS.USERS_RESOURCES+"/"+name+"/"+name+"_avatar.png";
        }else{
            imageNode.src = Config.PATHS.RESOURCE_BASE+"/default/missing_avatar.png";
        }

        var detailsNode = document.createElement("div");
        detailsNode.className = "player-details";

        var name_containerNode = document.createElement("div");
        name_containerNode.className="player-name-container";

        var prefixNode = document.createElement("div");
        prefixNode.className="player-prefix";
        prefixNode.innerHTML = prefix;

        var nameNode = document.createElement("div");
        nameNode.className="player-name";
        nameNode.innerHTML = name;

        var seatNode = document.createElement("div");
        seatNode.className = "player-seat";
        seatNode.innerHTML = index>=0?(index+1) : "";

        var colorNode = document.createElement("div");
        colorNode.className="player-color";

        if(color >= 0) {    // set color if available
            colorNode.style.backgroundColor = Util.intToColorString(color);
        }

        var info_container = document.createElement("div");
        info_container.className = "player-info-container";

        itemNode.appendChild(imageNode);
        name_containerNode.appendChild(prefixNode);
        name_containerNode.appendChild(nameNode);
        detailsNode.appendChild(name_containerNode);
        info_container.appendChild(seatNode);
        info_container.appendChild(colorNode);
        detailsNode.appendChild(info_container);
        itemNode.appendChild(detailsNode);


        container.appendChild(itemNode);
        this._sortPlayerItems();

        /*
            jade example
         *       div#player-container
         div.player-item
         div.player-image
         div.player-details
         div.player-name-container
         p.player-prefix admin
         p.player-name mick
         div.player-color

         div.player-item
         img.player-image
         div.player-details
         div.player-name-container
         p.player-prefix admin
         p.player-name mick
         div.player-color
         */
    }
    _sortPlayerItems(){
        var playerItem = this.playerHTMLContainer.getElementsByClassName("player-item");

        var sorted = [];
        for(var i=0; i< playerItem.length;i++){
            var c = playerItem[i];
            sorted.push(c);
           // this.playerHTMLContainer.removeChild(c);

        }
//         sorted.sort(function(a, b){
//             /*if(a.dataset.index <0) return b;
//             if(b.dataset.index <0) return a;
// */
//             console.log(parseInt(a.dataset.index) || 0 ,parseInt(b.dataset.index) );
//             return (parseInt(a.dataset.index) || 0) - (parseInt(b.dataset.index) || 0);
//         });

        sorted.sort(function(a, b) {
        /*    if((parseInt(a.dataset.index) || 0) <0) return a;
            if((parseInt(b.dataset.index) || 0) <0) return b;*/
            return a.dataset.index.localeCompare(b.dataset.index);
        });

        for(var i=0; i< sorted.length;i++){
            this.playerHTMLContainer.appendChild(sorted[i]);
        }
    }
    /**
     * removes an playeritem based on the id from the header
     * @param id {string}
     * @private
     */
    _removePlayerHTMLItem(id){
        var e = document.getElementById(id);
        if(!e || !e.parentNode){
            console.log("player item does not exist");
            return;
        }
        e.parentNode.removeChild(e);
    }
}

/**
 * exports this module, implemented as singleton, because it is just needed exactly one time.
 * @type {PlayerManager}
 */
module.exports = PlayerManager;