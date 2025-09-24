"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleType = exports.Alignment = exports.GamePhase = void 0;
// Game State Enums
let GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "lobby";
    GamePhase["SETUP"] = "setup";
    GamePhase["NIGHT"] = "night";
    GamePhase["DAY"] = "day";
    GamePhase["NOMINATION"] = "nomination";
    GamePhase["VOTE"] = "vote";
    GamePhase["EXECUTION"] = "execution";
    GamePhase["END"] = "end";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
let Alignment;
(function (Alignment) {
    Alignment["GOOD"] = "good";
    Alignment["EVIL"] = "evil";
})(Alignment || (exports.Alignment = Alignment = {}));
let RoleType;
(function (RoleType) {
    RoleType["TOWNSFOLK"] = "townsfolk";
    RoleType["OUTSIDER"] = "outsider";
    RoleType["MINION"] = "minion";
    RoleType["DEMON"] = "demon";
    RoleType["TRAVELLER"] = "traveller";
    RoleType["FABLED"] = "fabled";
})(RoleType || (exports.RoleType = RoleType = {}));
//# sourceMappingURL=enums.js.map