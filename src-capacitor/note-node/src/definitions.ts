declare module "@capacitor/core" {
  interface PluginRegistry {
    NoteNode: NoteNodePlugin;
  }
}

export interface NoteNodePlugin {
  sendMessageToNode(options: { msg: string }): Promise<{}>;
  sendMessageToNodeSync(options: { msg: string }): Promise<{}>;
  getPassword(): Promise<{}>;
}
