import {
  Character,
  LoadedScript,
  CharacterAction,
  MetaAction,
  NightOrderEntry,
  CharacterActionType,
  MetaActionType
} from '@botc/shared';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingConfigurations: string[];
  recommendations: string[];
}

export interface CharacterValidationResult extends ValidationResult {
  characterId: string;
  missingActions: {
    firstNight?: boolean;
    otherNights?: boolean;
    day?: boolean;
  };
  incompleteActions: string[];
}

export interface ScriptValidationResult extends ValidationResult {
  scriptId: string;
  characterResults: CharacterValidationResult[];
  missingMetaActions: string[];
  nightOrderIssues: string[];
}

/**
 * Validation system for checking completeness of character and script configurations
 * Helps identify missing action metadata and engine features
 */
export class ValidationSystem {

  /**
   * Validate a complete script and all its characters
   */
  validateScript(script: LoadedScript): ScriptValidationResult {
    logger.info(`Validating script: ${script.id}`);
    
    const result: ScriptValidationResult = {
      scriptId: script.id,
      isValid: true,
      errors: [],
      warnings: [],
      missingConfigurations: [],
      recommendations: [],
      characterResults: [],
      missingMetaActions: [],
      nightOrderIssues: []
    };

    // Validate each character
    for (const character of script.characters) {
      const charResult = this.validateCharacter(character);
      result.characterResults.push(charResult);
      
      if (!charResult.isValid) {
        result.isValid = false;
        result.errors.push(...charResult.errors.map(e => `${character.id}: ${e}`));
      }
      
      result.warnings.push(...charResult.warnings.map(w => `${character.id}: ${w}`));
      result.missingConfigurations.push(...charResult.missingConfigurations.map(m => `${character.id}: ${m}`));
    }

    // Validate script-level night order
    this.validateNightOrder(script, result);

    // Check for required meta actions
    this.validateMetaActions(script, result);

    // Generate recommendations
    this.generateScriptRecommendations(script, result);

    return result;
  }

  /**
   * Validate a single character's action configuration
   */
  validateCharacter(character: Character): CharacterValidationResult {
    const result: CharacterValidationResult = {
      characterId: character.id,
      isValid: true,
      errors: [],
      warnings: [],
      missingConfigurations: [],
      recommendations: [],
      missingActions: {},
      incompleteActions: []
    };

    // Check if character should have actions based on legacy fields
    this.checkExpectedActions(character, result);
    
    // Validate existing actions
    if (character.actions) {
      this.validateCharacterActions(character, result);
    }

    // Check action completeness
    this.checkActionCompleteness(character, result);

    return result;
  }

  /**
   * Check what actions a character should have based on legacy data
   */
  private checkExpectedActions(character: Character, result: CharacterValidationResult): void {
    // Check if character should have first night action
    if (character.firstNight && character.firstNight > 0) {
      if (!character.actions?.firstNight || character.actions.firstNight.length === 0) {
        result.missingActions.firstNight = true;
        result.missingConfigurations.push('Missing firstNight actions array despite having firstNight order');
      }
    }

    // Check if character should have other nights action
    if (character.otherNights && character.otherNights > 0) {
  if (!character.actions?.night || character.actions.night.length === 0) {
        result.missingActions.otherNights = true;
        result.missingConfigurations.push('Missing otherNights actions array despite having otherNights order');
      }
    }

    // Check for day actions based on ability text
    const abilityText = character.ability?.toLowerCase() || '';
    const dayKeywords = ['during the day', 'when you die', 'when nominated', 'when executed', 'once per day'];
    
    if (dayKeywords.some(keyword => abilityText.includes(keyword))) {
      const hasDayActions = character.actions?.day && character.actions.day.length > 0;
      if (!hasDayActions) {
        result.missingActions.day = true;
        result.warnings.push(`Ability suggests day action but no day actions configured (has actions: ${!!character.actions}, day length: ${character.actions?.day?.length || 0})`);
      }
    }
  }

  /**
   * Validate the structure and completeness of character actions
   */
  private validateCharacterActions(character: Character, result: CharacterValidationResult): void {
    const actions = character.actions!;

    // Validate first night actions
    if (actions.firstNight) {
      for (const action of actions.firstNight) {
        this.validateAction(action, 'firstNight', result);
      }
    }

    // Validate other night actions
  if (actions.night) {
  for (const action of actions.night) {
        this.validateAction(action, 'otherNights', result);
      }
    }

    // Validate day actions
    if (actions.day) {
      for (const action of actions.day) {
        this.validateAction(action, 'day', result);
      }
    }

    // Check for actions in other phases
    ['nominations', 'voting', 'execution'].forEach(phase => {
      const phaseActions = (actions as any)[phase];
      if (phaseActions) {
        for (const action of phaseActions) {
          this.validateAction(action, phase, result);
        }
      }
    });
  }

