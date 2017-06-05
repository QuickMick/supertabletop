/**
 * Created by Mick on 05.06.2017.
 */
'use strict';

const Colors = require('./../resources/colors.json').PLAYERS_COLORS;
const Ticks = require('./../../core/ticks.json');
const Util = require('./../../core/util');


const PERCENT_PADDING = 0.1;

class ColorChooser extends PIXI.Container{

    constructor(renderer,gameTable,synchronizer,playerManager){
        super();

        this.playerManager = playerManager;
        var assignments = this.playerManager.assignments;
    //    this.lerpManager = new LerpManager();
        this.synchronizer = synchronizer;
        this.selected = this.getSelectedTexture();
        this.unselected = this.getUnselectedTexture();
        this.gameTable = gameTable;

        this.seats = [];

        this.redrawChooser({
            width:renderer.width,
            height:renderer.height
        });

    }

    redrawChooser(evt){
        var center={
            x:evt.width/2,
            y:evt.height/2
        };

        this.removeAll();



        // calculate the positions of the picker buttons depending on screensize
        var radius = Math.min(evt.width,evt.height)/3;
        var colorPickerPositions = Util.pointsOfCircle(
            center.x,
            center.y,
            radius,
            Colors.length
        );

        // calculate the size of the picker buttons depending on the screen size
        var size = (2*Math.PI*radius) / colorPickerPositions.length;
        size = ((size/2) - (size*PERCENT_PADDING))/100;

        for(let i=0; i<colorPickerPositions.length; i++){

            for(let j=0;j<colorPickerPositions.length;j++){
                var currentColor = new PIXI.Sprite(this.unselected);
                currentColor.tint = Util.parseColor(Colors[j]);
                currentColor.anchor.set(0.5);
                currentColor.scale.set(size);
                currentColor.position.x = colorPickerPositions[j].x;
                currentColor.position.y = colorPickerPositions[j].y;
                currentColor.interactive = true;
                this.addChild(currentColor);
            }

            /*
             var seat = gameTable.seats[i];
             this.seats.push(this._createSeat(seat,i));

             if(assignments.indexes[i]) {    // if seat is assigned by another player
             this._setColorAsSelected(seat);
             continue;
             }*/
            //if seat is free, add color choosers
            /*

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

    _setColorAsSelected(){

    }


    getUnselectedTexture(){
        var graphics = new PIXI.Graphics();
        graphics.lineStyle (1 , 0x000000,  0.8);
        graphics.beginFill(0xFFFFFF,0.8);
        graphics.drawCircle(0,0, 100);

        return graphics.generateCanvasTexture(); //.generateTexture();
    }

    getSelectedTexture(){
        var graphics = new PIXI.Graphics();
        // graphics.lineStyle (2 , 0x000000,  1);
        graphics.beginFill(0xFFFFFF,0.3);
        graphics.drawCircle(0,0, 100);

        return graphics.generateCanvasTexture(); //.generateTexture();
    }

}

module.exports = ColorChooser;