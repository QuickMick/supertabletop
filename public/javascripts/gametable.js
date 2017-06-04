/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
const Ticks = require('./../../core/ticks.json');
var DEFAULT_TABLE = require('./../resources/default_game.json').table;
var Path = require('path');

const BORDER_SIZE = 5;

class GameTable extends PIXI.Container {

    /**
     * creates a new camera
     * @param width Playground size
     * @param height Playground size
     * @param renderer pixi renderer
     */
    constructor(renderer){
        super();
        this.renderer = renderer;

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
    }

    /**
     * Sets a table to the camera
     * @param table
     */
    setTable(tableData,assignments){//(width,height,texture){

        tableData = tableData || DEFAULT_TABLE;    // if no table was passed, set default values

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

        if(this._table){    // remove the old table, if there is one
            this.removeChild(this._table);
        }

        this._table = newTable;

        // finaly add the new table
        this.tableContainer.addChild(this._table);

        this.seatGFX = [];

        this.seatContainer.removeAll();

        for(var i=0;(i<Ticks.MAX_PLAYERS && i<this.seats.length); i++){
            var cur = this._generatePlayerSeats(this.seats[i]);
            this.seatGFX.push(cur);
            this.seatContainer.addChild(cur);
            if(!assignments.indexes[i]){
                cur.visible = false;
                continue;
            }
        }
    }

    _generatePlayerSeats(seat) {
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(BORDER_SIZE, 0xFFFFFF, 1);
        graphics.beginFill(0xFFFFFF, 0.0);
        graphics.drawRect(0, 0, seat.width, seat.height);

        graphics.rotation = seat.rotation;
        graphics.position.x = seat.position.x + ((seat.offset || {}).x || 0);
        graphics.position.y = seat.position.y + ((seat.offset || {}).y || 0);
     /*   graphics.pivot.x = seat.width/2;
        graphics.pivot.y = -seat.height/2;*/

        return graphics;//.generateTexture();
    }


    onPlayerIndexChanged(evt){
        // set new player index, and release old
        if(evt.newPlayerIndex >=0) {
            this.seatGFX[evt.newPlayerIndex].visible = true;
        }
        if(evt.oldPlayerIndex >=0){
            this.seatGFX[evt.oldPlayerIndex].visible=false;
        }
    }

    onPlayerConnected(evt){
        if(evt.player.playerIndex >=0){
            this.seatGFX[evt.player.playerIndex].visible=true;
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
    }

    onPlayerDisconnected(evt){
        // release the seat
        if(evt.player.playerIndex >=0){
            this.seatGFX[evt.player.playerIndex].visible=false;
        }
    }
}

module.exports = GameTable;