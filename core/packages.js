/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

module.exports =
{
    createEvent:function (id,data) {
        if(!data)
            console.warn("sending event to ",id," without data");
        return {senderID:id,data:data || {}};
    },
    CLIENT_UPDATE_INTERVAL: 100,
    //SERVER_ID: "SERVER",
    PROTOCOL: {
       CLIENT: {
           /**
            * used to notify server about changes (position, rotation,...) of entityies
            * from this client
            */
           SEND_STATE: "send_state",
           //SEND_CLIENT_SESSION:"send_client_session",

           /**
            * used to change configurations like the player color
            */
           SEND_CONFIG_CHANGE:"send_config_change"

        /*   CMD_RESULT: "cmd_result",
           DRAG_START: "DRAG_START",
           DRAG_MOVE: "DRAG_MOVE",
           DRAG_END: "DRAG_END",
           TURN_CARD: "TURN_CARD",
           CLIENT_MOUSE_MOVE: "CLIENT_MOUSE_MOVE"*/
       },
       SERVER: {
           /**
            * server sends this to the client, when he connects,
            * packags contains all necessary information about the client
            */
           RESPONSE_CLIENT_ACCEPTED: "RESPONSE_CLIENT_ACCEPTED",
           /**
            * broadcasts public information about a newly connected client
            */
           CLIENT_CONNECTED: "CLIENT_CONNECTED",

           /**
            * broadcasts that one client has disconnected
            */
           CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
           UPDATE_STATE: "update_state",
           INIT_GAME: "init_game",
           RESPONSE_CONFIG_CHANGE:"response_config_change",

           RESPONSE_CLIENT_REJECTED: "RESPONSE_CLIENT_REJECTED"


      /*     EXECUTE_CMD: "execute_cmd",
           POSITION_UPDATE: "position_update",
           REMOVE_ENTITY: "remove_entity",
           ADD_ENTITY: "add_entity",

           VANISH: "VANISH",
           */
       },
        ENTITY:{
            USER_DRAG:"ENTITY_DRAG",
            SERVER_POSITION_UPDATE:"SERVER_POSITION_UPDATE"
        }
    }
};