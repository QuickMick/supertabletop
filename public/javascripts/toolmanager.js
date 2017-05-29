/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

const Config = require('./../resources/config.json');
var Packages = require('./../../core/packages');
var Util = require('./../../core/util');


var OutlineFilter = require('./filters/outlinefilter');

const SEND_PERCISION_POSITION = 3;

class BasicTool{
    constructor(toolManager){
        this.toolManager = toolManager;
        this.inputHanlder = this.toolManager.inputHandler;
        this.gameTable = this.toolManager.gameTable;
        this.entityManager = this.toolManager.entityManager;
        this.playerManager = this.toolManager.playerManager;
        this.synchronizer = this.toolManager.synchronizer;

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
        this._selected_entities= [];

        this._current_zoom = 1;
        this.zoom_sensivity = 0.1;
        this._min_zoom = 0.4;
        this._max_zoom = 2.5;

        /**
         * used to block cameramovement, when an entity was clicked,
         * is released, when the key was released - see: this._initInputListeners
         * @type {boolean}
         * @private
         */
        this._camera_grab_block=false;

        this._initInputListeners();

      //  this.selectionFilter =new PIXI.filters.BloomFilter();
    }

    _initInputListeners(){

        this.inputHanlder.on("mousewheel", this._zoom.bind(this), false)
            .on("mousemove",this._mouseMove.bind(this))
            .on("rawmousemove",this._onRawMouseMove.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("pressed", function () {
            this.isCameraGrabbed = true;
        }.bind(this))
            .on("released", function () {
                this._camera_grab_block=false;
                this.isCameraGrabbed = false;
            }.bind(this));

        this.inputHanlder.mapping.MOUSE_LEFT.on("released",this._releaseSelection.bind(this));

        this.entityManager.on("entityclicked",this._onEntityClicked.bind(this));

        this.inputHanlder.mapping.TURN.on("pressed",this._turnSelectedEntities.bind(this));
    }


    update(delta){

    }

    _turnSelectedEntities(evt){
        var ids= this.selectedEntityIDs;
        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_TURN_ENTITY,
            this.synchronizer.CLIENT_INFO.id,
            {
                turnedEntities: ids,
                _mode: "pushAvoidDuplicates"
            }
        );
        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_TURN_ENTITY,
            this.synchronizer.CLIENT_INFO.id,
            {
                surface: "next",
            }
        );


    }

    _onEntityClicked(evt){
     //   this.selectedEntities.push(evt.entity);
        this._camera_grab_block=true;
    }

    _releaseSelection(evt){
       // this._selected_entities = [];
        var i = this._selected_entities.length;
        if(i<=0)return; // no elements --> nothing to release
        // remove every element one by one, so that the remove function is called
        while (i--) {
            this.removeEntityFromSelection(this._selected_entities[i]);
        }
    }

    /**
     *
 * @param evt
     * @private
     */
    _mouseMove(evt){
        if(!this.isCameraGrabbed) return;
        this.gameTable.position.x +=evt.dx;
        this.gameTable.position.y +=evt.dy;
        this.focusCamera();
    }

    /**
     * used to get local stage mouse positionas via
     *     event.data.getLocalPosition(stage)
     * @param evt
     * @private
     */
    _onRawMouseMove(evt){

    }

    /**
     * camera loses grab if an entity is selected
     * @returns {boolean}
     * @constructor
     */
    get isCameraGrabbed(){
        if(this._camera_grab_block) return false;
        if((this._selected_entities||[]).length >0) return false;
        return this._camera_grabbed;
    }

    /**
     *
     * @param v {boolean}
     * @constructor
     */
    set isCameraGrabbed(v){
        this._camera_grabbed = v;
    }

    get selectedEntities(){
        return this._selected_entities;
    }

   /* set selectedEntities(v){
        this._selected_entities = v || [];
    }*/

    /**
     * adds an entity to the current selection of the tool
     * @param entity entity value
     */
    addEntityToSelection(entity){
       if(!entity) return;
       // avoid duplicates by using a set

        entity._backupShowMouseoverEffect = entity.showMouseoverEffect;
        entity.showMouseoverEffect = false;
       this._selected_entities =[...new Set((this._selected_entities || []).concat(entity))];
   }

    /**
     * removes an specific entity from the selection
     * @param entity
     */
    removeEntityFromSelection(entity){
        if(!entity) return;
        entity.showMouseoverEffect = entity._backupShowMouseoverEffect;
        delete entity._backupShowMouseoverEffect;
        this._selected_entities = Util.removeByValue(this._selected_entities,entity);
    }

    get selectedEntityIDs(){
        return this.selectedEntities.map(function(obj){
            return obj.ENTITY_ID;
        });
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
        var previousZoom = this.current_zoom;

        if(evt.delta <0 ){
            this.current_zoom+=this.zoom_sensivity;
        }

        if(evt.delta > 0 ){
            this.current_zoom-=this.zoom_sensivity;
        }
/*
        var p = 1-(previousZoom/this.current_zoom);
        console.log(p);
        this.gameTable.position.x -= this.gameTable.width*p;
        this.gameTable.position.y -= this.gameTable.height*p;*/
    }

    focusCamera(){
        this.gameTable.scale.set(this._current_zoom);
        var w = this.gameTable.hitArea.width;
        var h = this.gameTable.hitArea.height;
        var z = this._current_zoom;

        var x = this.gameTable.position.x-this.gameTable.pivot.x;
        var y = this.gameTable.position.y-this.gameTable.pivot.y;



        //TODO: folgendes wird warscheinlich nicht funktionieren, wenn drehen drin is
     /*  if(w* z> this.gameTable.renderer.width) {
            if (x < this.gameTable.renderer.width - w*z) this.gameTable.position.x = this.gameTable.renderer.width - w*z+this.gameTable.pivot.x;
            if (x > 0) this.gameTable.position.x = this.gameTable.pivot.x;
        }else{
            this.gameTable.position.x = this.gameTable.renderer.width/2 - (w*z)/2 +this.gameTable.pivot.x;
        }

        if(h*z > this.gameTable.renderer.height) {
            if (y < this.gameTable.renderer.height - h*z) this.gameTable.position.y = this.gameTable.renderer.height - h*z+this.gameTable.pivot.y;
            if (y > 0) this.gameTable.position.y = +this.gameTable.pivot.y;
        }else{
            this.gameTable.position.y = this.gameTable.renderer.height/2 - (h*z)/2 +this.gameTable.pivot.y;
        }*/
    }
}


