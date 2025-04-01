import { WebPlugin } from '@capacitor/core';
import { NoteNodePlugin } from './definitions';

export class NoteNodeWeb extends WebPlugin implements NoteNodePlugin {
  constructor() {
    super({
      name: 'NoteNode',
      platforms: ['web']
    });
  }

  async startNode(): Promise<{}> {
    return {}
  }

  
  async sendMessageToNode(options: { msg: string }): Promise<{}> {
    console.log("sendMessageToNode", options );
    return {}
  }

  async sendMessageToNodeSync(options: { msg: string }): Promise<{}> {
    console.log("sendMessageToNodeSync", options );
    return {result: 'ok'}
  }

  async getPassword(): Promise<{}> {
    return {result: 'ok'}
  }

}

const NoteNode = new NoteNodeWeb();

export { NoteNode };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(NoteNode);
