/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

const Util = require('./../core/util');
const Ticks = require('./../core/ticks.json');
const SharedConfig = require('./../core/sharedconfig.json');

var BadwordsFilter = require('bad-words');

const uuidV1 = require('uuid/v1');

var Rights = require('./../core/rights');

const RANDOM_NAMES = require('./../core/random_names.json');

class Client{
    constructor(socket,clientInfo){

        if(!socket || !clientInfo)
            throw "no socket or clientInfo, client cannot get instantiated";

        this.socket = socket;
        this.color = clientInfo.color || -1;
        this.name = clientInfo.name || "anonymous";
        this.userStatus = clientInfo.userStatus || Rights.RIGHTS.guest;
        this.cursor = clientInfo.cursor || "default";
        this.position = {x:0,y:0};
        this.playerIndex =-1;
        this.verification = uuidV1();
    }

    get ID(){
        return this.socket.id;
    }

    get privateInfo(){
        return {
            id:this.ID,
            name:this.name,
            userStatus:this.userStatus,
            color:this.color,
            cursor:this.cursor,
            playerIndex:this.playerIndex,
            token:this.verification
        };
    }

    get publicInfo (){
        return {
            id:this.ID,
            name:this.name,
            userStatus:this.userStatus,
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

        /**
         * contains all names, which are already used by another player.
         * NOTE: names are just stored in lowercase!
         * @type {{name,id}}
         */
        this.assignedNames = {};


        this._currentConnectionCount = 0;

        this.badWordsFilter = new BadwordsFilter();
    }

    get currentConnectionCount(){
        return this._currentConnectionCount;
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
        // assign prefered color to client
        // if it is not assigned already, if it is assigned, he has to choose another color
        if(typeof clientInfo.color == 'number' && clientInfo >=0  && !this.assignedColors[clientInfo.color] ){
            this.assignedColors[clientInfo.color] = socket.id;
        }else{
            clientInfo.color = -1;
        }



        if(clientInfo.playerIndex >=0){
            this.assignedPlayerIndexes[clientInfo.playerIndex] = clientInfo.playerIndex;
        }

        this.clients[socket.id] = new Client(socket,clientInfo);
        // if the name is not unique, make it unique
        this.clients[socket.id].name = this.getAlternativeNameIfOccupied(this.clients[socket.id].name);
        this.assignedNames[this.clients[socket.id].name.toLowerCase()] = socket.id;
     //   this.assignedNames[clientInfo.name.toLowerCase()] = socket.id;
    }

    doesClientExist(id){
        return (id && this.clients[id]);
    }

    verificateClient(id,token){
        return token && this.clients[id].verification == token;
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
     * @returns {string}
     */
    updateClientColor(id,color){
        if(!this.doesClientExist(id)){
            console.log("client",id,"does not exist");
            return "client_does_not_exist";
        }

        var c =Util.parseColor(color);

        if(this.assignedColors[c]){
            console.log("color",c,"already chosen by",this.assignedColors[c],"cannot be chosen from",id);
            return "color_already_chosen";
        }

        console.log("updated client",id," color:",color);

        // release old color
        var oldColor = this.getClient(id).color;
        if(oldColor >=0){
            delete this.assignedColors[oldColor];
        }

        this.clients[id].color = c;
        this.assignedColors[c] = id;
        return "";
    }

    /**
     * updates the playerindex of a client (aka the seat)
     * @param id
     * @param index
     * @returns {string} reson of rejection
     */
    updateClientIndex(id,index){
        if(!this.doesClientExist(id)){
            console.log("updateClientIndex: client",id,"does not exist");
            return "client_does_not_exist";
        }

        if(index >=Ticks.MAX_PLAYERS){
            console.log("updateClientIndex: client",id,"wants an index which is higher than the maximum player count",index);
            return "player_index_out_of_range";
        }

        if(this.assignedPlayerIndexes[index]){
            console.log("updateClientIndex: seat",index,"already chosen by",this.assignedPlayerIndexes[index],"cannot be chosen from",id);
            return "seat_already_occupied";
        }

        // release old index
        var oldIndex = this.getClient(id).playerIndex;
        if(oldIndex >=0){
            this.assignedPlayerIndexes[oldIndex]=false;
        }

        console.log("updated client",id,"player index index:",index);
        this.clients[id].playerIndex = index;
        this.assignedPlayerIndexes[index] = id; // seat is now taken
        return "";
    }


    /**
     * changes the clients name
     * @param id
     * @param name
     * @returns {string}
     */
    updateClientName(id,name){
        if(!this.doesClientExist(id)){
            console.log("updateClientIndex: client",id,"does not exist");
            return "client_does_not_exist";
        }

        if(!name){
            console.log("updateClientIndex: client",id," cannot have an empty name");
            return "no_name";
        }

        name = name || "";
        name = name.trim();

        // checkif name has correct langth
        if(!name
            || name.length <SharedConfig.MIN_NAME_LENGTH
            || name.length > SharedConfig.MAX_NAME_LENGTH
        ){
            return "incorrect_name_length";
        }

        // check just consists letters and digits
        if(!/^\w+$/.test(name)){
            return "incorrect_name_characters";
        }

        if(this.assignedNames[name]){
            return "name_already_occupied";
        }

        var curClient = this.getClient(id);
        var old = curClient.name;

        if(old == name){
            console.log("updateClientName: no change, now name equals old name");
            return "";
        }
        if(this.badWordsFilter.isProfane(name)){
            console.log("updateClientName: ",id," tried to chose a profane name");
            return "chosen_name_is_forbidden";
        }
        old = old.toLowerCase();
        // release old name TODO: evtl drin lassn?
        if(this.assignedNames[old]){
            delete this.assignedNames[old];
            this.assignedNames[name.toLowerCase()] = curClient.ID;
        }

        console.log("updateClientName: player",id,"changed name from",old,"to",name);

        return "";
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

        this._currentConnectionCount = Object.keys(this.clients).length;
        console.log("Connected: "+socket.id+" Users: "+this._currentConnectionCount);

        if(this.admin == null){
            this.admin = socket.id;
            console.log("Admin is now: "+this.admin);
        }
    }

    clientDisconnected(socket,data){
        console.log("disconnect: "+socket.id+" Users left: "+this._currentConnectionCount);

        //this.boradcastExceptSender(clientSocket,Packages.PROTOCOL.SERVER.CLIENT_DISCONNECTED,{msg:"",data:{id:clientSocket.id}});


        if (this.clients.hasOwnProperty(socket.id)) {
            this.assignedPlayerIndexes[this.clients[socket.id].playerIndex] = false;   // free the seat
            delete this.assignedColors[this.clients[socket.id].color];  // release color
            delete this.assignedNames[this.clients[socket.id].name];
            delete this.clients[socket.id];                             // remove client out of the list
        }

        this._currentConnectionCount = Object.keys(this.clients).length;

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


    /**
     * checks if the passed name is already occupied, if yes, create a new name
     * with just breakets and a number in them, e.g. mick (1)
     * @param name
     * @param i
     * @returns {string} the uniq name
     */
    getAlternativeNameIfOccupied(name){
        var result = name;
        var i=1;
        while(this.assignedNames[result.toLowerCase()]){
            result = name+" ("+i+")";
            i++;
        }
        return result;
    }

    /**
     * get a random name. If the name is already assigned, take another one
     * @returns {*}
     */
    getRandomName(i=0){
        var result = RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];

        if(i>5){    // if it is called mare then 5 times recursively, then combine two random names
            result = RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)]+"-"+RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)];
        }

        if(this.assignedNames[result.toLowerCase()]){
            i++;
            return this.getRandomName(i);
        }
        return result;
    }
}

module.exports =  ClientManager;