  /**
   * Validate a single action's structure and data
   */
  private validateAction(action: CharacterAction, phase: string, result: CharacterValidationResult): void {
    const actionId = action.id || 'unknown';

    // Required fields
    if (!action.action) {
      result.errors.push(`Action ${actionId} missing 'action' field`);
      result.isValid = false;
    }

    if (!action.description) {
      result.warnings.push(`Action ${actionId} missing description`);
    }

    if (!action.targets || action.targets.length === 0) {
      result.warnings.push(`Action ${actionId} has no targets specified`);
    }

    // Check if action type is recognized (support both old and new formats)
    const actionType = action.actionType || action.action;
    if (!actionType) {
      result.errors.push(`Action ${actionId} has no action type specified`);
      return;
    }

    // Get all known action types as strings from our enums
    const knownCharacterActions = Object.values(CharacterActionType) as string[];
    const knownMetaActions = Object.values(MetaActionType) as string[];

    const allKnownActions = [...knownCharacterActions, ...knownMetaActions];

    if (!allKnownActions.includes(actionType)) {
      result.missingConfigurations.push(`Action type '${actionType}' not implemented in engine`);
    }

    // Validate information specification
    if (action.information) {
      this.validateInformationSpec(action.information, actionId, result);
    }

    // Check if action has order for proper sequencing
    if (phase.includes('night') && action.order === undefined) {
      result.warnings.push(`Action ${actionId} missing order for night sequencing`);
    }
  }

  /**
   * Validate information specification structure
   */
  private validateInformationSpec(info: any, actionId: string, result: CharacterValidationResult): void {
    const hasShowPlayers = info.showPlayersByTeam || info.showPlayers || info.showPlayer;
    const hasCustomMessage = info.customMessage;
    const hasBluffs = info.giveBluffs;

    if (!hasShowPlayers && !hasCustomMessage && !hasBluffs) {
      result.warnings.push(`Action ${actionId} has information spec but no delivery method specified`);
    }

    if (info.customMessage && info.customMessage.includes('[COUNT]') && !actionId.includes('count')) {
      result.warnings.push(`Action ${actionId} uses [COUNT] placeholder but action name doesn't suggest counting`);
    }
  }

  /**
   * Check overall action completeness and consistency
   */
  private checkActionCompleteness(character: Character, result: CharacterValidationResult): void {
    // Check goal vs actions alignment
    if (character.goal) {
      const goalAction = character.goal.action;
      const hasMatchingAction = character.actions && Object.values(character.actions).some(actions => 
        actions && actions.some(action => action.action === goalAction)
      );

      if (!hasMatchingAction) {
        result.warnings.push(`Goal specifies action '${goalAction}' but no matching action found`);
      }
    }

    // Check for actions without goals
    if (character.actions && !character.goal) {
      const hasComplexActions = Object.values(character.actions).some(actions =>
        actions && actions.length > 0
      );

      if (hasComplexActions) {
        result.recommendations.push('Character has actions but no goal specified - consider adding goal metadata');
      }
    }
  }

  /**
   * Validate script night order and meta actions
   */
  private validateNightOrder(script: LoadedScript, result: ScriptValidationResult): void {
    // Check first night order
    if (script.firstNight) {
      this.validateNightOrderEntries(script.firstNight, 'firstNight', script, result);
    } else {
      result.warnings.push('No structured firstNight order found');
    }

    // Check other nights order
    if (script.nightOrder) {
      this.validateNightOrderEntries(script.nightOrder, 'nightOrder', script, result);
    } else {
      result.warnings.push('No structured nightOrder found');
    }
  }

