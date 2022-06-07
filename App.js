import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  PermissionsAndroid,
  StyleSheet,
} from "react-native";
import { BleManager } from "react-native-ble-plx";
// import { ApiCall } from "./api";

export const manager = new BleManager();

const requestPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: "Request for Location Permission",
      message: "Bluetooth Scanner requires access to Fine Location Permission",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

// BlueetoothScanner does:
// - access/enable bluetooth module
// - scan bluetooth devices in the area
// - list the scanned devices
const App = () => {
  const [logData, setLogData] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [scannedDevices, setScannedDevices] = useState({});
  const [deviceCount, setDeviceCount] = useState(0);
  // const { result } = ApiCall();
  // console.log("APP PAGE", result);
  useEffect(() => {
    manager.onStateChange((state) => {
      const subscription = manager.onStateChange(async (state) => {
        console.log("STATE ", state);
        const newLogData = logData;
        newLogData.push(state);
        await setLogCount(newLogData.length);
        await setLogData(newLogData);
        subscription.remove();
      }, true);
      return () => subscription.remove();
    });
  }, [manager]);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <View style={{ flex: 1, padding: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Bluetooth Log ({logCount})</Text>
        <FlatList
          data={logData}
          renderItem={({ item }) => {
            return <Text>{item}</Text>;
          }}
        />
        <Button
          title="Turn On Bluetooth"
          onPress={async () => {
            const btState = await manager.state();
            // test is bluetooth is supported
            if (btState === "Unsupported") {
              alert("Bluetooth is not supported");
              return false;
            }
            // enable if it is not powered on
            if (btState !== "PoweredOn") {
              await manager.enable();
            } else {
              await manager.disable();
            }
            return true;
          }}
        />
      </View>

      <View style={{ flex: 2, padding: 10 }}>
        <Text style={{ fontWeight: "bold" }}>
          Scanned Devices ({deviceCount})
        </Text>
        <FlatList
          data={Object.values(scannedDevices)}
          renderItem={({ item }) => {
            return <Text>{`${item.name} (${item.id})`}</Text>;
          }}
        />
        <Button
          title="Scan Devices"
          onPress={async () => {
            const btState = await manager.state();
            // test if bluetooth is powered on
            if (btState !== "PoweredOn") {
              alert("Bluetooth is not powered on");
              return false;
            }
            // explicitly ask for user's permission
            const permission = await requestPermission();
            if (permission) {
              manager.startDeviceScan(null, null, async (error, device) => {
                // error handling
                if (error) {
                  console.log(error);
                  return;
                }
                // found a bluetooth device
                if (device) {
                  console.log(`${device.name} (${device.id})}`);
                  const newScannedDevices = scannedDevices;
                  newScannedDevices[device.id] = device;
                  await setDeviceCount(Object.keys(newScannedDevices).length);
                  await setScannedDevices(scannedDevices);
                  if (device.name === "C60-E581") {
                    console.log("DEVICE ID",device.id)
                    // Stop scanning as it's not necessary if you are scanning for one device.
                    manager.stopDeviceScan();
                    console.log("WHITE LABEL WATCH FOUND");
                    manager.discoverAllServicesAndCharacteristicsForDevice("A4:C1:38:70:E5:81", null).then((res)=>{
                      console.log("DEVICE CONNECTED WITH RES",res);
                    }).catch((er)=>{
                      console.log("FAILED CONNECTING",er);
                    })
                    await device
                      .connect()
                      .then((device) => {
                        // console.log("DEVICE LOG 1",device)
                        // console.log("DEVICE LOG 2",device.readCharacteristicForDevice(device.id,device.serviceUUIDs,null,1));
                        
                        // console.log("DEVICE LOG 2", device.discoverAllServicesAndCharacteristics());
                        // manager. monitorCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, listener, transactionId)
                        

                        return device.discoverAllServicesAndCharacteristics();
                      })
                      .then((device) => {
                        // console.log("ALL CONFIG LOGS", device);
                        // Do work on device with services and characteristics
                        return device.services();
                      })
                      .then((services) => {
                        const temp = [];
                        services.map((id) =>
                          temp.push({
                            uuid: id.uuid,
                            id: id.id,
                            char: id.characteristics(),
                          })
                        ); // 181d is Weight Scale -> org.bluetooth.service.weight_scale;
                        return services[0].characteristics();
                      })
                      .then((temp) => {
                        let arr = [];
                        temp.map(async (item) => {
                          arr.push(item.descriptors());
                          // console.log(
                          //   item.id,
                          //   item.isReadable,
                          //   item.descriptors(),
                          //   item.deviceID,
                          //   item.serviceID,
                          //   item.serviceUUID,
                          //   item.value
                          // );
                        });
                      })
                      .then((arr) => {
                        console.log("ARR LOGS", arr);
                      })
                      .catch((error) => {
                        // Handle errors
                      });
                    //  device.readCharacteristicForService()
                    // await device
                    //   .readCharacteristicForService(
                    //     "00001800-0000-1000-8000-00805f9b34fb",
                    //     "00002a01-0000-1000-8000-00805f9b34fb",
                    //     "1"
                    //   )
                    //   .then((char) => {
                    //     console.log(char.value);
                    //   }).catch((error)=>console.log(error));

                    // await device
                    //   .readCharacteristicForService(
                    //     "00001800-0000-1000-8000-00805f9b34fb",
                    //     "00002a00-0000-1000-8000-00805f9b34fb",
                    //     "1"
                    //   )
                    //   .then((char) => {
                    //     console.log(char.value);
                    //   });
                    //   await device
                    //   .readCharacteristicForService(
                    //     "00001800-0000-1000-8000-00805f9b34fb",
                    //     "00002a01-0000-1000-8000-00805f9b34fb",
                    //     "1"
                    //   )
                    //   .then((char) => {
                    //     console.log(char.value);
                    //   });
                    //   await device
                    //   .readCharacteristicForService(
                    //     "00001800-0000-1000-8000-00805f9b34fb",
                    //     "00002a01-0000-1000-8000-00805f9b34fb",
                    //     "1"
                    //   )
                    //   .then((char) => {
                    //     console.log(char.value);
                    //   });
                    // device.readCharacteristicForService()
                  }
                }
              });
            }
            return true;
          }}
        />
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
