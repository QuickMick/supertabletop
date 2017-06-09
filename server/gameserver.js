/**
 * Created by Mick on 19.05.2017.
 */
'use strict';

const Ticks = require('./../core/ticks.json');

var Packages = require('./../core/packages');
var Util = require('./../core/util');

var Rights = require('./../core/rights');

const uuidV1 = require('uuid/v1');

var UpdateQueue = require("./../core/updatequeue");
var EntityServerManager = require('./entityservermanager');
var ClientManager = require('./clientmanager');

class GameServer{
    constructor(io){
       // this.io = io;
        this.ID = uuidV1();
        this.clientManager = new ClientManager();
        this.updateQueue =  new UpdateQueue();
        this.entityServerManager = new EntityServerManager(60,this.updateQueue,this.clientManager,this);
        this.entityServerManager.on('afterUpdate',this._processReceivedUpdateQueue.bind(this));

        /**
         * all updates, which are received by the clients are stored in this array
         * and processed, before a physic engines step
         * @type {Array}
         */
        this.receivedUpdateQueue = [];

        setInterval(this._sendEntityUpdates.bind(this), Ticks.SERVER_UPDATE_INTERVAL);

        this.entityServerManager.loadGame("mick","codewords"); //TODO nicht statisch machen und durch user triggern lassen

        /**
         * contains all sockets of the connected clients
         * necessary for broadcast
         * @type {Array}
         */
        this.allSockets = [];
    }


/*
    start(){
        this.io.on('connection', this._onConnectionReceived.bind(this));
        setInterval(this._sendEntityUpdates.bind(this), Ticks.SERVER_UPDATE_INTERVAL);

        this.entityServerManager.loadGame("mick","codewords"); //TODO nicht statisch machen und durch user triggern lassen

    }*/

    /**
     * processes the received updates
     * @private
     */
    _processReceivedUpdateQueue(){
        var currentQueue = this.receivedUpdateQueue;
        this.receivedUpdateQueue = [];
        for(var i=0; i< currentQueue.length;i++){
            this._processUpdates(currentQueue[i]);
        }
    }

    /**
     * Broadcasts the recent updates to all clients,
     * is called in an regular interval
     * @private
     */
    _sendEntityUpdates(){
        if(!this.updateQueue.updateRequired) return;

        this._boradcast(Packages.PROTOCOL.SERVER.UPDATE_STATE,Packages.createEvent(
            this.ID,
            this.updateQueue.popUpdatedData()
            )
        );
    }

    get currentConnectionCount(){
        return this.clientManager.currentConnectionCount;
    }

    get isServerFull(){
        return this.clientManager.currentConnectionCount >= Ticks.MAX_PLAYERS;
    }

    /**
     * is called once for every client who connects,
     * everything necessary for the gameplay / client is initialized here
     * @param socket of the connected client
     * @private
     */
    onConnectionReceived(socket) {
        // disconnect a new connection, when server is full
        if(this.isServerFull){
            console.warn("player limit reached, new request has to be prohibited");
            socket.disconnect();
            return;
        }

      //  if(socket.handshake.address.includes("109.193.174.201")) return;
        this.allSockets.push(socket);
        this._initClient(socket);

        //removes this client from the serverclient list and broadcasts the information to all remaining clients
        socket.on('disconnect', this._onDisconnect.bind({self:this,socket:socket}));

        socket.on(Packages.PROTOCOL.CLIENT.CLIENT_VALUE_UPDATE, this._onValueUpdateReceived.bind({self:this,socket:socket}));

        socket.on(Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG, this._onChatMessageReceived.bind({self:this,socket:socket}));

        // server receives client entity updates in this event
        socket.on(Packages.PROTOCOL.CLIENT.SEND_STATE, this._onClientStateUpdate.bind({self:this,socket:socket}));
    }

    /** removes all listeners */
    onConnectionLost(socket){
        socket.removeListener('disconnect', this._onDisconnect.bind({self:this,socket:socket}));

        socket.removeListener(Packages.PROTOCOL.CLIENT.CLIENT_VALUE_UPDATE, this._onValueUpdateReceived.bind({self:this,socket:socket}));

        socket.removeListener(Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG, this._onChatMessageReceived.bind({self:this,socket:socket}));

        // server receives client entity updates in this event
        socket.removeListener(Packages.PROTOCOL.CLIENT.SEND_STATE, this._onClientStateUpdate.bind({self:this,socket:socket}));
    }

    _onDisconnect (data) {
        if(!data){
            console.log("disconnect: no data received");
            return;
        }

        this.self.onConnectionLost(this.socket);

        if(!this.self.clientManager.doesClientExist(this.socket.id)){
            console.log("user who disconnects does not exist!");
            return;
        }

        this.self.allSockets = Util.removeByValue(this.self.allSockets,this.socket);

        this.self.entityServerManager.releaseAllContraintsForUser(this.socket.id);
        this.self.clientManager.clientDisconnected(this.socket, data);
        this.self._boradcastExceptSender(
            this.socket,
            Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,
            Packages.createEvent(
                this.self.ID,
                {id: this.socket.id}
            )
        );
    }

