/**
 * Created by Mick on 29.05.2017.
 */
'use strict';

var EventEmitter3 = require('eventemitter3');

var CursorLibrary = require('./../resources/resources.json').cursors.content;

const EVT_CUSOR_CHANGED = 'cursorchanged';

class CursorManager extends EventEmitter3{

    constructor(app){
        super();

        this.app = app;

        /**
         * contains the default cursor
         * @type {string} dataURL or cursor name, e.g. "pointer"
         */
        this.defaultCursor = null;

        /**
         * contains the mouse over cursor (hover)
         * @type {string} dataURL or cursor name, e.g. "pointer"
         */
       // this.hOverCursor = null;

        this._setDefault();
    }

    /**
     * sets the default cursor
     * @private
     */
    _setDefault(){
        this.defaultCursor = "default";
      //  this.hOverCursor = "pointer";
    }

    setDefault(){
        this._setDefault();
        // notify everyone, that the cursor has changed
        this.emit(EVT_CUSOR_CHANGED,{
            defaultCursor:this.defaultCursor
            //,hOverCursor:this.hOverCursor
        });
    }

    setCursor(cursorName){
        var cursor_defaultLib = CursorLibrary[cursorName] || CursorLibrary["default"];
      //  var cursor_hoverLib  = CursorLibrary[cursorName+"_hover"] || CursorLibrary["default_hover"];

        this._setDefault();


        // convert the default cursor
        if(cursor_defaultLib && PIXI.loader.resources[cursor_defaultLib.texture]){
            this.defaultCursor = this._convertImgToDataURLviaCanvas(cursor_defaultLib);
        }
        // set the cursor to the pixi canvas
        this.app.renderer.view.parentNode.style.cursor = this.defaultCursor;

        // set the hover curser
      /*  if(cursor_hoverLib && PIXI.loader.resources[cursor_hoverLib.texture]){
            this.defaultCursor = this._convertImgToDataURLviaCanvas(cursor_hoverLib);
        } // the hover cursor has to be set by hand to every element -> use the event
*/

        // notify everyone, that the cursor has changed
        this.emit(EVT_CUSOR_CHANGED,{
            defaultCursor:this.defaultCursor
            //,hOverCursor:this.hOverCursor
        });
    }

    /**
     * converts a loaded image from the pixi loader to the base64 format,
     * afterwards an url is created, which can be used as cursor
     * @param resName name of the available pixi loader resource
     * @param outputFormat optional
     * @returns {string}
     * @private
     */
    _convertImgToDataURLviaCanvas(cursorDef, outputFormat) {
        var curentResource = PIXI.loader.resources[cursorDef.texture];
        var img = curentResource.data;
        var width = curentResource.texture.width;
        var height = curentResource.texture.height;
        var anchor_x = curentResource.texture.width * (cursorDef.anchor.x || 0);
        var anchor_y = curentResource.texture.height * (cursorDef.anchor.y || 0);

        var canvas = document.createElement('CANVAS');
        var ctx = canvas.getContext('2d');
        canvas.height = height;
        canvas.width = width;
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL(outputFormat);
        canvas = null;
        return  "url('" + dataURL + "') " + anchor_x + " " + anchor_y + ", auto";
    }
}

module.exports = CursorManager;