/**
 * Created by Mick on 19.05.2017.
 */
module.exports ={};

module.exports.PLAYGROUND = {
    WIDTH:1000,
    HEIGHT:1000
};

module.exports.GLOBALS = {
    CAMERA_MOVE: false,
    GRABED:0,
    CURRENT_ZOOM:1
};

module.exports.ZOOM = {
    MAX:2.5,
    MIN:0.3,
    SENSIVITY:0.1
};

module.exports.PATHS={
    RESOURCE_PATH:"images",
};

module.exports.PROTOCOL = {};
module.exports.PROTOCOL.CLIENT = {};
module.exports.PROTOCOL.SERVER = {};
module.exports.PROTOCOL.CLIENT.USERINFO = "userinfo";
module.exports.PROTOCOL.CLIENT.CMD_RESULT = "cmd_result";
module.exports.PROTOCOL.SERVER.EXECUTE_CMD = "execute_cmd";
module.exports.PROTOCOL.SERVER.POSITION_UPDATE = "position_update";


module.exports.PROTOCOL.SERVER.REMOVE_ENTITY = "remove_entity";
module.exports.PROTOCOL.SERVER.ADD_ENTITY = "add_entity";
module.exports.PROTOCOL.SERVER.INIT_GAME = "init_game";

module.exports.PROTOCOL.SERVER.VANISH = "VANISH";



module.exports.PROTOCOL.CLIENT.DRAG_START = "DRAG_START";
module.exports.PROTOCOL.CLIENT.DRAG_MOVE = "DRAG_MOVE";
module.exports.PROTOCOL.CLIENT.DRAG_END = "DRAG_END";
module.exports.PROTOCOL.CLIENT.TURN_CARD = "TURN_CARD";

module.exports.PROTOCOL.SERVER.CLIENT_CONNECTED = "CLIENT_CONNECTED";
module.exports.PROTOCOL.SERVER.CLIENT_DISCONNECTED = "CLIENT_DISCONNECTED";


module.exports.PROTOCOL.CLIENT.CLIENT_MOUSE_MOVE = "CLIENT_MOUSE_MOVE";

module.exports.CMD = {};
module.exports.CMD.NATIV = "n ";
