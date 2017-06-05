/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

const Util = require('./../core/util');
const Ticks = require('./../core/ticks.json');

class Client{
    constructor(socket,clientInfo){

        if(!socket || !clientInfo)
            throw "no socket or clientInfo, client cannot get instantiated";

        this.socket = socket;
        this.color = clientInfo.color || -1;
        this.name = clientInfo.name || "anonymous";
        this.cursor = clientInfo.cursor || "default";
        this.position = {x:0,y:0};
        this.playerIndex =-1;
    }

    get ID(){
        return this.socket.id;
    }

    get privateInfo(){
        return {
            id:this.ID,
            name:this.name,
            color:this.color,
            cursor:this.cursor,
            playerIndex:this.playerIndex
        };
    }

    get publicInfo (){
        return {
            id:this.ID,
            name:this.name,
            color:this.color,
            cursor:this.cursor,
            playerIndex:this.playerIndex
        };
    }
}


class ClientManager{

    constructor(){
        this.clients = {};
        this.admin=null;

        /**
         * contains the player assignedPlayerIndexes aka seats, false means,
         * the seat is free, otherwise the id of the player will be put in the cell,
         * if an ID is in an array cell instead of "false" this means, the seat was taken by a user
         * @type {boolean[]}
         */
        this.assignedPlayerIndexes= [];
        for(var i=0; i< Ticks.MAX_PLAYERS;i++){
            this.assignedPlayerIndexes.push(false);
        }

        this.assignedColors = {};
    }
/*
    assignments(){
        return {
            assignedPlayerIndexes: this.assignedPlayerIndexes,
            assignedColors: this.assignedColors
        }
    }*/

    /**
     *  initializes this client on the server
     * @param socket
     * @param clientInfo
     */
    _addClient(socket, clientInfo){
        this.clients[socket.id] = new Client(socket,clientInfo);

        // assign prefered color to client
        if(typeof clientInfo.color == 'number' && clientInfo >=0){
            this.assignedColors[clientInfo.color] = socket.id;
        }
    }

    doesClientExist(id){
        return (id && this.clients[id]);
    }

    isClientReady(id){
        return  this.clients[id].playerIndex >=0 && this.clients[id].color >=0;
    }

    /**
     * @param id
     * @returns {Client} the client instance corresponding to the id
     */
    getClient(id){
        if(!id){
            console.warn("id does not exist");
            return null;
        }
        return this.clients[id];
    }

    /**
     * updates the color of an client
     * @param id
     * @param color
     * @returns {boolean}
     */
    updateClientColor(id,color){
        if(!this.doesClientExist(id)){
            console.log("client",id,"does not exist");
            return false;
        }

        var c =Util.parseColor(color);

        if(this.assignedColors[c]){
            console.log("color",c,"already chosen by",this.assignedColors[c],"cannot be chosen from",id);
            return false;
        }

        console.log("updated client",id," color:",color);

        this.clients[id].color = c;
        this.assignedColors[c] = id;
        return true;
    }

    /**
     * updates the playerindex of a client (aka the seat)
     * @param id
     * @param index
     * @returns {boolean}
     */
    updateClientIndex(id,index){
        if(!this.doesClientExist(id)){
            console.log("client",id,"does not exist");
            return false;
        }

        if(this.assignedPlayerIndexes[index]){
            console.log("seat",index,"already chosen by",this.assignedPlayerIndexes[index],"cannot be chosen from",id);
            return false;
        }

        console.log("updated client",id,"player index index:",index);
        this.clients[id].playerIndex = index;
        this.assignedPlayerIndexes[index] = id; // seat is now taken
        return true;
    }

    /**
     * returns all public info about all clients.
     * used to collect all info about players, when a new client connetcs
     * @param except = usually, this is the newly connected sender.
     * @returns {Array} info about all already connected clients
     */
    getAllPublicClientinfo(except){
        var result = [];
        for(var key in this.clients){
            if(!this.clients.hasOwnProperty(key) || (except && key == except)) continue;
            result.push(this.clients[key].publicInfo);
        }
        return result;
    }

    /**
     * checks if the client is an admin
     * @param id of the client
     * @param vertification hash of the client
     * @returns {boolean} true, if the client is the admin
     */
    isAdmin(id){
        if(!id){
            console.warn("id does not exist");
            return false;
        }
        return this.admin == id; // && this.clients[id].vertification == vertification;
    }

    clientConnected(socket,clientInfo){
        this._addClient(socket,clientInfo);

        console.log("Connected: "+socket.id+" Users: "+Object.keys(this.clients).length);


        if(this.admin == null){
            this.admin = socket.id;
            console.log("Admin is now: "+this.admin);
        }
    }

    clientDisconnected(socket,data){
        console.log("disconnect: "+socket.id+" Users left: "+Object.keys(this.clients).length);

        //this.boradcastExceptSender(clientSocket,Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,{msg:"",data:{id:clientSocket.id}});


        if (this.clients.hasOwnProperty(socket.id)) {
            this.assignedPlayerIndexes[this.clients[socket.id].playerIndex] = false;   // free the seat
            delete this.clients[socket.id];                             // remove client out of the list
        }

        // change addmin
        if(this.admin == socket.id){
            this.admin = null;
            var keys = Object.keys(this.clients);
            if(keys.length > 0) {
                this.admin = keys[0];
                //   this._sendToClient(this.connections[this.admin].socket,Statics.PROTOCOL.CLIENT.USERINFO,{admin:true});
                console.log("Admin is now: "+this.admin);
            }
        }
    }

    // -------------- updates---------

    /**
     *
     * @param userID
     * @param newPosition {object} looks like {position:{x:0:y:0]}
     * @returns {boolean} true, if positon has changed, false if not;
     */
    updateClientPosition(userID,newPosition){
        var cur = this.clients[userID];
        if(!cur) {
            console.warn("User ",userID," does not exist");
            return false;
        }

        if(!newPosition){
            console.warn("no position to update passed for id ",userID);
            return false;
        }

        if(cur.position.x == newPosition.x && cur.position.y == newPosition.y) {
            return false;
        }

        cur.position.x = newPosition.x || 0;
        cur.position.y = newPosition.y || 0;

        return true;
    }
}

module.exports =  ClientManager;