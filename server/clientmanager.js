/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

class Client{
    constructor(socket,clientInfo){

        if(!socket || !clientInfo)
            throw "no socket or clientInfo, client cannot get instantiated";

        this.socket = socket;
        this.color = clientInfo.color || 0;
        this.name = clientInfo.name || "anonymous";
        this.cursor = clientInfo.cursor || "default";
        this.position = {x:0,y:0};
    }

    get ID(){
        return this.socket.id;
    }

    get privateInfo(){
        return {
            id:this.ID,
            name:this.name,
            color:this.color,
            cursor:this.cursor
        };
    }

    get publicInfo (){
        return {
            id:this.ID,
            name:this.name,
            color:this.color,
            cursor:this.cursor
        };
    }

}


class ClientManager{

    constructor(){
        this.clients = {};
        this.admin=null;
    }

    /**
     *  initializes this client on the server
     * @param socket
     * @param clientInfo
     */
    _addClient(socket, clientInfo){
        this.clients[socket.id] = new Client(socket,clientInfo);
    }

    doesClientExist(id){
        return (id && this.clients[id]);
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

        // remove client out of the list
        if (this.clients.hasOwnProperty(socket.id)) {
            delete this.clients[socket.id];
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