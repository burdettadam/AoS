import { promises as fs } from 'fs';
import path from 'path';
import { ScriptDataSource } from '@botc/shared';

export class NodeScriptDataSource implements ScriptDataSource {
  // Point to the repo-level data directory which contains per-script folders
  constructor(private dataDirectory: string = path.join(process.cwd(), '..', '..', 'data')) {}

  async loadCharacters(scriptPath: string): Promise<any> {
    // First get the script metadata to know which characters to load
    const metadata = await this.loadMetadata(scriptPath);
    const characterIds = metadata.characters || [];
    
    // Then load each character
    const characters = [];
    for (const charId of characterIds) {
      const charFile = path.join(this.dataDirectory, 'characters', `${charId}.json`);
      try {
        const charData = await fs.readFile(charFile, 'utf8');
        characters.push(JSON.parse(charData));
      } catch (error) {
        console.warn(`Could not load character ${charId}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    return characters;
  }

  async loadMetadata(scriptPath: string): Promise<any> {
    let scriptFile = path.join(this.dataDirectory, 'scripts', `${scriptPath}.json`);
    
    // Check if the file exists, if not try custom-scripts
    try {
      await fs.access(scriptFile);
    } catch {
      scriptFile = path.join(this.dataDirectory, 'scripts', 'custom-scripts', `${scriptPath}.json`);
    }
    
    const data = await fs.readFile(scriptFile, 'utf8');
    return JSON.parse(data);
  }

  async listAvailableScripts(): Promise<string[]> {
    const scripts: string[] = [];
    const scriptsDir = path.join(this.dataDirectory, 'scripts');

    try {
      const items = await fs.readdir(scriptsDir, { withFileTypes: true });
      for (const item of items) {
        if (item.isFile() && item.name.endsWith('.json')) {
          const scriptId = item.name.replace('.json', '');
          scripts.push(scriptId);
        } else if (item.isDirectory()) {
          // Check for scripts in subdirectories
          const subDir = path.join(scriptsDir, item.name);
          try {
            const subItems = await fs.readdir(subDir, { withFileTypes: true });
            for (const subItem of subItems) {
              if (subItem.isFile() && subItem.name.endsWith('.json')) {
                const scriptId = `${item.name}/${subItem.name.replace('.json', '')}`;
                scripts.push(scriptId);
              }
            }
          } catch (error) {
            // Skip subdirectory if can't read
          }
        }
      }
    } catch (error) {
      console.warn('Error listing scripts:', error);
    }

    return scripts;
  }
}
