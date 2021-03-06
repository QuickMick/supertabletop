/**
 * Created by Mick on 22.05.2017.
 */
/**
 * Created by Mick on 18.12.2016.
 */

var EventEmitter = require('eventemitter3');
var InputAction = require('./inputaction');

const MOUSEMOVE= "mousemove";
const RAW_MOUSEMOVE = "rawmousemove";
const MOUSEWHEEL= "mousewheel";

class InputHandler extends EventEmitter{
    constructor(app,gameTable){
        super();

        this.app = app;
        // contains every keys, which are pressed since the last update cycle
        this.keyState = {
            keyboard_keys:{},
            mouse_buttons:{}
        };

        // contains the mouse position
        this.mouse = {
            lastX:0,
            lastY:0,
            x:0,
            y:0,
            dx:0,
            dy:0
        };

     /*   this.mouse_table = {
            lastX:0,
            lastY:0,
            x:0,
            y:0,
            dx:0,
            dy:0
        };*/

        this.mapping= null;

        this._init(app,gameTable);
    }


    _init(app,gameTable){
        //add key listeners
        // TODO: nichtmehr auf window lassen
        window.addEventListener("keydown", this._keyDown.bind(this), false);
        window.addEventListener("keyup", this._keyUp.bind(this), false);

        app.stage.interactive = true;
      //  gameTable.interactive = true;
        app.renderer.view.addEventListener("mousewheel", this._mouseWheelMove.bind(this), false);

        app.renderer.view.addEventListener("mousedown", this._mouseDown.bind(this),true);
        app.renderer.view.addEventListener("mouseup", this._mouseUp.bind(this),true);
        app.renderer.view.addEventListener("touchstart", this._mouseDown.bind(this), false);
        app.renderer.view.addEventListener("touchend", this._mouseUp.bind(this), false);

        app.stage
        // mouse move
            .on('mousemove', this._onMouseMove.bind(this), false)
            .on('touchmove', this._onMouseMove.bind(this), false);
/*
        // mouse down
            //.on('mousedown', this._mouseDown.bind(this), false)
          //  .on('rightclick', this._mouseDown.bind(this), false)
            .on('touchstart', this._mouseDown.bind(this), false)
            //TODO: mousedown wird nicht auserhalb von der stage getriggert
         //   .on('mouseupoutside', this._mouseUp.bind(this))
            .on('touchendoutside', this._mouseUp.bind(this))

          //  .on('mouseup', this._mouseUp.bind(this), false)
            .on('touchend', this._mouseUp.bind(this), false);*/
       // app.ticker.add(this.update.bind({self:this,app:app}));

     //   gameTable.on('mousemove', this._onTableMouseMove.bind(this), false)
        //    .on('touchmove', this._onTableMouseMove.bind(this), false)
    }

    /**
     * loads a keymapping from json, in expected format:
     *   "KEY_MAPPING":{
     *      "TURN":{"keyboard":[70],"mouse":[]},
     *      "MOUSE_LEFT":{"keyboard":[],"mouse":[0]}
     *    },
     * @param KEY_MAPPING
     */
    loadMapping(KEY_MAPPING){
        // load all keys located in config.json
        var keyMapping = {};
        for(let key in KEY_MAPPING){
            var cur = KEY_MAPPING[key];
            keyMapping[key] = new InputAction(key,cur.keyboard, cur.mouse);
        }
        this.setMapping(keyMapping);
    }

/*
    update(){
        this.self._onMouseMove({data:{global:this.app.renderer.plugins.interaction.mouse.global}});
    }*/


    _mouseWheelMove(evt){
        this.emit(MOUSEWHEEL,{delta:evt.deltaY});
    }

    setMapping(mapping){
        this.mapping = mapping;
    }

    _keyDown(event){
        this.keyState.keyboard_keys[event.keyCode] = true;
   //     event.preventDefault();
        this._processKeyInteraction();
    }

    _keyUp(event){
        if(this.keyState.keyboard_keys.hasOwnProperty(event.keyCode)) {
            delete this.keyState.keyboard_keys[event.keyCode];
        }
     //   event.preventDefault();
        this._processKeyInteraction();
    }

    _mouseDown(event){

        var btn = this._normalizeMouseKeyCode(event);
        if(btn < 0) return; // unknown input

        this.keyState.mouse_buttons[btn] = true;
      //  event.preventDefault();
        this._processKeyInteraction();
    }

    _mouseUp(event){
        var btn = this._normalizeMouseKeyCode(event);
        if(btn < 0) return; // unknown input

        if(this.keyState.mouse_buttons.hasOwnProperty(btn)) {
            delete this.keyState.mouse_buttons[btn];
        }
        this._processKeyInteraction();
     //   event.preventDefault();
    }

    /**
     * takes different mouseup/down event and returns the keycode
     * @param event
     * @returns {*}
     * @private
     */
    _normalizeMouseKeyCode(event){
        if(event.button || event.button == 0){
            return event.button;
        }else if(event.changedTouches && event.changedTouches.length > 0){
            return 0;
        }else if(event.data &&(event.data .button || event.data .button != 0)) {
            return event.data.button;
        }
        return -1;
    }

    _processKeyInteraction(){
        //return, if there is no mapping available
        if(! this.mapping) return;

        //update every key in the mapping
        for (let key in this.mapping) {
            if (!this.mapping.hasOwnProperty(key)) continue;
            this.mapping[key].update(this.keyState);
        }
    }

    _onMouseMove(evt) {
        var m = evt.data.global;

        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;

        this.mouse.x = m.x;
        this.mouse.y = m.y;

        // set the delta mouse movement
        this.mouse.dx = this.mouse.x - this.mouse.lastX;
        this.mouse.dy = this.mouse.y - this.mouse.lastY;

        if(this.mouse.dx != 0 || this.mouse.dy != 0 ){
            this.emit(MOUSEMOVE,this.mouse);
            this.emit(RAW_MOUSEMOVE,evt);
        }
    }
}

module.exports = InputHandler;