class SimpleDragTool extends BasicTool{
    constructor(toolManager){
        super(toolManager);

        /**
         * if an entity is currently snapped, it is stored here
         * @type {{{<entityID>:{lastEntityPosition:{x,y (last unsnapped position}},mouse:{x,y (where the snap took place)},snapZone:{snapZone itselfe),entity:<the entity itself>}}
         * @private
         */
        this._currentSnaps = {};
    }

    /**
     * @Override
     * @param evt
     * @private
     */
    _releaseSelection(evt){
        super._releaseSelection(evt);
        this._currentSnaps = {};
    }

    /**
     * @Override
     * @param entity
     */
    removeEntityFromSelection(entity){
        super.removeEntityFromSelection(entity);
        this._currentSnaps = Util.removeByValue(this._currentSnaps,entity.ENTITY_ID);
    }


    /**
     * called, when mouse moves
     * @Override
     * @param evt
     * @private
     */
    _onRawMouseMove(evt){
        super._onRawMouseMove(evt);
        // get local position of the table, so kartesien cordinates {0,0} are the left upper corner of the table
        var localPos = evt.data.getLocalPosition(this.gameTable);

        // if nothing has changed, then updating the server is not necessary
        if(this._oldLocalPos
            && Util.round(this._oldLocalPos.x,SEND_PERCISION_POSITION) == Util.round(localPos.y,SEND_PERCISION_POSITION)
            && Util.round(this._oldLocalPos.y,SEND_PERCISION_POSITION) == Util.round(localPos.y,SEND_PERCISION_POSITION)){
            return;
        }
        this._oldLocalPos=localPos;

        // crate data which will be send to the server
        var data = {
            position:{x:(localPos.x),y:(localPos.y)},
        };

        data = this._checkForEntitySnaps(data, localPos);
        data = this._updateEntitySnaps(data, localPos);

        // if something has changed, then update the server
        this.synchronizer.updateQueue.postUpdate(
            Packages.PROTOCOL.GAME_STATE.CLIENT.USER_POSITION_CHANGE,
            this.synchronizer.CLIENT_INFO.id,
            data
        );
    }

