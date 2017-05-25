/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

var Path = require('path');
var fs = require('fs');


var Config = require('./../public/resources/config.json');

var Globals = require('./globals');


class EntityServerManager {

    constructor(){
        this.lastID=0;
        this.entities={};
        this.game = null;
    }

    /**
     * loads a game from the db and creates the entities.
     * @param user
     * @param game
     */
    loadGame(user,game){
        var resource_path = Path.join(Globals.ROOT,"public",Config.PATHS.USERS_RESOURCES,user,game,Globals.GAME_DEFINITION_FILE); //path.join(global.appRoot, content_file);
        console.log("load game: "+resource_path);
        this.game = JSON.parse(fs.readFileSync(resource_path));

        var keys = Object.keys(this.entities);
       /* if(keys.length > 0) {
            this.boradcast(Statics.PROTOCOL.SERVER.VANISH, {msg: "", data: null});
        }*/
        this.entities={};

        for(var i=0; i< this.game.unstacked.length; i++){
            var c = this.game.unstacked[i];
            this._addEntity(this._reviveEntity(this.game.object_def[c.type],c));
        }

        //TODO: handle stacked

        delete this.game.unstacked;
        delete this.game.stacked;

        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));

        //this.boradcast(Packages.PROTOCOL.SERVER.INIT_GAME,Packages.createEvent(Packages.SERVER_ID,this.game));
    }

    getCurrentGameState(){
        return this.game;
    }

    /**
     * Overwrites the default values from the basetype.
     * Object.assign was not used, because it would overwrite the arrays completely.
     * This method copies and changes array items
     * @param basetype of the entity, contains all default values
     * @param instance contains all specialized values, e.g. position, or unique texture
     * @private
     */
    _reviveEntity(basetype,instance){
        // load the default entity
        let result = JSON.parse(JSON.stringify(basetype));

        //but override changes
        if(instance.overwrite) {
            for (let key in instance.overwrite) {
                if (!instance.overwrite.hasOwnProperty(key)) continue;

                var overwrite_path = key.split(".");    // get the path of the value, which should be overwritten
                var currentDepthObject = result;        // latest object of the path

                // go down the whole path, till the path can be set
                for(let i=0; i< overwrite_path.length;i++){
                    var curKey = overwrite_path[i]; // current validated key

                    if(i==overwrite_path.length-1){ // if last element, then set the real value
                        currentDepthObject[curKey] = instance.overwrite[key];
                    }else if(!result[curKey]){      // if object does not exist,
                        currentDepthObject[curKey]={};          // then create it
                    }
                    currentDepthObject=currentDepthObject[curKey];  // and set as new depth object
                }
            }
        }
        return result;
    }

    /**
     * adds an entity to the entitymanager and creates
     * @param entity
     * @private
     */
    _addEntity(entity/*,synchronize_w_users=false*/){
        this.lastID++;
        entity.id=this.lastID;

        this.entities[this.lastID] = entity;

     /*   if(synchronize_w_users) {
            this.boradcast(Statics.PROTOCOL.SERVER.ADD_ENTITY, {msg: "", data: entity});
        }*/
    }
}

module.exports = EntityServerManager;