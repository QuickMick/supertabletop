/**
 * Created by Mick on 24.05.2017.
 */

'use strict';


class BasicTool{
    constructor(inputHandler,gameTable,entityManager){
        this.inputHanlder=inputHandler;
        this.gameTable = gameTable;
        this.entityManager = entityManager;

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

        this._current_zoom = 1;
        this.zoom_sensivity = 0.1;
        this._min_zoom = 0.4;
        this._max_zoom = 2.5;

        this.inputHanlder.on("mousewheel", this._zoom.bind(this), false)
            .on("mousemove",this._mouseMove.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("pressed",function(){this.CAMERA_GRABBED=true;}.bind(this))
            .on("released",function(){this.CAMERA_GRABBED=false;}.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("released",this._releaseSelection.bind(this));

        this.entityManager.on("entityclicked",this._onEntityClicked.bind(this));

        this.selectionFilter =new PIXI.filters.BloomFilter();
    }

    _onEntityClicked(evt){
        this.SELECTED_ENTITIES.push(evt.entity);
         evt.entity.filters = (evt.entity.filters || []).concat([this.selectionFilter]);
    }

    _releaseSelection(evt){
        for(var i=0;i<this.SELECTED_ENTITIES.length;i++){
            // create a new array, which contains every filter, except the selection filter
            var n = [];
            var filters = this.SELECTED_ENTITIES[i].filters;
            for(var j=0; j<filters.length;j++){
                if(filters[j] != this.selectionFilter)
                    n.push(filters[j]);
            }

            // if there are no filters anymore, just set null
            if(n.lengh <=0){
                this.SELECTED_ENTITIES[i].filters=null;
            }else {
                this.SELECTED_ENTITIES[i].filters = n;
            }
        }
        this.SELECTED_ENTITIES =[];
    }

    /**
     *
     * @param evt
     * @private
     */
    _mouseMove(evt){
        if(!this.CAMERA_GRABBED) return;

        this.gameTable.position.x +=evt.dx;
        this.gameTable.position.y +=evt.dy;
        this.focusCamera();
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
            this.focusCamera();
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

    focusCamera(){
        this.gameTable.scale.set(this._current_zoom);
        var w = this.gameTable.hitArea.width;
        var h = this.gameTable.hitArea.height;
        var z = this._current_zoom;

        //TODO: folgendes wird warscheinlich nicht funktionieren, wenn drehen drin is
        if(w* z> this.gameTable.renderer.width) {
            if (this.gameTable.position.x < this.gameTable.renderer.width - w*z) this.gameTable.position.x = this.gameTable.renderer.width - w*z;
            if (this.gameTable.position.x > 0) this.gameTable.position.x = 0;
        }else{
            this.gameTable.position.x = this.gameTable.renderer.width/2 - (w*z)/2;
        }

        if(h*z > this.gameTable.renderer.height) {
            if (this.gameTable.position.y < this.gameTable.renderer.height - h*z) this.gameTable.position.y = this.gameTable.renderer.height - h*z;
            if (this.gameTable.position.y > 0) this.gameTable.position.y = 0;
        }else{
            this.gameTable.position.y = this.gameTable.renderer.height/2 - (h*z)/2;
        }
    }
}


class SimpleDragTool extends BasicTool{
    constructor(inputHandler,gameTable,entityManager){
        super(inputHandler,gameTable,entityManager);
    }
}

class ToolManager{
    constructor(){
        this.tools=null;
        this._selectedToolIndex = 0;

        this.inputHandler = null;
        this.entityManager=null;
        this.gameTable = null;
    }

    init(inputHandler,gameTable,entityManager){
        this.entityManager=entityManager;
        this.inputHandler = inputHandler;
        this.gameTable = gameTable;

        this.tools=[new SimpleDragTool(inputHandler,gameTable,entityManager)];
    }

    set currentTool(i){
        this._selectedToolIndex=i;
    }
    get currentTool(){
        return this.tools[this._selectedToolIndex];
    }

}

module.exports = new ToolManager();