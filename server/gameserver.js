/**
 * Created by Mick on 19.05.2017.
 */
'use strict';

var Statics = require('./../core/statics');
var Globals = require('./globals');
var fs = require('fs');

/*
class ServerEntity{
    constructor(){
        this.texture_name="";
        this.id="";
        this.z_index=0;
        this.x=0;
        this.y=0;
        this.width=0;
        this.height=0;
        this.scale=1;
        this.isStackable=false;
    }
}*/

class GameServer{

    constructor(io){
        this.io = io;
        this.connections = {};

        this.lastID=0;

        this.entities={};

        this.game = null;
    }

    listen(){
        this.io.on('connection', this._connect.bind(this));

        this.loadGame("mick","codewords"); //TODO nicht statisch machen
    }

    loadGame(user,game){
        var resource_path = Globals.ROOT+"/public/"+Statics.PATHS.RESOURCE_PATH+"/"+user+"/"+game+"/"+Globals.GAME_DEFINITION_FILE; //path.join(global.appRoot, content_file);
        console.log("load game: "+resource_path);
        this.game = JSON.parse(fs.readFileSync(resource_path));

        var keys = Object.keys(this.entities);
        if(keys.length > 0) {
            this.boradcast(Statics.PROTOCOL.SERVER.VANISH, {msg: "", data: null});
        }
        this.entities={};


        for(var i=0; i< this.game.unstacked.length; i++){

            var c = this.game.unstacked[i];
            /* var e = new ServerEntity();
            e.x=c.position.x;
            e.y=c.position.y;
            e.width=100;
            e.height=100;
            e.texture_name="c1.png";*/



            this._addEntity(this._reviveEntity(this.game.object_def[c.type],c));
        }

/*
console.log(gameJSON);

        //TODO load --> _addEntity

        var e = new ServerEntity();
        e.x=100;
        e.y=100;
        e.width=100;
        e.height=100;
        e.texture_name="c1.png";
        this._addEntity(e);


        var e2 = new ServerEntity();
        e2.x=200;
        e2.y=100;
        e2.width=100;
        e2.height=100;
        e2.texture_name="c2.png";
        this._addEntity(e2);


        this.game = {
            entities:[e,e2],
            stacks:[],
            creator:"mick",
            game:"codewords"
        };

*/

        delete this.game.unstacked;
        delete this.game.stacked;

        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));


        this.boradcast(Statics.PROTOCOL.SERVER.INIT_GAME,{msg:"",data:this.game});

    }


    _reviveEntity(basetype,instance){
        // load the default entity
        let result = basetype;

        // take default entity
        result = JSON.parse(JSON.stringify(basetype));

     //   result.position = instance.position;

        //but override changes
        if(instance.overwrite) {
            for (let key in instance.overwrite) {
                if (!instance.overwrite.hasOwnProperty(key)) continue;
                result[key] = instance.overwrite[key];
            }
        }
        return result;
    }


    _addEntity(entity,synchronize_w_users=false){
        this.lastID++;
        entity.id=this.lastID;

        this.entities[this.lastID] = entity;

        if(synchronize_w_users) {
            this.boradcast(Statics.PROTOCOL.SERVER.ADD_ENTITY, {msg: "", data: entity});
        }
    }

     getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '0x';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    _connect(client){
        this._s_connected(client);
        client.on('disconnect', function(data){
            this._s_disconnected(client,data);
        }.bind(this));

       // client.on('event', function(data){console.log("evt")});

        client.on(Statics.PROTOCOL.CLIENT.DRAG_START,
            function(data){

                if(this.entities[data.data.id].grabbedBy) return;

                this.entities[data.data.id].alpha = data.data.alpha;
                this.entities[data.data.id].scale = data.data.scale;
                this.entities[data.data.id].grabbedBy = client.id;
                data.data.grabbedBy = client.id;
                this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_START,data);
            }.bind(this)
        );

        client.on(Statics.PROTOCOL.CLIENT.DRAG_END,
            function(data){
                if(this.entities[data.data.id].grabbedBy != client.id) return;
                this.entities[data.data.id].alpha = data.data.alpha;
                this.entities[data.data.id].scale = data.data.scale;
                this.entities[data.data.id].grabbedBy = undefined;
                this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_END,data);
            }.bind(this)
        );

        client.on(Statics.PROTOCOL.CLIENT.DRAG_MOVE,
            function(data){
            if(this.entities[data.data.id].grabbedBy != client.id) return;
                this.entities[data.data.id].position.x = data.data.x;
                this.entities[data.data.id].position.y = data.data.y;
                this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.DRAG_MOVE,data);
            }.bind(this)
        );

        client.on(Statics.PROTOCOL.CLIENT.TURN_CARD,
            function(data){
                if(this.entities[data.data.id].grabbedBy && this.entities[data.data.id].grabbedBy != client.id) return;
                this.entities[data.data.id].top = data.data.top;
                this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.TURN_CARD,data);
            }.bind(this)
        );


        client.on(Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,
            function(data){
                data.data.id = client.id;
                this.boradcastExceptSender(client,Statics.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE,data);
            }.bind(this)
        );



        for (var k in this.entities) {
            if (!this.entities.hasOwnProperty(k))
                continue;
            this._sendToClient(client,Statics.PROTOCOL.SERVER.ADD_ENTITY,{msg:"",data:this.entities[k]});
        }

    }

    _s_connected(clientSocket){
        var rc = this.getRandomColor();
        var name = "ranz";
        this.boradcastExceptSender(clientSocket,Statics.PROTOCOL.SERVER.CLIENT_CONNECTED,{msg:"",data:{id:clientSocket.id,color:rc,name:name}});

        this.connections[clientSocket.id] = {socket:clientSocket,color:rc,name:name};
        console.log("Connected: "+clientSocket.id+" Users: "+Object.keys(this.connections).length);

        if(this.admin == null){
            this.admin = clientSocket.id;
            console.log("Admin is now: "+this.admin);
        }


        this._sendToClient(clientSocket,Statics.PROTOCOL.CLIENT.USER_INFO,{msg:"",data:{user_id:clientSocket.id,admin:this.admin == clientSocket.id}}); // true, wenn connected is admin


        this.game.entities = Object.keys(this.entities).map(function(key) {
            return this.entities[key];
        }.bind(this));
        this._sendToClient(clientSocket,Statics.PROTOCOL.SERVER.INIT_GAME,{msg:"",data:this.game});


        var keys = Object.keys(this.connections);
        for(var i=0; i<keys.length;i++){
            if(keys[i] == clientSocket.id)continue;
            this._sendToClient(clientSocket,Statics.PROTOCOL.SERVER.CLIENT_CONNECTED ,{msg:"",data: {id:keys[i],color:this.connections[keys[i]].color}});
        }

    }

    _s_disconnected(clientSocket,data){
        console.log("disconnect: "+clientSocket.id);

        this.boradcastExceptSender(clientSocket,Statics.PROTOCOL.SERVER.CLIENT_DISCONNECTED,{msg:"",data:{id:clientSocket.id}});

        if (this.connections.hasOwnProperty(clientSocket.id)) {
            delete this.connections[clientSocket.id];
        }

        if(this.admin == clientSocket.id){
            this.admin = null;
            var keys = Object.keys(this.connections);
            if(keys.length > 0) {
                this.admin = keys[0];
             //   this._sendToClient(this.connections[this.admin].socket,Statics.PROTOCOL.CLIENT.USERINFO,{admin:true});
                console.log("Admin is now: "+this.admin);
            }

        }
    }

    boradcast(type,msg){
        this.io.sockets.emit(type,msg);
    }

    boradcastExceptSender(senderSocket,type,msg){
        senderSocket.broadcast.emit(type,msg);
    }

    _sendToClient(clientConnectionSocket,type,msg){
        clientConnectionSocket.emit(type,msg);
    }
}

module.exports = GameServer;