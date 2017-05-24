/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');

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
        this.addChild(this.tableContainer);
    }

    /**
     * Sets a table to the camera
     * @param width
     * @param height
     * @param texture
     */
    setTable(width,height,texture){

        // set new hitArea and size
        this.width = width;
        this.height = height;
        this.hitArea = new PIXI.Rectangle(0,0,width,height);

        // remove the previous table
        this.tableContainer.removeAll();

        // create sprite for texture
        var defaultTable = new PIXI.Sprite(texture);
        this.tableContainer.width = defaultTable.width = width;
        this.tableContainer.height = defaultTable.height =height;

        // finaly add the new table
        this.tableContainer.addChild(defaultTable);
    }
}

module.exports = GameTable;