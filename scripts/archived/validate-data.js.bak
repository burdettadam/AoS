#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');

const CHAR_DIR = path.join(__dirname, 'data', 'characters');
const SCR_DIR = path.join(__dirname, 'data', 'scripts');
const SCHEMAS = {
  character: require('./schemas/character.schema.json'),
  script: require('./schemas/script.schema.json')
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateChar = ajv.compile(SCHEMAS.character);
const validateScr = ajv.compile(SCHEMAS.script);

async function validateFolder(dir, validator, label) {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  const errors = [];
  for (const file of jsonFiles) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    const valid = validator(data);
    if (!valid) {
      errors.push({ file: filePath, errs: validator.errors });
    }
  }
  if (errors.length) {
    console.error(`❌ ${label}: ${errors.length} files invalid`);
    for (const e of errors) {
      console.error(`- ${e.file}`);
      console.error(e.errs);
    }
    process.exitCode = 1;
  } else {
    console.log(`✅ ${label}: all files valid`);
  }
}

async function main() {
  await validateFolder(CHAR_DIR, validateChar, 'Characters');
  await validateFolder(SCR_DIR, validateScr, 'Scripts');
}

main();
