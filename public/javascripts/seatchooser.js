/**
 * Created by Mick on 02.06.2017.
 */

'use strict';

const Packages = require('./../../core/packages');

const Colors = require('./../resources/colors.json');
const Util = require('./../../core/util');

const LerpManager = require('./lerpmanager');

const Ticks = require('./../../core/ticks.json');

const SEAT_SIZE = 100;
const SEAT_BORDER_SIZE=10;

const SCALE= 0.5;

class SeatChooser extends PIXI.Container{

    constructor(gameTable,synchronizer,playerManager){
        super();

        this.playerManager = playerManager;
        var assignments = this.playerManager.assignments;
        this.lerpManager = new LerpManager();
        this.synchronizer = synchronizer;
        this.selected = this.getSelectedTexture();
        this.unselected = this.getUnselectedTexture();
        this.gameTable = gameTable;

        this.seats = [];

        for(let i=0; (i< gameTable.seats.length && i<Ticks.MAX_PLAYERS); i++){


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
            this.seats.push(this._createSeat(seat,i));

            if(assignments.indexes[i]) {    // if seat is assigned by another player
                this._setSeatAsSelected(seat);
                continue;
            }
            //if seat is free, add color choosers
/*
            var colorPickerPositions = Util.pointsOfCircle(seat.position.x,seat.position.y,SEAT_SIZE*2,Ticks.MAX_PLAYERS);

            for(let j=0;j<colorPickerPositions.length;j++){
                var currentColor = new PIXI.Sprite(unselected);
                currentColor.tint = Util.parseColor(Colors.PLAYERS_COLORS[j]);
                currentColor.anchor.set(0.5);
                currentColor.scale.set(0.5);
                currentColor.position.x = colorPickerPositions[j].x;
                currentColor.position.y = colorPickerPositions[j].y;
                currentColor.interactive = true;
                this.addChild(currentColor);
            }
*/




/*
            let color = Util.parseColor(PLAYERS_COLORS[i]);


            cur.on('mousedown',function(){
                synchronizer.sendPlayerUpdate([
                    {key:Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR,value:color},
                    {key:Packages.PROTOCOL.CLIENT_VALUE_UPDATE.PLAYER_INDEX,value:i}
                    ]);
              //  this.emit('colorselected',{color:color});
            }.bind(this),true);*/
        }
    }

    _createSeat(seat,i){
        var currentSeat = new PIXI.Sprite(this.unselected);
        currentSeat.tint = Util.parseColor(Colors.SEAT_DEFAULT_COLOR);
        currentSeat.anchor.set(0.5);
        currentSeat.scale.set(1);
        currentSeat.position.x = seat.position.x;
        currentSeat.position.y = seat.position.y;
        currentSeat.interactive = true;
        currentSeat.id = seat.id;
        this.addChild(currentSeat);


        this._getLerp(currentSeat, this.lerpManager, this, seat.id);


        currentSeat.on('mousedown',function(){

            // do not send, if nothing has changed
            if(this.playerManager.currentPlayer.playerIndex == i) return;

            this.synchronizer.sendPlayerUpdate([
                {key:Packages.PROTOCOL.CLIENT_VALUE_UPDATE.PLAYER_INDEX,value:i}
            ]);
            this.emit('seatSelected',{seat:i});
        }.bind(this),true);

        return currentSeat;
    }

    _setSeatAsSelected(seat){
        seat.texture = this.selected;
        this.lerpManager.abortAllLerpsOfObject(seat.id);

        this.lerpManager.push(seat.id,"value", {
            get value() {
                return seat.scale.x;
            },
            set value(v) {
                seat.scale.x = v;
                seat.scale.y = v;
            },
            start: seat.scale.x,
            end: SCALE,
            type: "value",
            interval: 500,
            minDiff: 0.001
        });

     //   seat.alpha = 0.5;
    }

    getUnselectedTexture(){
        var graphics = new PIXI.Graphics();
        graphics.lineStyle (SEAT_BORDER_SIZE , 0x000000,  0.8);
        graphics.beginFill(0xFFFFFF,0.8);
        graphics.drawCircle(0,0, SEAT_SIZE);

        return graphics.generateCanvasTexture(); //.generateTexture();
    }

    getSelectedTexture(){
        var graphics = new PIXI.Graphics();
       // graphics.lineStyle (2 , 0x000000,  1);
        graphics.beginFill(0xFFFFFF,0.3);
        graphics.drawCircle(0,0, SEAT_SIZE);

        return graphics.generateCanvasTexture(); //.generateTexture();
    }

    onColorChanged(evt){
        /*
         {
         player:this.players[id],
         oldColor:old,
         newColor:newColor
         }
         */
    }
    onPlayerIndexChanged(evt){

      //  if(evt.player.isCurrentPlayer) return;

        if(evt.newPlayerIndex >=0) {
            this._setSeatAsSelected(this.seats[evt.newPlayerIndex]);
        }
        // release old seat
        if(evt.oldPlayerIndex >=0){
            this.removeChild(this.seats[evt.oldPlayerIndex]);
            this.seats.push(this._createSeat(this.gameTable.seats[evt.oldPlayerIndex],evt.oldPlayerIndex));
        }

     /*
      {
      player:this.players[id],
      oldPlayerIndex:old,
      newPlayerIndex:value
      }
         */
    }

    onPlayerConnected(evt){
        if(evt.player.playerIndex >=0){
            this._setSeatAsSelected(this.seats[evt.player.playerIndex]);
           // this.removeChild(this.seats[evt.player.playerIndex]);
         //   this.seats.push(this._createSeat(this.gameTable.seats[evt.player.playerIndex],evt.player.playerIndex));

        }
    }

    onPlayerDisconnected(evt){
        //evt:id,player
        if(evt.player.playerIndex >=0) {
            this.removeChild(this.seats[evt.player.playerIndex]);
            this.seats.push(this._createSeat(this.gameTable.seats[evt.player.playerIndex], evt.player.playerIndex));
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
        this.lerpManager.push(id,"value", {
            get value() {
                return cur.scale.x;
            },
            set value(v){
                cur.scale.x=v;
                cur.scale.y=v;
            },
            start: cur.scale.x,
            end: cur.scale.x*SCALE,
            type: "value",
                interval: 1000,
            minDiff:0.001,
            lerpManager:lerpManager,
            onFinished:function (evt) {
                if(evt.wasAborted){
                    cur.scale.set(1,1);
                    return;
                }
                this.lerpManager.push(id,"value", {
                    get value() {
                        return cur.scale.x || 0;
                    },
                    set value(v){
                        cur.scale.set(v ||0,v||0);
                    },
                    start: cur.scale.x,
                    end: cur.scale.x/SCALE,
                    type: "value",
                    interval: 1000,
                    minDiff:0.001,
                    lerpManager:lerpManager,
                    onFinished:function (e) {
                        if(e.wasAborted){
                            cur.scale.set(1,1);
                            return;
                        }

                        x._getLerp(cur,lerpManager,x,id);
                    }
                });
            }
        });
    }

    update(delta){
        this.lerpManager.update(delta);
    }
}

module.exports = SeatChooser;