/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');

var DEFAULT_TABLE = require('./../resources/default_game.json').table;
var Path = require('path');
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
        this._table = null;
        this.addChild(this.tableContainer);


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
    setTable(tableData){//(width,height,texture){

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
    }
}

module.exports = GameTable;