/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

module.exports =
{
    createEvent: function (id, data, token) {
        if (!data)
            console.warn("sending event to ", id, " without data");
        var result = {
            senderID: id,
            data: data || {},
            timeStamp: new Date().getTime()
        };
        if (token) result.token = token;
        return result;
    },
    NAMESPACES:{
        GAME:"/game",
        LOBBY:"/lobby"
    },
    PROTOCOL: {
        MODULES: {
            LOBBY_ONLINE_USERS: {
                PLAYER_CONNECTS: "M_L_O_U_PLAYER_CONNECTS",
                PLAYER_DISCONNECTS: "M_L_O_U_PLAYER_DISCONNECTS"
            },
            CHAT: {
                /**
                 * the client wants to post a chat message
                 */
                CLIENT_CHAT_MSG: "M_C_CLIENT_CHAT_MSG",
                /**
                 * a message from the server which should be postet in the chat window
                 */
                SERVER_CHAT_MSG: "M_C_SERVER_CHAT_MSG"
            }
        },
        // CHAT: {
        //     /**
        //      * the client wants to post a chat message
        //      */
        //     CLIENT_CHAT_MSG: "CLIENT_CHAT_MSG",
        //     /**
        //      * a message from the server which should be postet in the chat window
        //      */
        //     SERVER_CHAT_MSG: "SERVER_CHAT_MSG"
        // },
        CLIENT_VALUE_UPDATE: {
            COLOR: "color",
            PLAYER_INDEX: "playerIndex",
            NAME: "name"
        },
        CLIENT: {
            /**
             * used to notify server about changes (position, rotation,...) of entityies
             * from this client
             */
            SEND_STATE: "send_state",
            //SEND_CLIENT_SESSION:"send_client_session",


            /**
             * a client changes a value of himselfe, for example, the color
             */
            CLIENT_VALUE_UPDATE: "CLIENT_VALUE_UPDATE",

            /**
             * used to change configurations like the player color
             */
            SEND_CONFIG_CHANGE: "send_config_change"

            /*   CMD_RESULT: "cmd_result",
             DRAG_START: "DRAG_START",
             DRAG_MOVE: "DRAG_MOVE",
             DRAG_END: "DRAG_END",
             TURN_CARD: "TURN_CARD",
             CLIENT_MOUSE_MOVE: "CLIENT_MOUSE_MOVE"*/
        },
        GAME_SERVER_ERRORS: {
            NO_FREE_SLOT_AVAILABLE: "NO_FREE_SLOT_AVAILABLE",
            GAME_NOT_FOUND: "GAME_NOT_FOUND"
        },
        SERVER: {
            ERROR: "ERROR",
            /**
             * server sends this to the client, when he connects,
             * packags contains all necessary information about the client
             * package looks like {clientInfo:<object of client info>,serverID:<string, id of server>
            */
            RESPONSE_CLIENT_ACCEPTED: "RESPONSE_CLIENT_ACCEPTED",
            /**
             * broadcasts public information about a newly connected client
             */
            CLIENT_CONNECTED: "CLIENT_CONNECTED",

            /**
             * a client wanted to change a vlaue, but the server rejects the change
             * package looks like{CLIENT_VALUE_UPDATE_NAME,reason}
             */
            CLIENT_VALUE_UPDATE_REJECTED: "CLIENT_VALUE_UPDATE_REJECTED",
            /**
             * a client changes a value of himselfe, for example, the color
             */
            CLIENT_VALUE_UPDATE: "CLIENT_VALUE_UPDATE",

            /**
             * broadcasts that one client has disconnected
             */
            CLIENT_DISCONNECTED: "CLIENT_DISCONNECTED",
            UPDATE_STATE: "update_state",
            INIT_GAME: "init_game",
            RESPONSE_CONFIG_CHANGE: "response_config_change",

            RESPONSE_CLIENT_REJECTED: "RESPONSE_CLIENT_REJECTED"


            /*     EXECUTE_CMD: "execute_cmd",
             POSITION_UPDATE: "position_update",
             REMOVE_ENTITY: "remove_entity",
             ADD_ENTITY: "add_entity",

             VANISH: "VANISH",
             */
        },
        GAME_STATE: {
            ENTITY: {
                /**
                 * is posted by client, when entity gets dragged
                 */
                USER_CLAIM_ENTITY: "ENTITY_DRAG_START",

                /**
                 * is posted by client, when entity is not dragged anymore
                 */
                USER_RELEASE_ENTITY: "ENTITY_DRAG_END",

                /**
                 * is posted by client, when he rotates an entity
                 * {rotatedEntites:[<list of entity ids>], rotationAmount:<amount of rotation>}
                 */
                USER_ROTATE_ENTITY: "USER_ROTATE_ENTITY",

                /**
                 * is posted by server, when an entity moves or rotates
                 */
                SERVER_ENTITY_TRANSFORMATION_UPDATE: "SERVER_ENTITY_TRANSFORMATION_UPDATE",

                /**
                 * a user wants to copy an entity
                 * package looks like (copyRequest:[enityID,position])
                 */
                USER_COPY_ENTITY: "USER_COPY_ENTITY",

                /**
                 * is posted by server, when an entity is deleted,
                 * data just contains the deleted entities id
                 */
                SERVER_ENTITY_REMOVED: "SERVER_ENTITY_REMOVED",

                /**
                 * is posted by server, when an entity is added,
                 * package contains all data of the entitys
                 * package looks like {newEntities:<array of new entities>}
                 */
                SERVER_ENTITY_ADDED: "SERVER_ENTITY_ADDED",

                /**
                 * a user warns to turn a card,
                 * userID and entity in the package
                 * {turnedEntities:[<ids of entities>],surface:<index, or "next", "previous" or "random">}
                 */
                USER_TURN_ENTITY: "USER_TURN_ENTITY",

                /**
                 * is posted by a user, who wants to draw a card,
                 * package looks like  {stackIDs:<ids of stacks from which the user wants to draw a card>}
                 */
                USER_DRAW_ENTITY: "USER_DRAW_ENTITY",

                /**
                 * user wants to stack two entities,
                 * the ids of the entities are in the package
                 * looks like
                 * {
                 *  stackPairs: {
                 *      sourceID: selectedEntity.ENTITY_ID,
                 *      targetID: target.ENTITY_ID,
                 *      }
                 *  }
                 */
                USER_STACK_ENTITY: "USER_STACK_ENTITY",

                /**
                 * is postet from the server, if a value of an entity has changed,
                 * works basically like the replacer of the entity loader,
                 * event data contains the entity IDs as key and the updated data paths as value (e.g. {"enitty1":{changes:{"surface.0":<data>}}}
                 */
                SERVER_ENTITY_VALUE_CHANGED: "SERVER_ENTITY_VALUE_CHANGED",

                /**
                 * reject a user aciton, e.g. claim
                 */
                SERVER_REJECT_ACTION: "SERVER_REJECT_ACTION",

                /**
                 * is posted by server, when the state of the entity changes
                 * e.g. it gets dragged, then the entity is in the dragged state,
                 * and it can be shown in a different way.
                 * the data of this event contains the time, when it was changed,
                 * so just the newest update should be used
                 */
                STATE_CHANGE: "STATE_CHANGE",

                STATES: {
                    ENTITY_CLAIMED: "ENTITY_CLAIMED",
                    ENTITY_DEFAULT_STATE: "ENTITY_DEFAULT_STATE"
                }
            },
            CLIENT: {
                /**
                 * is posted by client, when he moves the mouse
                 * the package contains the new cursor position,
                 * and sometimes relative positions for entities,
                 * this is used for selections or snappoints
                 *
                 * {position:{x:0:y:0],relativePositions:{<entity_id>:{x:0,y:0}}
                 *
                 * the contrains for entities will be calculated based on the position,
                 * if a relative position is available for an entity,
                 * it will be summed up to get the final position
                 */
                USER_POSITION_CHANGE: "USER_POSITION_CHANGE",

                /**
                 * is posted by server, if any of the clients moves the mouse
                 */
                SERVER_CLIENT_POSITION_UPDATE: "SERVER_CLIENT_POSITION_UPDATE"
            }


            /**
             * aka mouse position update
             */


        }
    }
};