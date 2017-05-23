/**
 * Created by Mick on 22.05.2017.
 */
'use strict';


var Statics = require("./../../core/statics");
var Packages = require("./../../core/packages");
var GameState = require("./gamestate");

class Synchronizer{

    constructor(){
        this.socket = null;
        this._queue = {};
    }


    postEntityInteraction(type,entity_id,updatedData){
        if(!entity_id || !updatedData){
           console.log("cannot post update without sufficient data!");
           return;
        }

        if(!this._queue[type]){
           this._queue[type] = {};
        }

        if(!this._queue[type][entity_id]){
           this._queue[type][entity_id]={};
        }

        // merge update data to current queue
        for(var key in updatedData){
            if(!updatedData.hasOwnProperty(key))continue;

            // if data field looks like {add:true,value:3} then add,
            if(updatedData[key].add) {
                this._queue[type][entity_id][key] = this._queue[type][entity_id][key] || 0;
                this._queue[type][entity_id][key] += updatedData[key].value;
            }else{ // otherwise just replace
                this._queue[type][entity_id][key] = updatedData[key];
            }
        }

        this._queue._sendUpdateRequired = true;
    }

    sendAll(){
        // only send, when updates are available
        if(!this._queue._sendUpdateRequired) return;

        delete this._queue._sendUpdateRequired;
        this.sendMessage(Statics.PROTOCOL.CLIENT.SEND_STATE,
            {
                msg:"",
                id:GameState.USER_ID,
                data: this._queue
            }
        );
        this._queue = {};
    }

    init() {
        if (this.socket) return;

        this.socket = require('socket.io-client').connect();
        this._initHandlers();
        setInterval(this.sendAll.bind(this), Statics.PROTOCOL.CLIENT_UPDATE_INTERVAL);
    }

    _initHandlers(){
        // neue Nachricht
        this.socket.on(Packages.PROTOCOL.CLIENT.INIT_GAME, function (data) {
            this._initGame(data.data);
        }.bind(this));

        this.socket.on(Packages.PROTOCOL.CLIENT.USER_INFO, function (evt) {
            GameState.CURRENT_USER = evt.data.user_id;
        }.bind(this));

        this.socket.on(Statics.PROTOCOL.SERVER.UPDATE_STATE, function (data) {
           // TODO
        }.bind(this));





        /*

        this.socket.on(Statics.PROTOCOL.CLIENT.DRAG_START,
            function(data){
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

module.exports = new Synchronizer();