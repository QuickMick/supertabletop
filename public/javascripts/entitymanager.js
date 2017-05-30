/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
/*
var Packages = require('./../../core/packages');

const RELATIVE_PATH = "./../";
*/

var Util = require('./../../core/util');

const Ticks = require('./../../core/ticks.json');
var EVT_ENTITYCLICKED = "entityclicked";

class EntityManager extends PIXI.Container{

    constructor(lerpManager,cursorManager){
        super();
        this.cursorManager = cursorManager;

        this.lerpManager = lerpManager;

        /**
         * Contains a mapping from entity ID to the entity itself,
         * additionally, the entities are added to the children list of this container
         * @type {{}}
         */
        this.entities = {
            //ID: ENTITY(SPRITE)
        };
    }

    addEntity(entity){
        if(!entity){
            console.warn("addEntity: no entity to add was passed");
            return;
        }

        if(this.entities[entity.ENTITY_ID]){
            console.warn("addEntity: entity already added!");
            return;
        }

        this.entities[entity.ENTITY_ID] = entity;
        this.addChild(entity);

        entity.on('mousedown', this._onEntityClicked.bind(this))
            .on('touchstart', this._onEntityClicked.bind(this));
    }

    _onEntityClicked(event){
        // no entity_id? so its propably no entity
       if(!event.currentTarget || !event.currentTarget.ENTITY_ID) return;

        var entity = event.currentTarget;
        this.emit(EVT_ENTITYCLICKED,{id:entity.ENTITY_ID,entity:entity});
    }

    /**
     * remove and deletes an antity from the entitymanager/ game.
     * @param id of the entity, which should get deleted, also arrays of ids are accepted
     */
    removeEntity(ids){
        ids = [].concat(ids);

        for(var i=0; i<ids.length;i++) {
            var id = ids[i];

            if(!id || this.entities[id]){
                console.log("entity",id,"does not exist");
                continue;
            }

            var c = this.entities[id];
            this.removeChild(c);
            delete this.entities[id];
        }
    }

    /**
     * Removes all entities and deletes them from the entitymanager.
     */
    vanish(){
        for(let id in this.entities){
            if(!this.entities.hasOwnProperty(id)) continue;
            this.removeEntity(id);
        }
    }

    /**
     * updates the entities transformation,
     * the passed data should be an object in the format {entityID:{<updated data<}}
     * calls updateEntityTransformation for every elemnt in the object
     * @param data {object}
     */
    batchUpdateEntityTransformation(data,timeSinceLastUpdate = 0){
        if(!data){
            console.warn("no update data passed");
            return;
        }
        for(var entityID in data){
            if(!data.hasOwnProperty(entityID))continue;
            this.updateEntityTransformation(entityID,data[entityID],timeSinceLastUpdate);
        }
    }

