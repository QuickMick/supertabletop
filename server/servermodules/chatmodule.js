/**
 * Created by Mick on 22.06.2017.
 */

'use strict';

var Packages = require('./../../core/packages');
var Rights = require('./../../core/rights');
var BaseServerModule = require('./baseservermodule');

/**
 * distributes the chat messages of the users
 */
class ChatModule extends BaseServerModule{

    constructor() {
        super();

    }

    onConnectionReceived(socket){
        socket.on(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, this._onChatMessageReceived.bind({self:this,socket:socket}));
    }

    onConnectionLost(socket){
        socket.removeListener(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, this._onChatMessageReceived.bind({self:this,socket:socket}));
    }

    _onChatMessageReceived (evt) {
        if(!evt || !evt.data){
            console.log("CLIENT_CHAT_MSG: no data received");
            return;
        }

        /*
        if(!this.self.clientManager.doesClientExist(evt.senderID)){
            console.log("message received from not existing client!",evt.senderID);
            return;
        }

        if(!this.self.clientManager.verificateClient(evt.senderID,evt.token)){
            console.warn("User sends unverificated messages!",evt.senderID,this.socket.handshake.address,Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG);
            return;
        }*/

        if(!evt.data.message){
            return; // no chat message to share
        }


        var user = this.socket.request.user;

        if(!user){
            user  = {
                displayName: this.socket.request.session.guestName,
                status : 0 // 0 is equal to "guest"
            };
        }

        this.self._broadcast(    // if the change was valid, send everyone the new information
            Packages.PROTOCOL.MODULES.CHAT.SERVER_CHAT_MSG,
            Packages.createEvent(
                this.self.SERVER_ID,
                {
                    clientID: evt.senderID,
                    type:"user",
                    sender:{
                        name:user.displayName,
                        userStatus:user.status
                    },
                    message: evt.data.message
                }
            )
        );
    }
}

module.exports = ChatModule;