  /**
   * Validate night order entries
   */
  private validateNightOrderEntries(
    entries: NightOrderEntry[], 
    phase: string, 
    script: LoadedScript, 
    result: ScriptValidationResult
  ): void {
    const characterIds = new Set(script.characters.map(c => c.id));

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (typeof entry === 'string') {
        // Character ID entry
        if (!characterIds.has(entry)) {
          result.errors.push(`${phase}[${i}]: Character '${entry}' not found in script`);
          result.isValid = false;
        }
      } else {
        // Meta action entry
        this.validateMetaAction(entry, `${phase}[${i}]`, result);
      }
    }
  }

  /**
   * Validate meta action structure
   */
  private validateMetaAction(action: MetaAction, context: string, result: ScriptValidationResult): void {
    if (!action.id) {
      result.errors.push(`${context}: Meta action missing id`);
      result.isValid = false;
    }

    if (!action.action) {
      result.errors.push(`${context}: Meta action ${action.id} missing action`);
      result.isValid = false;
    }

    if (!action.targets || action.targets.length === 0) {
      result.warnings.push(`${context}: Meta action ${action.id} has no targets`);
    }

    // Check if meta action is implemented (support both old and new formats)
    const metaActionType = action.actionType || action.action;
    if (!metaActionType) {
      result.errors.push(`${context}: Meta action ${action.id} missing action type`);
      result.isValid = false;
      return;
    }

    const knownMetaActions = Object.values(MetaActionType) as string[];
    if (!knownMetaActions.includes(metaActionType)) {
      result.missingConfigurations.push(`${context}: Meta action '${metaActionType}' not implemented in engine`);
    }
  }

  /**
   * Check for required meta actions
   */
  private validateMetaActions(script: LoadedScript, result: ScriptValidationResult): void {
    const hasMinions = script.characters.some(c => c.team === 'minion');
    const hasDemons = script.characters.some(c => c.team === 'demon');

    if (hasMinions || hasDemons) {
      const firstNightActions = script.firstNight || [];
      const hasMinionsInfo = firstNightActions.some(entry => 
        typeof entry === 'object' && entry.action === 'showTeamToMinions'
      );
      const hasDemonInfo = firstNightActions.some(entry => 
        typeof entry === 'object' && entry.action === 'showTeamAndBluffsToDemon'
      );

      if (hasMinions && !hasMinionsInfo) {
        result.missingMetaActions.push('showTeamToMinions - required when minions are present');
      }

      if (hasDemons && !hasDemonInfo) {
        result.missingMetaActions.push('showTeamAndBluffsToDemon - required when demons are present');
      }
    }
  }

  /**
   * Generate recommendations for script improvement
   */
  private generateScriptRecommendations(script: LoadedScript, result: ScriptValidationResult): void {
    const missingActionCharacters = result.characterResults.filter(cr => 
      Object.keys(cr.missingActions).length > 0
    );

    if (missingActionCharacters.length > 0) {
      result.recommendations.push(
        `${missingActionCharacters.length} characters missing action configurations: ${
          missingActionCharacters.map(cr => cr.characterId).join(', ')
        }`
      );
    }

    const unimplementedActions = result.missingConfigurations.filter(mc => 
      mc.includes('not implemented in engine')
    );

    if (unimplementedActions.length > 0) {
      result.recommendations.push(
        'Consider implementing these action types in the engine: ' +
        [...new Set(unimplementedActions.map(ua => ua.split("'")[1]))].join(', ')
      );
    }
  }

  /**
   * Generate a summary report of validation results
   */
  generateReport(result: ScriptValidationResult): string {
    const lines: string[] = [];
    
    lines.push(`=== Validation Report for ${result.scriptId} ===`);
    lines.push(`Overall Status: ${result.isValid ? 'VALID' : 'INVALID'}`);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach(error => lines.push(`  - ${error}`));
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => lines.push(`  - ${warning}`));
      lines.push('');
    }

    if (result.missingConfigurations.length > 0) {
      lines.push('MISSING CONFIGURATIONS:');
      result.missingConfigurations.forEach(missing => lines.push(`  - ${missing}`));
      lines.push('');
    }

    if (result.missingMetaActions.length > 0) {
      lines.push('MISSING META ACTIONS:');
      result.missingMetaActions.forEach(meta => lines.push(`  - ${meta}`));
      lines.push('');
    }

    if (result.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      result.recommendations.forEach(rec => lines.push(`  - ${rec}`));
      lines.push('');
    }

    // Character summary
    const validCharacters = result.characterResults.filter(cr => cr.isValid).length;
    const totalCharacters = result.characterResults.length;
    lines.push(`CHARACTER SUMMARY: ${validCharacters}/${totalCharacters} valid`);
    
    const incompleteCharacters = result.characterResults.filter(cr => !cr.isValid);
    if (incompleteCharacters.length > 0) {
      lines.push('Incomplete characters:');
      incompleteCharacters.forEach(cr => {
        lines.push(`  - ${cr.characterId}: ${cr.errors.length} errors, ${cr.warnings.length} warnings`);
      });
    }

    return lines.join('\n');
  }
}