    _checkForEntitySnaps(data, localPos){
        var selectedEntities = this.selectedEntities;
        if(selectedEntities.length > 0) {
            for(var j=0;j<selectedEntities.length;j++) {
                var entityID = selectedEntities[j].ENTITY_ID;
                var ePos = selectedEntities[j].position;
                // check if an entity is inside of a snappoint range, if yes, put the relative position,
                // so that the entity snaps to this point.
                for (var i = 0; i < this.toolManager.snapZones.length; i++) {
                    var curSnapZone = this.toolManager.snapZones[i];
                    var pPos = curSnapZone.position;

                    // if entity is not snaped, then it not in the _currentSnaps array
                    // check if it should snap now
                    // if snapzones overlap, then override, if necessary, a bocked one.
                    if(!this._currentSnaps[entityID]
                        || (this._currentSnaps[entityID] && this._currentSnaps[entityID].blocked && this._currentSnaps[entityID].snapZone.id !== curSnapZone.id)){

                        // calculate the distance to the snap point
                        var dist = Util.getVectorDistance(ePos.x, ePos.y, pPos.x, pPos.y);

                        // check if the position is smaller or equals the radius of the snappoint
                        if (dist > curSnapZone.radius) continue; // otherwise, do not send relative positions

                        // if this statement is true, then mark the entity as snappeed
                        // by saving back the last known position where it was not sapped
                        this._currentSnaps[entityID] = {
                            lastEntityPosition: {x: ePos.x, y: ePos.y},
                            mouse: {x: localPos.x, y: localPos.y},
                            entity:selectedEntities[j],
                            snapZone:curSnapZone
                        };
                        // set the relative position to the snappoint,
                        // and pass the entity id. the entitys position will use the relative position
                        // summed up with the mouse position

                        // be sure, the relativePosition object exists
                        data.relativePositions = data.relativePositions || {};

                        data.relativePositions[entityID] = {
                            x:pPos.x-localPos.x,
                            y:pPos.y-localPos.y
                        };
                    }
                }
            }
        }
        return data;
    }

    _updateEntitySnaps(data,localPos){
        // check if the entity should lose snapoint focus
        // and also update the relative position
        for(var entityID in this._currentSnaps) {
            if(!this._currentSnaps.hasOwnProperty(entityID)) continue;

            var storedSnap = this._currentSnaps[entityID];
            var snapZone = storedSnap.snapZone;
            var curEntityPos = storedSnap.entity.position;

            var x = localPos.x-storedSnap.mouse.x + storedSnap.lastEntityPosition.x;
            var y = localPos.y-storedSnap.mouse.y + storedSnap.lastEntityPosition.y;

            var oldDist = Util.getVectorDistance(x, y, snapZone.position.x, snapZone.position.y);

            // if snap should be deleted, delte it
            if (oldDist > snapZone.radius) {
                // release the snap by deleting all related values
                if (data.relativePositions) {
                    delete data.relativePositions[entityID];
                }
                // block the snap, til it is outside of the snap range
                storedSnap.blocked = true;
            }

            // calculate the current snapstate, to update the relative position, or the release of the snap
            var currentDist = Util.getVectorDistance(curEntityPos.x, curEntityPos.y, snapZone.position.x, snapZone.position.y);

            if (currentDist <= snapZone.radius && !storedSnap.blocked) {
                // if snap is not blocked, update the relative position
                data.relativePositions = data.relativePositions || {};  // be sure, the relativePosition object exists
                data.relativePositions[entityID] = {
                    x: snapZone.position.x - localPos.x,
                    y: snapZone.position.y - localPos.y
                };
            }

            // if the snap is not in range anymore, delete it
            if (currentDist > snapZone.radius){
                delete this._currentSnaps[entityID];
                if (data.relativePositions) {
                    delete data.relativePositions[entityID];
                }
            }
        }

        return data;
    }

