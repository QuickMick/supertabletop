/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

var Packages = require("./../../core/packages");
var EntityUpdateQueue = require('./../../core/entityupdatequeue');

//var GameState = require("./gamestate");

//var EntityManager = require("./entitymanager");



class Synchronizer{

    constructor(gameManager,entityManager){
        this.socket = null;

        /**
         *  contains all necessary client infos
         * @type {object} like{
         * socket,
            id,
            color,
            name,
            verification
            }
         */
        this.CLIENT_INFO = null;

        /**
         * used to detect updates which were done by the client
         * @type {EntityUpdateQueue}
         */
        this.entityUpdateQueue = new EntityUpdateQueue();
        //this._queue = {};


        if(!entityManager)
            throw "entityManager is required in order to establish a connection";
        if(!gameManager)
            throw "gameManager is required in order to establish a connection";

        this.entityManager = entityManager;
        this.gameManager = gameManager;

        if (this.socket){
            console.warn("synchronizer already initialized!");
            return;
        }

        this.socket = require('socket.io-client').connect();
        this._initHandlers();

        //this intervall sends the entityupdates.
        setInterval(this._sendEntityUpdates.bind(this), Packages.PROTOCOL.CLIENT_UPDATE_INTERVAL);
    }

    /**
     * sends game updates from client to server, if changes are detected
     * @private
     */
    _sendEntityUpdates(){
        if(!this.entityUpdateQueue.updateRequired) return;

        this.sendMessage(Packages.PROTOCOL.CLIENT.SEND_STATE,Packages.createEvent(
            this.CLIENT_INFO.id,
            this.entityUpdateQueue.getUpdatedEntityData()
            )
        );
    }

    processServerUpdates(updateData){
        for(var type in updateData){
            if(!updateData.hasOwnProperty(type)) continue;

            switch (type){
                case Packages.PROTOCOL.ENTITY.SERVER_POSITION_UPDATE:
                    for(var entityID in updateData[type]){
                        var cpos = updateData[type][entityID].position;

                        this.entityManager.entities[entityID].position.x = cpos.x;
                        this.entityManager.entities[entityID].position.y = cpos.y;
                    }
                    break;
            }
        }
    }



    _initHandlers(){
        // get clientdata of this client
        this.socket.on(Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED, function(evt) {
            this.CLIENT_INFO = evt.data.clientInfo;
        }.bind(this));

        // receive data about the dame (after initialisation, or gamechange
        this.socket.on(Packages.PROTOCOL.SERVER.INIT_GAME, function (evt) {
            this.gameManager.initGame(evt.data.game);
        }.bind(this));

        this.socket.on(Packages.PROTOCOL.SERVER.UPDATE_STATE, function (evt) {
            this.processServerUpdates(evt.data);
        }.bind(this));

        /*

                this.entities[data.data.id].sprite.alpha = data.data.alpha;
                // this.entities[data.data.id].sprite.scale.set(data.data.scale);

                this.entities[data.data.id].sprite.oldScale= {x:this.entities[data.data.id].sprite.scale.x,y:this.entities[data.data.id].sprite.scale.y};
                var scaleFactor = 1.1;
                var hitArea = this.entities[data.data.id].sprite.hitArea;
                this.entities[data.data.id].sprite.hitArea = null;
                this.entities[data.data.id].sprite.scale.x *= scaleFactor;
                this.entities[data.data.id].sprite.scale.y *= scaleFactor;
                this.entities[data.data.id].sprite.hitArea = hitArea;
                this.entities[data.data.id].sprite.grabbedBy = data.data.grabbedBy;

                this.entities[data.data.id].sprite.bringToFront();
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_END,
            function(data){
                this.entities[data.data.id].sprite.alpha = data.data.alpha;
                var hitArea = this.entities[data.data.id].sprite.hitArea;
                this.entities[data.data.id].sprite.hitArea = null;
                this.entities[data.data.id].sprite.scale.x = this.entities[data.data.id].sprite.oldScale.x;
                this.entities[data.data.id].sprite.scale.y = this.entities[data.data.id].sprite.oldScale.y;
                this.entities[data.data.id].sprite.hitArea = hitArea;
                this.entities[data.data.id].sprite.oldScale = undefined;
                this.entities[data.data.id].sprite.grabbedBy = undefined;
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_MOVE,
            function(data){
                this.entities[data.data.id].sprite.x = data.data.x;
                this.entities[data.data.id].sprite.y = data.data.y;
            }.bind(this)
        );


        this.socket.on(Statics.PROTOCOL.SERVER.CLIENT_CONNECTED,
            function(data){
                this.players[data.data.id] = data.data;

                this.players[data.data.id].sprite = new PIXI.Sprite(this.player_texture);

                this.players[data.data.id].sprite.anchor.x=1;
                this.players[data.data.id].sprite.tint = data.data.color;
                this.context.players.addChild(this.players[data.data.id].sprite);

            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
            function(data){

                if (this.players[data.data.id].sprite.parent){
                    this.players[data.data.id].sprite.parent.removeChild(this.players[data.data.id].sprite);
                }

                delete this.players[data.data.id];

            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,
            function(data){

                if (!this.players[data.data.id].sprite.parent){
                    return;
                }

                this.players[data.data.id].sprite.position.x = data.data.x;
                this.players[data.data.id].sprite.position.y = data.data.y;
            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.CLIENT.TURN_CARD,
            function(data){
                console.log("ssdfsd");
                if (!this.entities[data.data.id].sprite.parent){
                    return;
                }

                this.entities[data.data.id].top = !data.data.top;

                this.entities[data.data.id].turn(true);//.bind(this.entities[data.data.id]);

            }.bind(this)
        );

        this.socket.on(Statics.PROTOCOL.SERVER.VANISH,
            function(data){

                this.context.world.removeAll();
                this.entities = {};

            }.bind(this)
        );
*/
    }


    sendMessage(type,msg){
        this.socket.emit(type,msg);
    }

}

module.exports = Synchronizer;