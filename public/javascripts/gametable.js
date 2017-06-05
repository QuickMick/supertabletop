/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
const Ticks = require('./../../core/ticks.json');
const Util = require('./../../core/util');
var DEFAULT_TABLE = require('./../resources/default_game.json').table;
var Path = require('path');
const Colors = require('./../resources/colors.json');

const BORDER_SIZE = 5;

class GameTable extends PIXI.Container {

    /**
     * creates a new camera
     * @param width Playground size
     * @param height Playground size
     * @param renderer pixi renderer
     */
    constructor(renderer,entityManager){
        super();
        this.renderer = renderer;

        this.entityManager = entityManager;

        /**
         * Thisn container holds the sprite of the table
         * @type {PIXI.Container}
         */
        this.tableContainer = new PIXI.Container();
        this.seatContainer = new PIXI.Container();
        this._table = null;
        this.addChild(this.tableContainer);
        this.addChild(this.seatContainer);

        /**
         * contains all graphic objects of the seats
         * @type {Array}
         */
        this.seatGFX = [];

        /**
         * seats of the players
         * @type {array}
         */
        this.seats=[];

        /**
         * ID of the player who is currently playing, it is used to identify,
         * which cards he is able to see and which he is not.
         * @type {null}
         */
        this.currentPlayerID= null;
    }

    initCurrentPlayer(clientInfo){
        this.currentPlayerID = clientInfo.id;
    }

    /**
     * Sets a table to the camera
     * @param table
     */
    setTable(tableData,playerManager){//(width,height,texture){

        tableData = tableData || DEFAULT_TABLE;    // if no table was passed, set default values

        var assignments = playerManager.assignments;

        /**
         * contains the raw data of the loaded table seats
         * @type {Array}
         */
        this.seats = tableData.seats || [];

        var w = tableData.width || DEFAULT_TABLE.width;
        var h = tableData.height || DEFAULT_TABLE.height;
        var tex = Path.join(tableData.game_resource_path || "",tableData.texture || DEFAULT_TABLE.texture);


        // set new hitArea and size
        this.width = w;
        this.height = h;
        this.hitArea = new PIXI.Rectangle(0,0,w,h);

        // remove the previous table
        //this.tableContainer.removeAll();

        // create sprite for texture
        var newTable = new PIXI.Sprite(PIXI.loader.resources[tex].texture);
        this.tableContainer.width = newTable.width = w;
        this.tableContainer.height = newTable.height = h;

       /* if(this._table){    // remove the old table, if there is one
            this.removeChild(this._table);
        }*/
        this.tableContainer.removeAll();

        this._table = newTable;

        // finaly add the new table
        this.tableContainer.addChild(this._table);

        this.seatGFX = [];

        this.seatContainer.removeAll();

        for(var i=0;(i<Ticks.MAX_PLAYERS && i<this.seats.length); i++){
            // be sure, the seat has an offset, even if its 0
            this.seats[i].offset = this.seats[i].offset || {};
            this.seats[i].offset.x = this.seats[i].offset.x || 0;
            this.seats[i].offset.y = this.seats[i].offset.y || 0;

            var cur = this._generatePlayerSeats(this.seats[i]);
            this.seatGFX.push(cur);
            this.seatContainer.addChild(cur);
            if(!assignments.indexes[i]){
                cur.visible = false;
                continue;
            }

            cur.claimedBy = assignments.indexes[i];

            // set color of the player
            var player = playerManager.getPlayer(assignments.indexes[i]);
            cur.tint = player.color || Colors.SEAT_DEFAULT_COLOR;
        }
    }

    _generatePlayerSeats(seat) {
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(BORDER_SIZE, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.0);
        graphics.drawRect(0, 0, seat.width, seat.height);

        graphics.rotation = seat.rotation;
        graphics.position.x = seat.position.x + seat.offset.x;
        graphics.position.y = seat.position.y + seat.offset.y;
     /*   graphics.pivot.x = seat.width/2;
        graphics.pivot.y = -seat.height/2;*/

        return graphics;//.generateTexture();
    }


    onPlayerIndexChanged(evt){
        // set new player index, and release old
        if(evt.newPlayerIndex >=0) {
            this.seatGFX[evt.newPlayerIndex].visible = true;
            this.seatGFX[evt.newPlayerIndex].claimedBy = evt.player.PLAYER_ID;

            for(var key in this.entityManager.entities){
                if(!this.entityManager.entities.hasOwnProperty(key)) continue;

                this.onEntityMovedOrAdded({entity:this.entityManager.entities[key]});
            }
        }
        if(evt.oldPlayerIndex >=0){
            this.seatGFX[evt.oldPlayerIndex].visible=false;
            delete this.seatGFX[evt.oldPlayerIndex].claimedBy;
        }
    }

    onPlayerConnected(evt){
        if(evt.player.playerIndex >=0){
            var seat = this.seatGFX[evt.player.playerIndex];
            seat.visible=true;
            seat.claimedBy = evt.player.PLAYER_ID;
            if(evt.player.color >=0) {      // set color of the players chair
                seat.tint = evt.player.color;
            }
        }
    }

    onColorChanged(evt){
        /*
         {
         player:this.players[id],
         oldColor:old,
         newColor:newColor
         }
         */
        if(!evt.player || evt.player.playerIndex <0) return; // no seat chosen

        var seat = this.seatGFX[evt.player.playerIndex];

        if(!seat) return;

        seat.tint = evt.newColor;
    }

    onPlayerDisconnected(evt){
        // release the seat
        if(evt.player.playerIndex >=0){
            this.seatGFX[evt.player.playerIndex].visible=false;
            delete this.seatGFX[evt.player.playerIndex].claimedBy;
        }
    }

    onEntityMovedOrAdded(evt){
        //entitymoved
        //{entity:cur,oldPosition:{x:curX,y:curY}}
        var x = evt.entity.position.x;
        var y = evt.entity.position.y;
        for(var i=0;i<this.seats.length;i++){
            if(!this.seatGFX[i].visible) continue;
            evt.entity.aplha = 0.4;
            // if hidezone is current player, then continue
/*
            if(this.seatGFX[i].claimedBy && this.seatGFX[i].claimedBy == this.currentPlayerID){
                if(evt.entity.hidden){
                    evt.entity.hidden=false;
                }
                continue;
            }*/

            var c= this.seats[i];
            if(Util.isPointInRectangle(x,y,c.position.x+c.offset.x,c.position.y+c.offset.y,c.width,c.height)){

                if(this.seatGFX[i].claimedBy == this.currentPlayerID){
                    evt.entity.alpha = 0.5;
                }else if(!evt.entity.hidden) {
                    evt.entity.hidden = true;
                }
                break;
            }else if(evt.entity.hidden){
                evt.entity.hidden=false;
                evt.entity.alpha=1;
            }
        }
    }
}

module.exports = GameTable;