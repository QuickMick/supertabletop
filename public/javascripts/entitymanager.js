/**
 * Created by Mick on 23.05.2017.
 */
'use strict';
require('pixi.js');

class EntityManager extends PIXI.Container{

    constructor(){
        super();
    }


    _initGame(game){
        console.log("result: " + game);

        var toLoad = [];

        for(var i in game.resources){
            var name = game.resources[i];
            toLoad.push(
                {
                    name:name,
                    url: RELATIVE_PATH+Statics.PATHS.RESOURCE_PATH+"/"+game.creator+"/"+game.name+"/"+name
                }
            );
        }

        this.player_texture = PIXI.loader.resources[Statics.RESOURCES.CURSOR].texture;
        var keys = Object.keys(this.players);
        for(var i=0;i<keys.length;i++){
            this.players[keys[i]].sprite.texture = this.player_texture;
        }

        PIXI.loader.add(toLoad).once('complete', function (loader, resources) {
            for(var i in game.entities) {
                var cur = this._convertServerEntity(game.entities[i]);

                this.entities[cur.id] = cur;
                this.context.entities.addChild(cur.sprite);
            }
        }.bind(this)).load();
    }

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



    _addEntity(serverEntity){
        /*    PIXI.loader.add("image2",'./../images/c2.png').once('complete', function (loader, resources) {
         this.app.stage.addChild(new Entity(false,PIXI.loader.resources.image2.texture).sprite);
         }.bind(this)).load();*/
    }

}

module.exports= new EntityManager();