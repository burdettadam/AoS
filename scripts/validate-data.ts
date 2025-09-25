#!/usr/bin/env ts-node

import Ajv from "ajv";
import { promises as fs } from "fs";
import * as path from "path";

const CHAR_DIR = path.join(__dirname, "..", "data", "characters");
const SCR_DIR = path.join(__dirname, "..", "data", "scripts");

// Import JSON schemas
import characterSchema from "../schemas/character.schema.json";
import scriptSchema from "../schemas/script.schema.json";

const SCHEMAS = {
  character: characterSchema,
  script: scriptSchema,
};

const ajv = new Ajv({ allErrors: true, strict: false });
const validateChar = ajv.compile(SCHEMAS.character);
const validateScr = ajv.compile(SCHEMAS.script);

interface ValidationError {
  file: string;
  errs: any[];
}

async function validateFolder(
  dir: string,
  validator: any,
  label: string,
): Promise<void> {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const errors: ValidationError[] = [];

  for (const file of jsonFiles) {
    const filePath = path.join(dir, file);
    const data = JSON.parse(await fs.readFile(filePath, "utf8"));
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

async function main(): Promise<void> {
  await validateFolder(CHAR_DIR, validateChar, "Characters");
  await validateFolder(SCR_DIR, validateScr, "Scripts");
}

main().catch(console.error);
