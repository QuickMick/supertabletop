/**
 * Created by Mick on 02.06.2017.
 */

'use strict';

const PLAYERS_COLORS = require('./../resources/colors.json').PLAYERS_COLORS;
const Util = require('./../../core/util');

const LerpManager = require('./lerpmanager');

class ColorChooser extends PIXI.Container{

    constructor(gameTable,synchronizer){
        super();

        this.lerpManager = new LerpManager();

        var graphics = new PIXI.Graphics();
        // graphics.lineStyle ( 2 , 0x000000,  1);
        graphics.beginFill(0xFFFFFF);
        graphics.drawCircle(0,0, 100);


        var tex = graphics.generateTexture();

        for(var i=0; i< gameTable.seats.length; i++){
            if(i>7)break; //TODO: ok? just 8 players are allowed

           /* var graphics = new PIXI.Graphics();
            var seat = gameTable.seats[i];
            // graphics.lineStyle ( 2 , 0x000000,  1);
            graphics.beginFill(Util.parseColor(PLAYERS_COLORS[i]));
            graphics.drawCircle(0,0, 100);
            graphics.anchor.set(0.5);

            graphics.position.x = seat.position.x;
            graphics.position.y = seat.position.y;

            graphics.interactive = true;*/
            var seat = gameTable.seats[i];
            var cur = new PIXI.Sprite(tex);

            let color = Util.parseColor(PLAYERS_COLORS[i]);
            cur.tint = color;
            cur.anchor.set(0.5);
            cur.scale.set(1);
            cur.position.x = seat.position.x;
            cur.position.y = seat.position.y;

            cur.interactive = true;
            this.addChild(cur);

            this._getLerp(cur,this.lerpManager,this,seat.id);

            cur.on('mousedown',function(){
                console.log("s",color);
                synchronizer.sendPlayerUpdate("color",color);
                this.emit('colorselected',{color:color});
            }.bind(this),true);
        }
    }

    /**
     * creates the small->big->small animation
     * @param cur
     * @param lerpManager
     * @param x
     * @param id
     * @private
     */
    _getLerp(cur,lerpManager, x,id){
        var scale = 0.5;
        this.lerpManager.push(id,"value", {
            get value() {
                return cur.scale.x;
            },
            set value(v){
                cur.scale.x=v;
                cur.scale.y=v;
            },
            start: cur.scale.x,
            end: cur.scale.x*scale,
            type: "value",
                interval: 1000,
            minDiff:0.001,
            lerpManager:lerpManager,
            onFinished:function () {
                this.lerpManager.push(id,"value", {
                    get value() {
                        return cur.scale.x || 0;
                    },
                    set value(v){
                        cur.scale.set(v ||0,v||0);
                    },
                    start: cur.scale.x,
                    end: cur.scale.x/scale,
                    type: "value",
                    interval: 1000,
                    minDiff:0.001,
                    lerpManager:lerpManager,
                    onFinished:function () {
                        x._getLerp(cur,this.lerpManager,x,id);
                    }
                });
            }
        });
    }

    update(delta){
        this.lerpManager.update(delta);
    }

}

module.exports = ColorChooser;