    _onEntityClicked(evt){
        super._onEntityClicked(evt);

        if(!this.entityManager.entities[evt.entity.ENTITY_ID]){
            console.log("cannot claim entity which does not exist");
            return;
        }
        if(this.entityManager.entities[evt.entity.ENTITY_ID].state.state ==Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED){
            console.log("entity already claimed");
            return;
        }

        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY,this.synchronizer.CLIENT_INFO.id,
            {
                claimedEntity:evt.entity.ENTITY_ID,
                _mode:"push"
            }
        );
    }

    _releaseSelection(evt) {
        //this selection release
        var ids = this.selectedEntityIDs;
            /*[];
        for(var i=0; i<this.selectedEntities.length;i++){
            ids.push(this.selectedEntities[i].ENTITY_ID);
        }*/

        this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_RELEASE_ENTITY, this.synchronizer.CLIENT_INFO.id,
            {
                releasedEntities:ids,
                _mode:"push"
            }
        );

        super._releaseSelection(evt);
    }


    update(delta){
        super.update(delta);
        this._processRotationInput(delta);
    }

    _processRotationInput(delta){
        // check for rotation
        var rotationAmount = 0;
        if(this.inputHanlder.mapping.ROTATE_RIGHT.isDown){
            rotationAmount += 1*delta;
        }else if(this.inputHanlder.mapping.ROTATE_LEFT.isDown){
            rotationAmount += -1*delta;
        }

        if (rotationAmount == 0){
            return; // if there is no rotation, then there is nothing to do.
        }

        // if there is rotation, update rotation to server
        var ids = this.selectedEntityIDs;
        if(ids.length >0) { // if there is a selection, rotate the selection
            // add the rotation amount
            this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY, this.synchronizer.CLIENT_INFO.id,
                {
                    rotationAmount: rotationAmount,
                    _mode: "add"
                }
            );
            // and add the affected entities
            this.synchronizer.updateQueue.postUpdate(Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY, this.synchronizer.CLIENT_INFO.id,
                {
                    rotatedEntities: ids,
                    _mode: "pushAvoidDuplicates"
                }
            );
        }else{ // else rotate just the camera
            this.gameTable.rotation += rotationAmount*Config.TABLE_ROTATION_SPEED*delta;
        }
    }
}

class ToolManager{
    constructor(gameManager){
        this.tools=null;
        this._selectedToolIndex = 0;

        /**
         * Points to which the mouse snaps
         * @type {Array}
         */
        this.snapZones= [];

        this.gameManager = gameManager;
        this.entityManager = this.gameManager.entityManager;
        this.playerManager = this.gameManager.playerManager;
        this.inputHandler = this.gameManager.inputHandler;
        this.gameTable = this.gameManager.gameTable;
        this.synchronizer = this.gameManager.synchronizer;

        /**
         * filter which is used to display a selection
         * @type {PIXI.filters.BloomFilter}
         */
        this.tools = [new SimpleDragTool(this)];
    }

    set currentTool(i){
        this._selectedToolIndex=i;
    }
    get currentTool(){
        return this.tools[this._selectedToolIndex];
    }

    batchUpdateEntityStateChange(data){
        if(!data){
            console.warn("statechange: no update data passed");
            return;
        }
        for(var entityID in data){
            if(!data.hasOwnProperty(entityID))continue;
            this.updateEntityStateChange(entityID,data[entityID]);
        }
    }

    updateEntityStateChange(entityID,stateUpdate){
        if(!entityID){
            console.warn("entity id is necessary to update enitty");
            return;
        }

        var curEntity = this.entityManager.entities[entityID];

        if(!curEntity){
            console.warn("entity",entityID,"does not exist!");
            return;
        }

        if(!stateUpdate){
            console.warn("no state update  for entity",entityID,"was passed");
            return;
        }

        // skip update, it the current state update is newer then the received one
        if(curEntity.state.timestamp > stateUpdate.timestamp){
            return;
        }

        switch (stateUpdate.state){
            case Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED:

                if(!stateUpdate.userID){
                    console.warn("invalide entity seleciton, no user id available - update rejected");
                    return;
                }

                // the passed id is the human player, then add the entity
                // to his selection
                if(this.synchronizer.CLIENT_INFO.id == stateUpdate.userID){
                    this.currentTool.addEntityToSelection(curEntity);
                    curEntity.alpha = 0.8;
                }

                // add the filter, so that it is visible,
                // to everyone, that an entity is selected
                var selectionFilter = new OutlineFilter(
                    this.gameManager.app.renderer.width,
                    this.gameManager.app.renderer.height,
                    10,
                    this.playerManager.players[stateUpdate.userID].rawPlayerData.color || 0xFFFFFF
                );

                curEntity.addFilter(selectionFilter);

                // save the filter, so it can get removed later
                curEntity.tmpSelectionFilter= selectionFilter;

                // and also bring the entity to the front
                curEntity.bringToFront();
                break;

            default:
            case Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_DEFAULT_STATE:
                // if enttiy was selected, unselect it
                if(curEntity.state.state == Packages.PROTOCOL.GAME_STATE.ENTITY.STATES.ENTITY_SELECTED) {
                    curEntity.alpha = 1;
                    // check if there is a filter available and remove it from the entity, if it was selected previously
                    if(curEntity.tmpSelectionFilter) {
                        curEntity.removeFilter(curEntity.tmpSelectionFilter);
                        delete curEntity.tmpSelectionFilter;
                    }
                }
                break;
        }

        curEntity.state = stateUpdate;
    }

    update(delta){
        this.currentTool.update(delta);
    }
}

module.exports = ToolManager;