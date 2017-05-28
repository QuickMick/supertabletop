/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

var Packages = require("./../core/packages");
const uuidV4 = require('uuid/v4');
class ClientManager{

    constructor(){
        this.clients = {
            //ID:{socked:socked,position:pos,usw};
        };

        this.admin=null;
    }

    /**
     *  initializes this client on the server
     * @param socket
     * @param clientInfo
     */
    addClient(socket,clientInfo){
        this.clients[socket.id] = {
            socket:socket,
            id:socket.id,
            color:clientInfo.color,
            name:clientInfo.name,
            cursor:clientInfo.cursor,
            position:{x:0,y:0},
            verification:uuidV4() //clientInfo.verification
        };
    }

    doesClientExist(id){
        if(!id || id.length <=0 || !this.clients[id]){
            return false;
        }
        return true;
    }

    getPrivateClientInfo(id){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return;
        }
        var cur = this.clients[id];
        return {
            id:id,
            name:cur.name,
            color:cur.color,
            cursor:cur.cursor,
            vertification:cur.verification,
            admin:this.isAdmin(id,cur.verification)
        };
    }

    getPublicClientInfo(id){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return;
        }
        var cur = this.clients[id];
        return {
            id:id,
            name:cur.name,
            color:this.clients[id].color,
            admin:this.isAdmin(id,cur.verification)
        };
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
            result.push(this.getPublicClientInfo(key));
        }
        return result;
    }

    /**
     * Maps an id to the corresponding socked
     * @param id of the client
     * @returns {Socket}
     */
    getSocket(id){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return null;
        }
        return this.clients[id].socket;
    }

    /**
     * Maps an id to the corresponding mouse position
     * @param id of the client
     * @returns {Position}
     */
    getPosition(id){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return null;
        }
        return this.clients[id].position || {x:0,y:0};
    }

    /**
     * checks if the client is an admin
     * @param id of the client
     * @param vertification hash of the client
     * @returns {boolean} true, if the client is the admin
     */
    isAdmin(id,vertification){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return;
        }
        return this.admin == id && this.clients[id].vertification == vertification;
    }

    clientConnected(socket,clientInfo){
        this.addClient(socket,clientInfo);

        console.log("Connected: "+socket.id+" Users: "+Object.keys(this.clients).length);

        if(this.admin == null){
            this.admin = socket.id;
            console.log("Admin is now: "+this.admin);
        }
    }

    clientDisconnected(socket,data){
        console.log("disconnect: "+socket.id);

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