/**
 * Created by Mick on 22.06.2017.
 */

'use strict';

class BaseServerModule {

    constructor() {
        this.SERVER_ID = "";

        /* functions to send data, received from the server instance */
        this._broadcast = null;
        this._broadcastExpectSender = null;
        this._sendToClient = null;
    }

    init(data){
        this.SERVER_ID = data.SERVER_ID;
        this._broadcast = data._broadcast;
        this._broadcastExceptSender = data._broadcastExceptSender;
        this._sendToClient = data._sendToClient;
        this.pubSub = data._pubSub;
    }

    onConnectionReceived(socket){
        throw "abstract-method";
    }


    onConnectionLost(socket){
        throw "abstract-method";
    }

    tearDown(){
        //TODO: implement teardown method
    }
}

module.exports = BaseServerModule;