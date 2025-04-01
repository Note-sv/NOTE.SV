#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(NoteNode, "NoteNode",
        CAP_PLUGIN_METHOD(sendMessageToNode, CAPPluginReturnPromise);
        CAP_PLUGIN_METHOD(sendMessageToNodeSync, CAPPluginReturnPromise);
        CAP_PLUGIN_METHOD(getPassword, CAPPluginReturnPromise);
)

