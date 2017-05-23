/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');

var Path = require('path');
var Config = require('./../resources/config.json');
var Entity = require('./entity');

const RELATIVE_PATH = "./../";

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
        }
    }


    /**
     * Initialises a prepreperated game.
     * during this process, every entity gets deleted,
     * afterwards, the game related entities are created.
     * also all resources are loaded.
     * @param game resource from server, contains all data about entities, game info and resources
     * @private
     */
    initGame(game){
        console.log("result: " + game);
        window.showLoadingDialog();
        // prepare resource list

        for(let i in game.resources){
            var name = game.resources[i];
            PIXI.loader.add(
                {
                    name:name,
                    url: Path.join(RELATIVE_PATH,Config.PATHS.USERS_RESOURCES,game.creator,game.name,name)
                }
            );
        }
        var newEntityList = [];
        for(let i=0; i< game.entities.length;i++) {
            var newEntity =new Entity(game.entities[i]);
            newEntityList.push(newEntity);
            this.addEntity(newEntity);
        }

        window.hideLoadingDialog();
        // once the gfx is loaded, force every entity, to show its real texture instead of the placeholder
        PIXI.loader.once('complete', function (loader, resources) {
            for(let i=0; i< newEntityList.length;i++) {
                var c =newEntityList[i];
                c.showSurface(c.surfaceIndex);
            }
        }.bind(this)).load();
    }

    addEntity(entity){
        this.entities[entity.ENTITY_ID] = entity;
        this.addChild(entity);
    }


    /**
     * remove and deletes an antity from the entitymanager.
     * @param id of the entity, which should get deleted
     */
    removeEntity(id){
        var c = this.entities[id];
        this.removeChild(c);
        delete this.entities[c];
    }

    /**
     * Removes all entities and deletes them from the entitymanager.
     */
    vanish(){
        for(let id in this.entities){
            this.removeEntity(id);
        }
    }




/*




    _convertServerEntity(e){
        var cur = new Entity(e);

        cur.synchronize = function (type,id) {
            var evt = {msg:"",data:{id:e.id}};
            switch(type){
                case Statics.PROTOCOL.CLIENT.DRAG_START:
                    evt.data.alpha = cur.sprite.alpha;
                    evt.data.scale = cur.sprite.scale.x;//.get();
                    break;
                case Statics.PROTOCOL.CLIENT.DRAG_END:
                    evt.data.alpha = cur.sprite.alpha;
                    evt.data.scale = cur.sprite.scale.x;//.get();
                    break;

                case Statics.PROTOCOL.CLIENT.DRAG_MOVE:

                    evt.data.x = cur.sprite.x;
                    evt.data.y = cur.sprite.y;
                    break;
                case Statics.PROTOCOL.CLIENT.TURN_CARD:
                    evt.data.top = cur.top;
                    break;
                default:
                    return;
            }

            this.sendMessage(type,evt);

        }.bind(this);

        return cur;
    }

*/


}

module.exports= new EntityManager();