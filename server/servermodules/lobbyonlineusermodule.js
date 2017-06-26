/**
 * Created by Mick on 22.06.2017.
 */

'use strict';

var Packages = require('./../../core/packages');
var Rights = require('./../../core/rights');
var BaseServerModule = require('./baseservermodule');


/**
 * distributes the online user list, when a player connects an when it gets updated
 */
class LobbyOnlineUserModule extends BaseServerModule{

    constructor(userManager) {
        super();

        /**
         * contains all users which are currenlty in the lobby.
         * the users inside of this object are shared with the clients and displayed
         * in the "online user list"
         * @type {{}}
         */
        this.onlineUsers = {
            //id:{displayName:"",name:"",color:0,status:0},
        }
    }

    onConnectionReceived(socket){
        var currentUser = socket.getNormalizedUser();
        this._broadcastExceptSender(    // if the change was valid, send everyone the new information
            socket,
            Packages.PROTOCOL.MODULES.LOBBY_ONLINE_USERS.PLAYER_CONNECTS,
            Packages.createEvent(
                this.SERVER_ID,
                {
                    sender:{
                        displayName:currentUser.displayName,
                        name:currentUser.name,
                        status:currentUser.status,
                        color:currentUser.color
                    }
                }
            )
        );


        socket.request.session.isInLobby=this.SERVER_ID;

        // set the bound function as variable of the socket, so we can remove it later
        socket._onChatMessageReceived_BOUND = this._onChatMessageReceived.bind({self:this,socket:socket});
        socket.on(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, socket._onChatMessageReceived_BOUND);
    }

    onConnectionLost(socket){
        socket.removeListener(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, socket._onChatMessageReceived_BOUND);

        delete socket.request.session.isInLobby;

        var currentUser = socket.getNormalizedUser();
        this._broadcastExceptSender(    // if the change was valid, send everyone the new information
            socket,
            Packages.PROTOCOL.MODULES.LOBBY_ONLINE_USERS.PLAYER_DISCONNECTS,
            Packages.createEvent(
                this.SERVER_ID,
                {
                    sender:{
                        id:currentUser.id/*,
                        name:currentUser.displayName,
                        status:currentUser.status*/
                    }
                }
            )
        );
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
            Packages.PROTOCOL.CHAT.SERVER_CHAT_MSG,
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

module.exports = LobbyOnlineUserModule;