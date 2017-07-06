/**
 * Created by Mick on 22.06.2017.
 */

'use strict';

var Packages = require('./../../core/packages');
var Rights = require('./../../core/rights');
var BaseServerModule = require('./baseservermodule');

//var amqp = require('amqplib/callback_api');



var DBs = require('./../distributed/db.json');

/**
 * distributes the chat messages of the users
 */
class ChatModule extends BaseServerModule{

    constructor() {
        super();

        /**
         * connection the amqp message broker
         * @type {null}
         */
       // this.amqpConnection = null;

        /**
         * stores messages, if there is no connection available to the amqp broker
         * @type {Array}
         */
      //  this.offlineChatMessageQueue = [];

        /**
         * amqp chat message queue
         * @type {null}
         */
    //    this.chatBrokerChannel = null;

        /**
         * chat messwage message broker event
         * @type {null}
         */
        this.chatEvents = null;
    }

    /**
     * @Override
     * @param data
     */
    init(data){
        super.init(data);

        this.chatEvents = this.pubSub.event(DBs.messageBroker.pub_sub_events.chat_msg_evt);

        this.chatEvents.subscribe(data => {

            // skip chat messages from this server - they are processed directly
            if(data.senderID == this.SERVER_ID){
                return;
            }
            this._onChatMessageReceived.call({self:this},data,true);
        });

       /* amqp.connect(DBs.messageBroker.url+ "?heartbeat=60", (err, conn) => {
            if (err) {  // restart connecting procedure, if it was not possible to establish a connection
                console.error("[AMQP]", err.message);
                return setTimeout(start, 1000);
            }
            conn.on("error", function(err) {
                if (err.message !== "Connection closing") {
                    console.error("[AMQP] conn error", err.message);
                }
            });
            conn.on("close", function() {
                console.error("[AMQP] reconnecting");
                return setTimeout(start, 1000);
            });
            console.log("[AMQP] connected");
            this.amqpConnection = conn;
            this._messageBrokerConnected();
            this._createBrokerMessageConsumer();
        });*/
    }

    _messageBrokerConnected(){
     /*   this.amqpConnection.createConfirmChannel((err, ch) => {
            if (this._closeBrokerOnErr(err)) return;
            ch.on("error", function(err) {
                console.error("[AMQP] channel error", err.message);
            });
            ch.on("close", function() {
                console.log("[AMQP] channel closed");
            });

            this.chatBrokerChannel = ch;

            //send all messages which could not be sent, because the broker was offline
            while (true) {
                var m = this.offlineChatMessageQueue.shift();
                if (!m) break;
                this._publishBrokerChatMessage(m[0], m[1], m[2]);
            }
        });*/
    }
/*
    _createBrokerMessageConsumer(){
        this.amqpConnection.createChannel((err, ch) => {
            if (this._closeBrokerOnErr(err)) return;

            ch.on("error", function(err) {
                console.error("[AMQP] channel error", err.message);
            });
            ch.on("close", function() {
                console.log("[AMQP] channel closed");
            });

            ch.prefetch(10);
            ch.assertQueue(DBs.messageBroker.queues.chat_queue, { durable: true }, (err, _ok) => {
                if (this._closeBrokerOnErr(err)) return;
                ch.consume(DBs.messageBroker.queues.chat_queue, (msg)=>{
                    this._onBrokerChatMessageReceived(msg, (ok) =>{
                        try {
                            if (ok)
                                ch.ack(msg);
                            else
                                ch.reject(msg, true);
                        } catch (e) {
                            this._closeBrokerOnErr(e);
                        }
                    });
                }, { noAck: false });
                console.log("Worker is started");
            });
        });
    }

    _closeBrokerOnErr(err) {
        if (!err) return false;
        console.error("[AMQP] error", err);
        this.amqpConnection.close();
        return true;
    }

    _publishBrokerChatMessage(exchange, routingKey, content) {
        try {
            this.chatBrokerChannel.publish(exchange, routingKey, content, { persistent: true },
                (err, ok)=> {
                    if (err) {
                        console.error("[AMQP] publish", err);
                        this.offlineChatMessageQueue.push([exchange, routingKey, content]);
                        this.chatBrokerChannel.connection.close();
                    }
                });
        } catch (e) {
            console.error("[AMQP] publish", e.message);
            this.offlineChatMessageQueue.push([exchange, routingKey, content]);
        }
    }
*/

    tearDown(){
        super.tearDown();


   //     this.ampConnection.close();
    }

    onConnectionReceived(socket){
        // set the bound function as variable of the socket, so we can remove it later
        socket._onChatMessageReceived = this._onChatMessageReceived.bind({self:this,socket:socket});
        socket.on(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, socket._onChatMessageReceived);
    }

    onConnectionLost(socket){
        socket.removeListener(Packages.PROTOCOL.MODULES.CHAT.CLIENT_CHAT_MSG, socket._onChatMessageReceived);
        delete socket._onChatMessageReceived;
    }
/*
    _onBrokerChatMessageReceived(msg, callback){


        callback(true);
    }*/

    _onChatMessageReceived (evt,fromBroker) {
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

        if(!evt.data.message || typeof evt.data.message != "string"){
            return; // no chat message to share
        }

        evt.data.message = evt.data.message.trim(); //TODO: bad word filter?

        if(!fromBroker) {
            var user = this.socket.request.getNormalizedUser();

            var sendPackage = Packages.createEvent(
                this.self.SERVER_ID,
                {
                    clientID: user.id,// evt.senderID,
                    type:"user",
                    sender:{
                        name:user.displayName,
                        userStatus:user.status
                    },
                    message: evt.data.message
                }
            );

            this.self.chatEvents.publish(sendPackage);

            // broadcast chat message to every client on the server
            this.self._broadcast(    // if the change was valid, send everyone the new information
                Packages.PROTOCOL.MODULES.CHAT.SERVER_CHAT_MSG,
                sendPackage
            );
        }else{
            if( !evt.data.sender
                || !evt.data.sender.name
                || typeof evt.data.sender.name != "string"
               // || !evt.data.sender.userStatus
                || typeof evt.data.sender.userStatus != "number"
              //  || typeof  evt.data.sender.userStatus < 0
                || isNaN(evt.data.sender.userStatus)){ // unknown sender
                return;
            }
            if(!evt.data.clientID || typeof evt.data.clientID != "string"  || !evt.data.type || typeof evt.data.type != "string" ){
                return;
            }

           // evt.timeStamp = new Date().getTime(); // refresh timestamp

            this.self._broadcast(    // if the change was valid, send everyone the new information
                Packages.PROTOCOL.MODULES.CHAT.SERVER_CHAT_MSG,
                evt
            );
        }
        // broadcast message with every listener on the message queue



    }
}

module.exports = ChatModule;