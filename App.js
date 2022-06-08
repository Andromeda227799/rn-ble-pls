import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Button, PermissionsAndroid } from "react-native";
import { BleManager } from "react-native-ble-plx";
import { Buffer } from "buffer";
export const manager = new BleManager();

const ALL_SERVICES = [
  {
    serviceID: 1,
    serviceUUID: "00001800-0000-1000-8000-00805f9b34fb",
    uuid: "00002a00-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 1,
    serviceUUID: "00001800-0000-1000-8000-00805f9b34fb",
    uuid: "00002a01-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 1,
    serviceUUID: "00001800-0000-1000-8000-00805f9b34fb",
    uuid: "00002a04-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 5,
    serviceUUID: "00001801-0000-1000-8000-00805f9b34fb",
    uuid: "00002a05-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 8,
    serviceUUID: "0000ff00-0000-1000-8000-00805f9b34fb",
    uuid: "0000ff01-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 8,
    serviceUUID: "0000ff00-0000-1000-8000-00805f9b34fb",
    uuid: "0000ff02-0000-1000-8000-00805f9b34fb",
  },
  {
    serviceID: 12,
    serviceUUID: "00010203-0405-0607-0809-0a0b0c0d1912",
    uuid: "00010203-0405-0607-0809-0a0b0c0d2b12",
  },
];

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

  useEffect(() => {
    manager.onStateChange((state) => {
      const subscription = manager.onStateChange(async (state) => {
        console.log(state);
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
                    console.log("DEVICE ID", device.id);
                    // Stop scanning as it's not necessary if you are scanning for one device.
                    manager.stopDeviceScan();
                    console.log("WHITE LABEL WATCH FOUND");
                    await device.connect();
                    //   .then(device => {
                    //     // this.info("Discovering services and characteristics")
                    //     console.log(
                    //       'Connected...Discovering services and characteristics',
                    //     );
                    //     return device.discoverAllServicesAndCharacteristics();
                    //   })
                    //   .then(device => {
                    //     // Do work on device with services and characteristics
                    //     console.log(
                    //       'Services and characteristics discovered',
                    //     );
                    //     //return this.testChar(device)
                    //     const services = device.services().then(res => {
                    //       console.log(
                    //         '🚀 ~ file: BluetoothScanner.js ~ line 138 ~ manager.startDeviceScan ~ services',
                    //         services[0],
                    //       );
                    //     });
                    //     console.log(services);
                    //     services.forEach(async service => {
                    //       const characteristics =
                    //         await device.characteristicsForService(
                    //           service.uuid,
                    //         );
                    //       characteristics.forEach(console.log);
                    //     });
                    //     return device.readCharacteristicForService(services);
                    //     // device.readCharacteristicForService("abbaff00-e56a-484c-b832-8b17cf6cbfe8")
                    //     // this.info("Setting notifications")
                    //     //return this.setupNotifications(device)
                    //   })
                    //   .then(
                    //     () => {
                    //       const characteristicsData =
                    //         device.readCharacteristicForService();
                    //       console.log(characteristicsData);

                    //       //this.info("Listening...")
                    //     },
                    //     error => {
                    //       console.log(
                    //         '🚀 ~ file: BluetoothScanner.js ~ line 152 ~ manager.startDeviceScan ~ error',
                    //         error,
                    //       );
                    //       // Handle errors
                    //     },
                    //   );
                    await device.discoverAllServicesAndCharacteristics();
                    const services = await device.services();

                    // const characteristics = await services[1].characteristics();
                    // console.log("Characteristics 0:", characteristics);
                    // characteristics[0].monitor((err, update) => {
                    //   if (err) {
                    //     console.log(`characteristic error: ${err}`);
                    //     console.log(JSON.stringify(err));
                    //   } else {
                    //     console.log(
                    //       "Is Characteristics Readable:",
                    //       update.isReadable
                    //     );
                    //     console.log(
                    //       "Heart Rate Data:",
                    //       base64.decode(update.value)
                    //     );
                    // const readCharacteristic = await device.readCharacteristicForService(userDataServiceUUID,
                    // heightCharacteristicUUID); // assuming the device is already connected
                    // var data = new Uint16Array(base64.decode(update.value));

                    //     const heartRateData = Buffer.from(
                    //       update.value,
                    //       "base64"
                    //     ).readUInt16LE(0);
                    //     console.log("Heart Beats:", heartRateData);
                    //   }
                    // });

                    // services.forEach(async (service) => {
                    //   const characteristics =
                    //     await device.characteristicsForService(service.uuid);
                    //   characteristics.forEach((characteristics) => {
                    //     console.log("ALL CHARS", characteristics);
                    //   });
                    // });

                    ALL_SERVICES.forEach(async (item) => {
                      const serviceUUID = item.serviceUUID;
                      // "00001800-0000-1000-8000-00805f9b34fb";
                      const charUUID = item.uuid;
                      // "00002a04-0000-1000-8000-00805f9b34fb";

                      const readCharacteristic =
                        await device.readCharacteristicForService(
                          serviceUUID,
                          charUUID
                        );
                      // assuming the device is already connected
                      // console.log(
                      //   "🚀 ~ file: BluetoothScanner.js ~ line 297 ~ manager.startDeviceScan ~ readCharacteristic",
                      //   readCharacteristic
                      // );

                      const readValueInBase64 = readCharacteristic.value;
                      console.log(
                        "🚀 ~ file: BluetoothScanner.js ~ line 303 ~ manager.startDeviceScan ~ readValueInBase64",
                        readValueInBase64
                      );

                      const readValueInRawBytes = Buffer.from(
                        readValueInBase64,
                        "base64"
                      ).readUInt16LE(0);
                      console.log(
                        "🚀 ~ file: BluetoothScanner.js ~ line 309 ~ manager.startDeviceScan ~ readValueInRawBytes",
                        readValueInRawBytes
                      );
                    });

                    // ALL_SERVICES.forEach((item) => {
                    //   device.monitorCharacteristicForService(
                    //     item.serviceUUID,
                    //     item.uuid,
                    //     (err, update) => {
                    //       if (err) {
                    //         console.log(`characteristic error: ${err}`);
                    //         // console.log(JSON.stringify(err));
                    //       } else {
                    //         console.log(
                    //           "Is Characteristics Readable:",
                    //           update.isReadable
                    //         );
                    //         console.log(
                    //           "Heart Rate Data:",
                    //           base64.decode(update.value)
                    //         );
                    //       }
                    //     }
                    //   );
                    // });
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
