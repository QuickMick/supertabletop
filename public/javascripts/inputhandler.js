/**
 * Created by Mick on 22.05.2017.
 */
/**
 * Created by Mick on 18.12.2016.
 */

var EventEmitter = require('eventemitter3');

const MOUSEMOVE= "mousemove";
const MOUSEWHEEL= "mousewheel";
class InputHandler extends EventEmitter{
    constructor(){
        super();
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

        this.mapping= null;
    }


    init(app){
        //add key listeners
        window.addEventListener("keydown", this._keyDown.bind(this), false);
        window.addEventListener("keyup", this._keyUp.bind(this), false);

        //add mouse listeners
    //    window.addEventListener("mousedown", this._mouseDown.bind(this), false);
     //   window.addEventListener("mouseup", this._mouseUp.bind(this), false);

        app.stage.interactive = true;

        document.addEventListener("mousewheel", this._mouseWheelMove.bind(this), false);


        app.stage
            // mouse move
            .on('mousemove', this._onMouseMove.bind(this), false)
            .on('touchmove', this._onMouseMove.bind(this), false)

        // mouse down
            .on('mousedown', this._mouseDown.bind(this), false)
            .on('rightclick', this._mouseDown.bind(this), false)
            .on('touchstart', this._mouseDown.bind(this), false)

            .on('mouseupoutside', this._mouseUp.bind(this))
            .on('touchendoutside', this._mouseUp.bind(this))
            .on('touchend', this._mouseUp.bind(this), false)
            .on('mouseup', this._mouseUp.bind(this), false);
       // app.ticker.add(this.update.bind({self:this,app:app}));
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
        this.keyState.mouse_buttons[event.data.button] = true;
      //  event.preventDefault();
        this._processKeyInteraction();
    }

    _mouseUp(event){
        if(this.keyState.mouse_buttons.hasOwnProperty(event.data.button)) {
            delete this.keyState.mouse_buttons[event.data.button];
        }

        this._processKeyInteraction();
     //   event.preventDefault();
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
          /*  if(this.onMouseMove){
                this.onMouseMove();
            }*/

            this.emit(MOUSEMOVE,this.mouse);
        }

    }
}

module.exports = new InputHandler();