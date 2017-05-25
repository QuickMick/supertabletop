/**
 * Created by Mick on 24.05.2017.
 */
'use strict';

var Packages = require("./../core/packages");
const uuidV4 = require('uuid/v4');
class ClientManager{

    constructor(){
        this.clients = {
            //ID:socked;
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
            verification:uuidV4() //clientInfo.verification
        };
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
            color:this.clients[id].color,
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
     * Maps an id to the corresponding socked
     * @param id of the client
     * @returns {Socket}
     */
    getSocket(id){
        if(!id || id.length <=0){
            console.warn("id does not exist");
            return;
        }
        return this.clients[id].socket;
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

    updateClientPosition(userID,newPosition){
        console.log(userID,newPosition);
    }
}

module.exports =  ClientManager;