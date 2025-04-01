//
//  cordova-bridge1.hpp
//  App
//
//  Created by 蘇豪 on 2020/04/03.
//

#ifndef cordova_bridge_hpp
#define cordova_bridge_hpp

#ifdef __cplusplus
extern "C" {
#endif

#include <stdio.h>
typedef void (*t_bridge_callback)(const char* channelName, const char* message);
void RegisterBridgeCallback(t_bridge_callback);
void SendMessageToNodeChannel(const char* channelName, const char* message);
void RegisterNodeDataDirPath(const char* path);

#ifdef __cplusplus
}
#endif

#endif /* cordova_bridge_hpp */