    _onValueUpdateReceived (evt) {
        if(!evt || !evt.data){
            console.log("CLIENT_VALUE_UPDATE: no data received");
            return;
        }
        if(!this.self.clientManager.doesClientExist(evt.senderID)){
            console.log("message received from not existing client!",evt.senderID);
            return;
        }

        if(!this.self.clientManager.verificateClient(evt.senderID,evt.token)){
            console.warn("User sends unverificated messages!",evt.senderID,this.socket.handshake.address,Packages.PROTOCOL.CLIENT.CLIENT_VALUE_UPDATE);
            return;
        }

        var violations = this.self._processClientValueUpdates(evt);
        if(violations.length <=0) {
            this.self._boradcast(    // if the change was valid, send everyone the new information
                Packages.PROTOCOL.SERVER.CLIENT_VALUE_UPDATE,
                Packages.createEvent(
                    this.self.ID,
                    {
                        clientID: evt.senderID,
                        changes: evt.data
                    }
                )
            );
        }else{  // otherwise send the rejection reasons
            this.self._sendToClient(
                this.socket,
                Packages.PROTOCOL.SERVER.CLIENT_VALUE_UPDATE_REJECTED,
                Packages.createEvent(
                    this.self.ID,
                    {
                        violations: violations
                    }
                )
            );
        }
    }

    _onChatMessageReceived (evt) {
        if(!evt || !evt.data){
            console.log("CLIENT_CHAT_MSG: no data received");
            return;
        }
        if(!this.self.clientManager.doesClientExist(evt.senderID)){
            console.log("message received from not existing client!",evt.senderID);
            return;
        }

        if(!this.self.clientManager.verificateClient(evt.senderID,evt.token)){
            console.warn("User sends unverificated messages!",evt.senderID,this.socket.handshake.address,Packages.PROTOCOL.CHAT.CLIENT_CHAT_MSG);
            return;
        }

        if(!evt.data.message){
            return; // no chat message to share
        }

        this.self._boradcast(    // if the change was valid, send everyone the new information
            Packages.PROTOCOL.CHAT.SERVER_CHAT_MSG,
            Packages.createEvent(
                this.self.ID,
                {
                    clientID: evt.senderID,
                    type:"user",
                    message: evt.data.message
                }
            )
        );
    }

    _onClientStateUpdate(evt) {
        if(!evt || !evt.data){
            console.log("SEND_STATE: no data received");
            return;
        }
        if(!this.self.clientManager.doesClientExist(evt.senderID)){
            console.log("message received from not existing client!",evt.senderID);
            return;
        }

        if(!this.self.clientManager.verificateClient(evt.senderID,evt.token)){
            console.warn("User sends unverificated messages!",evt.senderID,this.socket.handshake.address,Packages.PROTOCOL.CLIENT.SEND_STATE);
            return;
        }

        // the received updates are processes everytime before the engine is processed.
        this.self.receivedUpdateQueue.push(evt.data);
    }

    /**
     *
     * @returns {[]} returns an empty array, if everything is valid, otherwise, an array with rejection reasons is returned
     * @private
     */
    _processClientValueUpdates(evt){
        var result = [];
        for(var i=0; i<evt.data.length;i++) {
            var cur = evt.data[i];
            var rejectionReason = null;
            switch (cur.key) {
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.COLOR:
                    rejectionReason=this.clientManager.updateClientColor(evt.senderID, cur.value);
                    break;
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.PLAYER_INDEX:
                    rejectionReason = this.clientManager.updateClientIndex(evt.senderID, cur.value);
                    break;
                case Packages.PROTOCOL.CLIENT_VALUE_UPDATE.NAME:
                    rejectionReason = this.clientManager.updateClientName(evt.senderID, cur.value);
                    break;
            }

            if(rejectionReason){
                result.push({key:cur.key,reason:rejectionReason});
            }
        }

        return result;
    }

