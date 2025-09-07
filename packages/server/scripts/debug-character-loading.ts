#!/usr/bin/env ts-node

import { ScriptLoader } from '../src/game/script-loader';
import { logger } from '../src/utils/logger';

/**
 * Debug script to check character loading
 */
async function debugCharacterLoading() {
  logger.info('=== Debug Character Loading ===');
  
  const scriptLoader = new ScriptLoader();

  try {
    // Load the script with full metadata
    const loadedScript = await scriptLoader.getLoadedScript('trouble-brewing');
    if (!loadedScript) {
      logger.error('Failed to load script');
      return;
    }

    logger.info(`Loaded script: ${loadedScript.id} with ${loadedScript.characters.length} characters`);

    // Check specific characters
    const slayer = loadedScript.characters.find(c => c.id === 'slayer');
    if (slayer) {
      logger.info('=== Slayer Character ===');
      logger.info(`ID: ${slayer.id}`);
      logger.info(`Name: ${slayer.name}`);
      logger.info(`Ability: ${slayer.ability}`);
      logger.info(`Has actions: ${!!slayer.actions}`);
      if (slayer.actions) {
        logger.info(`  - firstNight: ${slayer.actions.firstNight?.length || 0} actions`);
        logger.info(`  - otherNights: ${slayer.actions.otherNights?.length || 0} actions`);
        logger.info(`  - day: ${slayer.actions.day?.length || 0} actions`);
        if (slayer.actions.day && slayer.actions.day.length > 0) {
          slayer.actions.day.forEach((action, i) => {
            logger.info(`    Day action ${i}: ${action.id} - ${action.description}`);
          });
        }
      }
    } else {
      logger.error('Slayer character not found');
    }

    const chef = loadedScript.characters.find(c => c.id === 'chef');
    if (chef) {
      logger.info('=== Chef Character ===');
      logger.info(`ID: ${chef.id}`);
      logger.info(`Has actions: ${!!chef.actions}`);
      if (chef.actions) {
        logger.info(`  - firstNight: ${chef.actions.firstNight?.length || 0} actions`);
        if (chef.actions.firstNight && chef.actions.firstNight.length > 0) {
          chef.actions.firstNight.forEach((action, i) => {
            logger.info(`    First night action ${i}: ${action.id} - ${action.description}`);
          });
        }
      }
    }

    // Check script meta actions
    logger.info('=== Script Meta Actions ===');
    logger.info(`First night: ${loadedScript.firstNight?.length || 0} entries`);
    logger.info(`Night order: ${loadedScript.nightOrder?.length || 0} entries`);

    if (loadedScript.firstNight) {
      loadedScript.firstNight.forEach((entry, i) => {
        if (typeof entry === 'string') {
          logger.info(`  ${i}: character: ${entry}`);
        } else {
          logger.info(`  ${i}: meta: ${entry.id} - ${entry.description}`);
        }
      });
    }

    // Test validation
    logger.info('=== Validation Test ===');
    const validationResult = await scriptLoader.validateScript('trouble-brewing');
    logger.info(`Validation status: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);
    logger.info(`Errors: ${validationResult.errors.length}`);
    logger.info(`Warnings: ${validationResult.warnings.length}`);
    
    // Show slayer-specific warnings
    const slayerWarnings = validationResult.warnings.filter((w: string) => w.includes('slayer'));
    if (slayerWarnings.length > 0) {
      logger.info('Slayer warnings:');
      slayerWarnings.forEach((w: string) => logger.info(`  - ${w}`));
    }

    const slayerMissing = validationResult.missingConfigurations.filter((mc: string) => mc.includes('slayer'));
    if (slayerMissing.length > 0) {
      logger.info('Slayer missing configurations:');
      slayerMissing.forEach((mc: string) => logger.info(`  - ${mc}`));
    }

  } catch (error) {
    logger.error('Debug failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugCharacterLoading().catch(error => {
    logger.error('Debug script failed:', error);
    process.exit(1);
  });
}

export { debugCharacterLoading };
