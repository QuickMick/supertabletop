/**
 * Created by Mick on 18.12.2016.
 */

var EventEmitter = require('eventemitter3');

const PRESSED ="pressed";
const RELEASED = "released";
//const ISDOWN = "isdown";

class InputAction extends EventEmitter
{
    /**
     *
     * @param name: name of this action, e.g. walk_left
     */
    constructor(name,keys,mouseButtons){
        super();
        this.name = name;           // name of the action
        this.keyboard_keys = keys || [];    // all keycodes which are triggering this action
        this.mouse_buttons = mouseButtons || [];

        //current state of the key (pressed, or released)
        this.currentState = false;
        this.previousState = false;

    }

    /**
     * gives feedback about whether the key is pressed or not
     * @returns {boolean} true, when it is down
     */
    get isDown() {
        return this.currentState;
    }

    /**
     * @returns {boolean} is true, when the key was pressed in the last cycle
     */
    get wasPressed() {
        return (this.currentState) && (!this.previousState);
    }

    /**
     * @returns {boolean} true, when the key was released in this cycle
     */
    get wasReleased(){
        return (!this.currentState) && (this.previousState);
    }

    /**
     * resets the actions state
     */
    forceRelease(){
        this.currentState = false;
        this.previousState = false;
    }


    /**
     * adds a keyboard key to the action list.
     * if the state of this key chances, also the state of
     * this action changes.
     * @param key: keycode of the key
     */
    addKeyboardKey(keyCode)
    {
        if(this.keyboard_keys.indexOf(keyCode) == -1){
            this.keyboard_keys.push(keyCode);
        }
    }

    /**
     * removes a key from this action
     * @param keyCode the key
     */
    removeKeyboardKey(keyCode){
        this.keyboard_keys.remove(keyCode);
    }

    /**
     * checks if a key, which is pressd, is associated with this action.
     * @param keyState the current state of the pressed keys (received from the input handler)
     */
    update(keyState){
        // save back current state to old state
        this.previousState = this.currentState;
        this.currentState = false;

        // check if keyboard key is down
        for(let i=0; i < this.keyboard_keys.length;i++){
            if(keyState.keyboard_keys[this.keyboard_keys[i]]) {
                this.currentState = true;
               // this.emit(PRESSED,{keyboardKey:this.keyboard_keys[i],source:this});
                break;
            }
        }

        // check if mouse button is down
        for(let i=0; i < this.mouse_buttons.length;i++){
            if(keyState.mouse_buttons[this.mouse_buttons[i]]) {
                this.currentState = true;
              //  this.emit(PRESSED,{mouseKey:this.mouse_buttons[i],source:this});
                break;
            }
        }
        if(this.wasPressed){
            this.emit(PRESSED,{source:this});
        }else if(this.wasReleased){
            this.emit(RELEASED,{source:this});
        }
    }
}

module.exports = InputAction;