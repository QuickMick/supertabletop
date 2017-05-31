// /**
//  * Created by Mick on 31.05.2017.
//  */
//
// 'use strict';
//
//
// class ServerEntity{
//     constructor(){
//
//     }
//
//     /**
//      * Overwrites the default values from the basetype.
//      * Object.assign was not used, because it would overwrite the arrays completely.
//      * This method copies and changes array items
//      * @param basetype of the entity, contains all default values
//      * @param instance contains all specialized values, e.g. position, or unique texture
//      * @private
//      */
//     _reviveEntity(basetype,instance){
//         // load the default entity
//         let result = JSON.parse(JSON.stringify(basetype));
//
//         //but override changes
//         if(instance.overwrite) {
//             for (let key in instance.overwrite) {
//                 if (!instance.overwrite.hasOwnProperty(key)) continue;
//
//                 var overwrite_path = key.split(".");    // get the path of the value, which should be overwritten
//                 var currentDepthObject = result;        // latest object of the path
//
//                 // go down the whole path, till the path can be set
//                 for(let i=0; i< overwrite_path.length;i++){
//                     var curKey = overwrite_path[i]; // current validated key
//
//                     if(i==overwrite_path.length-1){ // if last element, then set the real value
//                         currentDepthObject[curKey] = instance.overwrite[key];
//                     }else if(!result[curKey]){      // if object does not exist,
//                         currentDepthObject[curKey]={};          // then create it
//                     }
//                     currentDepthObject=currentDepthObject[curKey];  // and set as new depth object
//                 }
//             }
//         }
//         return result;
//     }
//
// }
//
// module.exports = ServerEntity;