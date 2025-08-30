import { ScriptLoader, LoadedScript } from '@botc/shared';
import { FetchScriptDataSource } from '../data/fetchScriptDataSource';

class ClientScriptManager {
  private loader: ScriptLoader;
  private static instance: ClientScriptManager;

  private constructor() {
    this.loader = new ScriptLoader(new FetchScriptDataSource());
  }

  static getInstance(): ClientScriptManager {
    if (!ClientScriptManager.instance) {
      ClientScriptManager.instance = new ClientScriptManager();
    }
    return ClientScriptManager.instance;
  }

  async loadScript(scriptId: string): Promise<LoadedScript> {
    return this.loader.loadScript(scriptId);
  }

  async getAllScripts(): Promise<LoadedScript[]> {
    return this.loader.getAllScripts();
  }

  clearCache(): void {
    this.loader.clearCache();
  }
}

export const clientScriptManager = ClientScriptManager.getInstance();
