/**
 * Created by Mick on 22.05.2017.
 */
/**
 * Created by Mick on 18.12.2016.
 */

class InputHandler{
    constructor(){
        //add key listeners
        window.addEventListener("keydown", this._keyDown.bind(this), false);
        window.addEventListener("keyup", this._keyUp.bind(this), false);

        //add mouse listeners
        window.addEventListener("mousedown", this._mouseDown.bind(this), false);
        window.addEventListener("mouseup", this._mouseUp.bind(this), false);

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

    setMapping(mapping){
        this.mapping = mapping;
    }

    _keyDown(event){
        this.keyState.keyboard_keys[event.keyCode] = true;
   //     event.preventDefault();
        this.update();
    }

    _keyUp(event){
        if(this.keyState.keyboard_keys.hasOwnProperty(event.keyCode)) {
            delete this.keyState.keyboard_keys[event.keyCode];
        }
     //   event.preventDefault();
        this.update();
    }

    _mouseDown(event){
        this.keyState.mouse_buttons[event.button] = true;
      //  event.preventDefault();

        this.update();
    }

    _mouseUp(event){
        if(this.keyState.mouse_buttons.hasOwnProperty(event.button)) {
            delete this.keyState.mouse_buttons[event.button];
        }

        this.update();
     //   event.preventDefault();
    }

    update(){
        //return, if there is no mapping available
        if(! this.mapping) return;

        //update every key in the mapping
        for (let key in this.mapping) {
            if (!this.mapping.hasOwnProperty(key)) continue;
            this.mapping[key].update(this.keyState);
        }
    }

}

module.exports = new InputHandler();