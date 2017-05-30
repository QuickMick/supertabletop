/**
 * Created by Mick on 22.05.2017.
 */
'use strict';

module.exports =
{
    createEvent:function (id,data) {
        if(!data)
            console.warn("sending event to ",id," without data");
        return {senderID:id,data:data || {},timeStamp:new Date().getTime()};
    },
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
            * package looks like {clientInfo:<object of client info>,serverID:<string, id of server>
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
                 * server turns card.
                 */
                SERVER_TURN_ENTITY:"SERVER_TURN_ENTITY",

                /**
                 * reject a user aciton, e.g. claim
                 */
                SERVER_REJECT_ACTION:"SERVER_REJECT_ACTION",

                /**
                 * is posted by server, when the state of the entity changes
                 * e.g. it gets dragged, then the entity is in the dragged state,
                 * and it can be shown in a different way.
                 * the data of this event contains the time, when it was changed,
                 * so just the newest update should be used
                 */
                STATE_CHANGE:"STATE_CHANGE",

                STATES:{
                    ENTITY_SELECTED:"ENTITY_SELECTED",
                    ENTITY_DEFAULT_STATE:"ENTITY_DEFAULT_STATE"
                }
            },
            CLIENT:{
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
                SERVER_CLIENT_POSITION_UPDATE:"SERVER_CLIENT_POSITION_UPDATE"
            }


            /**
             * aka mouse position update
             */



        }
    }
};