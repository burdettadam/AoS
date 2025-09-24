"use strict";
/**
 * Selection Criteria and Game Phase Definitions
 * Player teams, selection modifiers, character tags, and game phases
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerTeam =
  exports.SelectionModifier =
  exports.CharacterTag =
  exports.ActionPhase =
    void 0;
exports.createSelection = createSelection;

/**
 * Player teams for selection restrictions
 */
let PlayerTeam;
(function (PlayerTeam) {
  PlayerTeam["TOWNSFOLK"] = "townsfolk";
  PlayerTeam["OUTSIDERS"] = "outsiders";
  PlayerTeam["MINIONS"] = "minions";
  PlayerTeam["DEMONS"] = "demons";
  PlayerTeam["TRAVELLER"] = "traveller";
  PlayerTeam["FABLED"] = "fabled";
})(PlayerTeam || (exports.PlayerTeam = PlayerTeam = {}));

/**
 * Selection modifiers
 */
let SelectionModifier;
(function (SelectionModifier) {
  SelectionModifier["ALLOW_SELF"] = "allowSelf";
  SelectionModifier["ALLOW_DEAD"] = "allowDead";
  SelectionModifier["REQUIRE_ALIVE"] = "requireAlive";
  SelectionModifier["ADJACENT_ONLY"] = "adjacentOnly";
  SelectionModifier["DIFFERENT_TEAM"] = "differentTeam";
  SelectionModifier["SAME_TEAM"] = "sameTeam";
  SelectionModifier["NOT_STORYTELLER"] = "notStoryteller";
})(SelectionModifier || (exports.SelectionModifier = SelectionModifier = {}));

/**
 * Common character tags for selection restrictions
 */
let CharacterTag;
(function (CharacterTag) {
  CharacterTag["ACTIVE"] = "active";
  CharacterTag["PASSIVE"] = "passive";
  CharacterTag["ONCE_PER_GAME"] = "once-per-game";
  CharacterTag["EACH_NIGHT"] = "each-night";
  CharacterTag["INFORMATION"] = "information";
  CharacterTag["KILL"] = "kill";
  CharacterTag["PROTECT"] = "protect";
  CharacterTag["MANIPULATE"] = "manipulate";
  CharacterTag["VOTE_MODIFIER"] = "vote-modifier";
  CharacterTag["SETUP_MODIFIER"] = "setup-modifier";
  CharacterTag["CHARACTER_CHANGE"] = "character-change";
  CharacterTag["STATUS_EFFECT"] = "status-effect";
})(CharacterTag || (exports.CharacterTag = CharacterTag = {}));

/**
 * Game phases when actions can occur
 */
let ActionPhase;
(function (ActionPhase) {
  ActionPhase["FIRST_NIGHT"] = "firstNight";
  ActionPhase["OTHER_NIGHTS"] = "otherNights";
  ActionPhase["DAY"] = "day";
  ActionPhase["NOMINATIONS"] = "nominations";
  ActionPhase["VOTING"] = "voting";
  ActionPhase["EXECUTION"] = "execution";
})(ActionPhase || (exports.ActionPhase = ActionPhase = {}));

/**
 * Create a standardized selection object
 */
function createSelection(minTargets, maxTargets, modifiers = {}) {
  return {
    minTargets,
    maxTargets,
    ...modifiers,
  };
}
