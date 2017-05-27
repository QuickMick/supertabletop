/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');
require('pixi-filters');
require('pixi-extra-filters');

const RELATIVE_PATH = "./../";


var EVT_ENTITYCLICKED = "entityclicked";

class EntityManager extends PIXI.Container{

    constructor(){
        super();
        /**
         * Contains a mapping from entity ID to the entity itself,
         * additionally, the entities are added to the children list of this container
         * @type {{}}
         */
        this.entities = {
            //ID: ENTITY(SPRITE)
        };

        this.selectionFilter =new PIXI.filters.BloomFilter();
    }

    addEntity(entity){
        if(!entity){
            console.warn("no entity to add was passed");
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
            this.removeEntity(id);
        }
    }

    /**
     * updates the entities transformation,
     * the passed data should be an object in the format {entityID:{<updated data<}}
     * calls updateEntityTransformation for every elemnt in the object
     * @param data {object}
     */
    batchUpdateEntityTransformation(data){
        if(!data){
            console.warn("no update data passed");
            return;
        }
        for(var entityID in data){
            if(!data.hasOwnProperty(entityID))continue;
            this.updateEntityTransformation(entityID,data[entityID]);
        }
    }

    /**
     * used to update an entities position and rotation(angle)
     * @param entityID id of the entity, of which the transformation should be changed
     * @param transformation the changed data of the entity related to the id
     */
    updateEntityTransformation(entityID,transformation){
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

        // just change the available values, e.g. sometimes,
        // just angle is sent, when just the angle is changes
        if(transformation.position) {
            cur.position.x = transformation.position.x || cur.position.x;
            cur.position.y = transformation.position.y || cur.position.y;
        }
        // change rotation, if available
        cur.rotation = transformation.angle || cur.rotation;
    }

    batchUpdateEntityStateChange(data){
        if(!data){
            console.warn("no update data passed");
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
        if(!this.entities[entityID]){
            console.warn("entity",entityID,"does not exist!");
            return;
        }

        if(!stateUpdate){
            console.warn("no state update  for entity",entityID,"was passed");
            return;
        }
        //TODO
    }

}

module.exports= EntityManager;