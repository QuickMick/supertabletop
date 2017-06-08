/**
 * Created by Mick on 05.06.2017.
 */
'use strict';

const Colors = require('./../resources/colors.json').PLAYERS_COLORS;
const Ticks = require('./../../core/ticks.json');
const Util = require('./../../core/util');
const Packages = require('./../../core/packages');

const Config = require('./../resources/config.json');

const PERCENT_PADDING = 0.2;
const BORDER_SIZE = 3;

const EVT_COLOR_SELECTED = 'colorSelected';
const EVT_CANCELED = 'canceled';

class ColorChooser extends PIXI.Container{

    constructor(renderer,gameTable,synchronizer,playerManager){
        super();
        this.renderer = renderer;
        this.playerManager = playerManager;
        var assignments = this.playerManager.assignments;
    //    this.lerpManager = new LerpManager();
        this.synchronizer = synchronizer;

        this.selected = this.getSelectedTexture();
        this.unselected = this.getUnselectedTexture();
        this.backgroundTexture = this.getBackgroundTexture();

        this.gameTable = gameTable;

        this.colors = JSON.parse(JSON.stringify(Colors));
        this.colorPiclerPositions=[];

        this.redrawChooser({
            width:renderer.width,
            height:renderer.height
        });
    }

    /**
     * should be called by events, where redrawing is necessary,
     * e.g. color choosen or client added
     */
    onRedrawNecessaryHandler(){
        this.redrawChooser({
            width:this.renderer.width,
            height:this.renderer.height
        });
    }

    redrawChooser(evt){
        var center={
            x:evt.width/2,
            y:evt.height/2
        };

        this.removeAll();

        var bg = new PIXI.Sprite(this.backgroundTexture);
        bg.width = evt.width;
        bg.height = evt.height;
        bg.interactive=true;
        bg.mousemove =  (e) => e.stopped = true;//e.stopPropegation();
        this.addChild(bg);


        // calculate the positions of the picker buttons depending on screensize
        var radius = Math.min(evt.width,evt.height)/4;
        this.colorPiclerPositions = Util.pointsOfCircle(
            center.x,
            center.y,
            radius,
            Colors.length
        );

        // calculate the size of the picker buttons depending on the screen size
        var size = (2*Math.PI*radius) / this.colorPiclerPositions.length;
        size = (size - (size*PERCENT_PADDING));

        // set caption
        var cPixiText = new PIXI.Text(I18N.translate("choose_color"),{
            fontSize : size/2,
            fontFamily: Config.DEFAULT_FONT_FAMILY,
            fill : 0xFFFFFF
        });

        cPixiText.position.x = center.x-cPixiText.width/2;
        cPixiText.position.y = center.y-cPixiText.height/2 - radius-size;
        this.addChild(cPixiText);

        var assignments = this.playerManager.assignments;

        for(let j=0;j<this.colorPiclerPositions.length;j++){
            this._createSinglePicker(assignments,j,size);
        }


        var currentColor = this.playerManager.currentPlayer.color;
        if(typeof currentColor == 'number' && currentColor >= 0){
            // show abort butten, if user already has chosen a color
            this._createCancelButton(center,radius/1.5);
        }
    }

    _createCancelButton(position,size){
        var button = new PIXI.Container();
        var currentColor = new PIXI.Sprite(this.unselected);
      /*  var color = Util.parseColor(this.colors[j]);
        currentColor.tint = color;*/
        currentColor.anchor.set(0.5);
        currentColor.width = size;
        currentColor.height = size;

        button.position.x = position.x;
        button.position.y = position.y;
        button.interactive = true;

        button.addChild(currentColor);

        var oldScale = button.scale.x;    // scale is not exaclty 1,
                                                // setting whight and height previously changes the scale
                                                // so use this value for the mouse over effect

        button.mouseover = (e) => button.scale.set(oldScale+PERCENT_PADDING);
        button.mouseout = (e) => button.scale.set(oldScale);

        button.on('click',function(){
            this.emit(EVT_CANCELED,{source:this});
        }.bind(this),true);


        var cPixiText = new PIXI.Text(I18N.translate("back"),{
            fontSize : size/5,
            fontFamily: Config.DEFAULT_FONT_FAMILY,
            fill : 0
        });

        cPixiText.position.x = -cPixiText.width/2;
        cPixiText.position.y =  - cPixiText.height/2;

        button.addChild(cPixiText);
        this.addChild(button);
    }


    _createSinglePicker(assignments,j,size){
        var currentColor = new PIXI.Sprite(this.unselected);
        var color = Util.parseColor(this.colors[j]);
        currentColor.tint = color;
        currentColor.anchor.set(0.5);
        currentColor.width = size;
        currentColor.height = size;

        currentColor.position.x = this.colorPiclerPositions[j].x;
        currentColor.position.y = this.colorPiclerPositions[j].y;
        currentColor.interactive = true;

        this.addChild(currentColor);


        var oldScale = currentColor.scale.x;    // scale is not exaclty 1,
                                                // setting whight and height previously changes the scale
                                                // so use this value for the mouse over effect


        if(assignments.colors[color]){  // check if current color is currently assigned
            currentColor.scale.set(oldScale*0.7);
            currentColor.alpha = 0.4;
            return; // no input possible, if color is already assigned
        }

        currentColor.mouseover = (e) => currentColor.scale.set(oldScale+PERCENT_PADDING);
        currentColor.mouseout = (e) => currentColor.scale.set(oldScale);

        currentColor.on('click',function(){
            // do not send, if nothing has changed
            if(this.playerManager.currentPlayer.color == color) return;

            this.synchronizer.sendPlayerUpdate([
                {key:Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR,value:color}
            ]);
            this.emit(EVT_COLOR_SELECTED,{color:color});
        }.bind(this),true);
    }

    getUnselectedTexture(){
        var graphics = new PIXI.Graphics();
        graphics.lineStyle (BORDER_SIZE , 0x000000,  0.8);
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

    getBackgroundTexture(){
        var graphics = new PIXI.Graphics();
        // graphics.lineStyle (2 , 0x000000,  1);
        graphics.beginFill(0x000000,0.8);
        graphics.drawCircle(0,0, 1);

        return graphics.generateCanvasTexture(); //.generateTexture();
    }

}

module.exports = ColorChooser;