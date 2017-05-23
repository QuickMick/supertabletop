/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
var InputHandler = require('./inputhandler');
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

        this._current_zoom = 1;
        this.zoom_sensivity = 0.1;
        this._min_zoom = 0.4;
        this._max_zoom = 2.5;

        this.isMoving = false;


        this.interactive = true;
/*
        this.on('mousedown', this._onDragStart.bind(this) )
            .on('touchstart', this._onDragStart.bind(this))
            // events for drag end
            .on('mouseup', this._onDragEnd.bind(this))
            .on('mouseupoutside', this._onDragEnd.bind(this))
            .on('touchend', this._onDragEnd.bind(this))
            .on('touchendoutside', this._onDragEnd.bind(this))
            // events for drag move
            .on('mousemove', this._onDragMove.bind(this))
            .on('touchmove', this._onDragMove.bind(this));
*/
        //document.addEventListener("mousewheel", this._zoom.bind(this), false);
        InputHandler.on("mousewheel", this._zoom.bind(this), false)
            .on("mousemove",this._mouseMove.bind(this));

        InputHandler.mapping.GRAB_CAMERA.on("pressed",function(){this.mouseGrabed=true;}.bind(this))
                                        .on("released",function(){delete this.mouseGrabed;}.bind(this));
    }

    /**
     *
     * @param evt
     * @private
     */
    _mouseMove(evt){
        if(!this.mouseGrabed) return;

/*
        var dx = this.pos.old.x - this.pos.new.x;
        var dy = this.pos.old.y - this.pos.new.y;
*/
console.log(this.position,evt.dx,evt.dy);
        this.position.x +=evt.dx;
        this.position.y +=evt.dy;

        // if(dx >0 || dy>0) {
        this.updateCam();
        // }
      //  this.pos.old = {x:this.pos.new.x,y:this.pos.new.y};
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

  /*  _onDragStart(event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
        this.pos = {
            old:event.data.global,
            new:event.data.global
        };
        this.isMoving = true;

        if(this.onDragStart){
            this.onDragStart(this);
        }
    }

    _onDragEnd() {
        this.dragging = false;
        this.data = null;
        this.pos=null;
        this.isMoving = false;
        if(this.onDragEnd){
            this.onDragEnd(this);
        }
    }

    _onDragMove() {
        if (this.dragging) {
            var dx = this.pos.old.x - this.pos.new.x;
            var dy = this.pos.old.y - this.pos.new.y;

            this.position.x -=dx;
            this.position.y -=dy;

           // if(dx >0 || dy>0) {
                this.updateCam();
                if(this.onMoving){
                    this.onMoving(this);
                }
           // }
            this.pos.old = {x:this.pos.new.x,y:this.pos.new.y};
        }
    }*/

    get min_zoom(){
        return this._min_zoom;
    }

    get max_zoom(){
        return this._max_zoom;
    }

    get current_zoom(){
        return this._current_zoom;
    }

    set min_zoom(v) {
        this._min_zoom = v;
        if (v > this._current_zoom) {
            this._current_zoom = v;
        }
    }

    set max_zoom(v){
        this._max_zoom=v;
        if(v<this._current_zoom){
            this._current_zoom = v;
        }
    }

    set current_zoom(v){
        var old = this._current_zoom;
        this._current_zoom=v;

        if(this._current_zoom > this._max_zoom){
            this._current_zoom= this._max_zoom ;
        }

        if(this._current_zoom < this._min_zoom){
            this._current_zoom = this._min_zoom;
        }
        if(old != this._current_zoom) {
            this.scale.set(this._current_zoom);
            this.updateCam();
        }
    }


    _zoom(evt) {
        if(evt.delta <0 ){
            this.current_zoom+=this.zoom_sensivity;
        }

        if(evt.delta > 0 ){
            this.current_zoom-=this.zoom_sensivity;
        }
    }

    updateCam(){

        var w = this.hitArea.width;
        var h = this.hitArea.height;
        var z = this._current_zoom;

        //TODO: folgendes wird warscheinlich nicht funktionieren, wenn drehen drin is
        if(w* z> this.renderer.width) {
            if (this.position.x < this.renderer.width - w*z) this.position.x = this.renderer.width - w*z;
            if (this.position.x > 0) this.position.x = 0;
        }else{
            this.position.x = this.renderer.width/2 - (w*z)/2;
        }

        if(h*z > this.renderer.height) {
            if (this.position.y < this.renderer.height - h*z) this.position.y = this.renderer.height - h*z;
            if (this.position.y > 0) this.position.y = 0;
        }else{
            this.position.y = this.renderer.height/2 - (h*z)/2;
        }
    }
}

module.exports = GameTable;