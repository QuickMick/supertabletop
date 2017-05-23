/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

module.exports =
{
    createEvent:function (id) {
        return {id:id,data:{}};
    },
    CLIENT_UPDATE_INTERVAL: 100,
    PROTOCOL: {
       CLIENT: {
           SEND_STATE: "send_state",
           USER_INFO: "userinfo",
        /*   CMD_RESULT: "cmd_result",
           DRAG_START: "DRAG_START",
           DRAG_MOVE: "DRAG_MOVE",
           DRAG_END: "DRAG_END",
           TURN_CARD: "TURN_CARD",
           CLIENT_MOUSE_MOVE: "CLIENT_MOUSE_MOVE"*/
       },
       SERVER: {
           UPDATE_STATE: "update_state",
           INIT_GAME: "init_game",
           CLIENT_CONNECTED: "CLIENT_CONNECTED",
           CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED"
      /*     EXECUTE_CMD: "execute_cmd",
           POSITION_UPDATE: "position_update",
           REMOVE_ENTITY: "remove_entity",
           ADD_ENTITY: "add_entity",

           VANISH: "VANISH",
           */
       }
    }
};