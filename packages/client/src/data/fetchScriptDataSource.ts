import { ScriptDataSource } from '@botc/shared';

export class FetchScriptDataSource implements ScriptDataSource {
  constructor(private baseUrl: string = '/api/data') {}

  async loadCharacters(scriptPath: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/scripts/${scriptPath}/characters`);
    if (!response.ok) {
      throw new Error(`Failed to load characters for ${scriptPath}: ${response.statusText}`);
    }
    return response.json();
  }

  async loadMetadata(scriptPath: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/scripts/${scriptPath}/metadata`);
    if (!response.ok) {
      throw new Error(`Failed to load metadata for ${scriptPath}: ${response.statusText}`);
    }
    return response.json();
  }
}