    /**
     * process the posted updates of all players
     * @param data
     * @private
     */
    _processUpdates(data){
        for(var type in data){
            if(!data.hasOwnProperty(type)) continue;
            for(var id in data[type]) {
                if(!data[type].hasOwnProperty(id)) continue;

                if(!this.clientManager.doesClientExist(id)){
                    console.log("_processUpdates: user does not exist!");
                    continue;
                }

                if(!this.clientManager.isClientReady(id)){
                    //console.log("_processUpdates: client",id,"is not ready");
                    continue;
                }

                switch (type) { // claim and release entiy is updaated first, becuase the other functions need the claim

                    // an user copys an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_COPY_ENTITY:
                        this.entityServerManager.copyEntities(id,data[type][id].copyRequest);
                        break;
                    // an user claimes an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_CLAIM_ENTITY:
                        this.entityServerManager.claimEntity(id, data[type][id].claimedEntity);
                        break;
                    // user wants to stack two entities
                    // has to be before releasing, because releasing signal just is send after stacking signal
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_STACK_ENTITY:
                        this.entityServerManager.batchStackEntities(id, data[type][id]);
                        break;
                    // an user releases an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_RELEASE_ENTITY:
                        this.entityServerManager.releaseEntities(id, data[type][id].releasedEntities);
                        break;
                    // an user wants to rotate an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_ROTATE_ENTITY:
                        this.entityServerManager.batchRotateEntities(id, data[type][id]);
                        break;
                    // am user wants to turn an entity
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_TURN_ENTITY:
                        this.entityServerManager.batchTurnEntities(id, data[type][id]);
                        break;
                    case Packages.PROTOCOL.GAME_STATE.ENTITY.USER_DRAW_ENTITY:
                        this.entityServerManager.batchDrawFromStack(id, data[type][id].drawFromStacks);
                        break;
                    // an user moves his mouse
                    case Packages.PROTOCOL.GAME_STATE.CLIENT.USER_POSITION_CHANGE:
                        var changed = this.clientManager.updateClientPosition(id,data[type][id].position);
                        this.entityServerManager.batchSetRelativeConstraintPosition(id,data[type][id].relativePositions);
                        // distribute the new position to every other users
                        if(changed) {
                            this.updateQueue.postUpdate(
                                Packages.PROTOCOL.GAME_STATE.CLIENT.SERVER_CLIENT_POSITION_UPDATE,
                                id,
                                data[type][id].position
                            );
                        }
                        break;
                }
            }
        }
    }
/*
    imageExists(image_url){

        var http = new XMLHttpRequest();

        http.open('HEAD', image_url, false);
        http.send();

        return http.status != 404;

    }*/

    /**
     * a new client enters the server,
     * distribute the information about the client to itself and to every other player
     * @param socket
     */
    _initClient(socket){
        // TODO: load clientinfo from database
        var clientInfo = {
            //name:"mick"
            //,cursor:"default"
            //,userStatus:Rights.RIGHTS.guest
            //,color:Util.getRandomColor()
        };

        // if user has no cursor, give him the default cursor
      /*  if(!clientInfo.cursor){
            clientInfo.cursor="default";
        }

        // if user has no rights, give im the lowest one
        if(!clientInfo.userStatus){
            clientInfo.userStatus = Rights.RIGHTS.guest;
        }*/

        // if the user is a guest, give him a random name
        if(!clientInfo.name || clientInfo.userStatus==Rights.RIGHTS.guest){
            clientInfo.name = this.clientManager.getRandomName();
        }

        // connect client to this server
        this.clientManager.clientConnected(socket,clientInfo);

        // share info with client (that he is connected and his own info)
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.RESPONSE_CLIENT_ACCEPTED,
            Packages.createEvent(
                this.ID,
                {
                    clientInfo:this.clientManager.getClient(socket.id).privateInfo,
                 //   assignments:this.clientManager.assignments(),
                    serverID: this.ID
                }
            )
        );

        // share info about all other players with newly connected client
        var alreadyKnownClients = this.clientManager.getAllPublicClientinfo(socket.id);
        if(alreadyKnownClients && alreadyKnownClients.length >0) {
            this._sendToClient(
                socket,
                Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,
                Packages.createEvent(
                    this.ID,
                    this.clientManager.getAllPublicClientinfo(socket.id)
                )
            );
        }

        // share public info of newly connected client with everyone
        this._boradcastExceptSender(
            socket,
            Packages.PROTOCOL.SERVER.CLIENT_CONNECTED,
            Packages.createEvent(
                this.ID,
                [this.clientManager.getClient(socket.id).publicInfo]
            )
        );

        // share info about the current serverstate with the newly connected client
        this._sendToClient(
            socket,
            Packages.PROTOCOL.SERVER.INIT_GAME,
            Packages.createEvent(
                this.ID,
                this.entityServerManager.getCurrentGameState()
            )
        );
    }


    _boradcast(type,msg){
        for(var i=0; i<this.allSockets.length;i++){
            this._sendToClient(this.allSockets[i],type,msg);
        }
        //this.io.sockets.emit(type,msg);
    }

    _boradcastExceptSender(senderSocket,type,msg){
        for(var i=0; i<this.allSockets.length;i++){
            var cur = this.allSockets[i];
            if(cur == senderSocket) continue;
            this._sendToClient(cur,type,msg);
        }
    }

    _sendToClient(clientConnectionSocket,type,msg){
        clientConnectionSocket.emit(type,msg);
    }
}

module.exports = GameServer;