    /**
     * used to update an entities position and rotation(angle)
     * @param entityID id of the entity, of which the transformation should be changed
     * @param transformation the changed data of the entity related to the id
     * @param timeSinceLastUpdate is the time since the last update and used as LERP intervall
     */
    updateEntityTransformation(entityID,transformation,timeSinceLastUpdate=0,force){
        if(!entityID){
            console.warn("entity id is necessary to update enitty");
            return;
        }

        if(!this.entities[entityID]){
            console.warn("entity",entityID,"does not exist!");
            return;
        }

        if(!transformation){
            console.warn("no transformation data for entity",entityID,"was passed");
            return;
        }
        var cur = this.entities[entityID];

        if(!force) {
            // sometimes, just the angle is sent, position stays same
            if(transformation.position) {
                // be sure, that all necessary values are available
                transformation.position.x = transformation.position.x || cur.position.x;
                transformation.position.y = transformation.position.y || cur.position.y;

                // if position has changed, lerp position
                if (transformation.position.x != cur.position.x
                    || transformation.position.y != cur.position.y) {

                    this.lerpManager.push(entityID,"position",{
                        get value() {
                            return cur.position
                        },
                        set value(v){
                            cur.position.x = v.x || 0;
                            cur.position.y = v.y || 0;
                        },
                        start: {x: cur.position.x, y: cur.position.y},
                        end: {x: transformation.position.x, y: transformation.position.y},
                        type: "position",
                        interval: Math.min(timeSinceLastUpdate,Ticks.MAX_DELAY), //Ticks.SERVER_UPDATE_INTERVAL,
                        minDiff:1
                    });
                }
            }

            // if angle(rotation) value exists, and it does not equal the current
            // entities value, then lerp it
            if ((transformation.angle || transformation.angle === 0)
                && cur.rotation != transformation.angle) {

                this.lerpManager.push(entityID, "rotation", {
                    get value() {
                        return cur.rotation
                    },
                    set value(v) {
                        cur.rotation = v;
                    },
                    start: cur.rotation,
                    end: transformation.angle,
                    type: "value",
                    interval: Math.min(timeSinceLastUpdate, Ticks.MAX_DELAY), //Ticks.SERVER_UPDATE_INTERVAL,
                    minDiff: 0.01
                });
            }

        }else{  // when position change is forced:
            // just change the available values, e.g. sometimes,
            // just angle is sent, when just the angle is changes
            if(transformation.position) {
                cur.position.x = transformation.position.x;
                cur.position.y = transformation.position.y;
            }
            // change rotation, if available
            cur.rotation = transformation.angle || cur.rotation;
        }
    }

    /**
     * turns multiple entities at once.
     * used by the synchronizer, input datao looks like
     * @param data {entityID:{surfaceIndex:<number>}}
     */
    batchTurnEntities(data) {
        if(!data){
            console.warn("batchTurnEntities:no update data passed");
            return;
        }
        for(var entityID in data){
            if(!data.hasOwnProperty(entityID))continue;
            this.turnEntity(entityID,data[entityID].surfaceIndex);
        }
    }

    /**
     * turns an entity
     * @param entityID id of entity which should be turned
     * @param surfaceIndex {number} index of the surface, should be in the valid range,
     *  otherwise the maximum or the minimum surface is displayed
     */
    turnEntity(entityID,surfaceIndex){
        if(!entityID){
            console.warn("turnEntity: entity id is necessary to update enitty");
            return;
        }

        if(!this.entities[entityID]){
            console.warn("turnEntity: entity",entityID,"does not exist!");
            return;
        }

        if(!surfaceIndex && surfaceIndex !==0 ){// if surface does not exist
            console.warn("turnEntity: no surface data for entity",entityID,"was passed");
            return;
        }

        this.entities[entityID].showSurface(surfaceIndex);
    }


    /**
     * gets entities in a certain distance
     * @param point point for range
     * @param range
     * @param getFirst if this is true, just the first found is returned
     * @param exceptList entities which are not considered in the
     * @returns {Array} list of arrays in the range of the points
     */
    getEntitiesInRange(point,range,getFirst,exceptList){
        var result = [];

        var x = point.x;
        var y = point.y;

        // be sure except list is an array, or null
        if(exceptList) {
            exceptList = [].concat(exceptList); // no set because i do not know how bable would translate it
        }

        for(var id in this.entities){
            if(!this.entities.hasOwnProperty(id)) continue;
            var curEntity = this.entities[id];

            // if entity is in the except list, do not consider it
            if(exceptList && exceptList.indexOf(curEntity) >= 0) continue;

            // check every entity, which is not the passed entity,
            // and check if the distance is under the threshold
            var dist = Util.getVectorDistance(x,y,curEntity.position.x,curEntity.position.y);
            if(dist <=range){
                result.push(curEntity); // if near then distance, push to result
                if(getFirst){   // break / return, if just the first is wanted
                    break;
                }
            }
        }

        return result;
    }
}

module.exports= EntityManager;