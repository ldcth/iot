import React, { FC, useCallback, useState, useMemo, useEffect } from "react";
import {
  Text,
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Button,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import { IOSOutputFormat } from "expo-av/build/Audio";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

// Define recording options type
const home: FC = () => {
  const router = useRouter();
  // Add Firebase config
  const firebaseConfig = {
    databaseURL: "https://iot2024-78deb-default-rtdb.firebaseio.com",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const [rooms, setRooms] = useState([
    {
      id: 1,
      name: "Fan",
      device: [
        { id: 1, name: "On", status: true },
        { id: 2, name: "Off", status: false },
      ],
    },
    {
      id: 2,
      name: "Light",
      device: [
        { id: 3, name: "On", status: true },
        { id: 4, name: "Off", status: false },
      ],
    },
    {
      id: 3,
      name: "Door",
      device: [
        { id: 5, name: "On", status: false },
        { id: 6, name: "Off", status: true },
      ],
    },
  ]);

  const [selectedRoom, setSelectedRoom] = useState<any>();
  const [recording, setRecording] = useState<Audio.Recording>();
  const [audio, setAudio] = useState<string>();

  const [recordings, setRecordings] = useState<any>();

  const [message, setMessage] = useState<string>("");
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const [deviceStatus, setDeviceStatus] = useState({
    FAN: 0,
    LED: 0,
    SERVO: 0,
  });

  useEffect(() => {
    const db = getDatabase();
    const fanRef = ref(db, "FAN");
    const ledRef = ref(db, "LED");
    const servoRef = ref(db, "SERVO");

    // Set up real-time listeners
    const unsubscribeFan = onValue(fanRef, (snapshot) => {
      setDeviceStatus((prev) => ({ ...prev, FAN: snapshot.val() }));
    });

    const unsubscribeLed = onValue(ledRef, (snapshot) => {
      setDeviceStatus((prev) => ({ ...prev, LED: snapshot.val() }));
    });

    const unsubscribeServo = onValue(servoRef, (snapshot) => {
      setDeviceStatus((prev) => ({ ...prev, SERVO: snapshot.val() }));
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeFan();
      unsubscribeLed();
      unsubscribeServo();
    };
  }, []);

  const getDeviceType = (roomName: string) => {
    switch (roomName) {
      case "Fan":
        return "FAN";
      case "Light":
        return "LED";
      case "Door":
        return "SERVO";
      default:
        return "";
    }
  };

  const handlePressRoom = useCallback(
    async (room: any, device?: any) => {
      if (device) {
        try {
          // Determine device type based on room
          let deviceType = "";
          switch (room.name) {
            case "Fan":
              deviceType = "FAN";
              break;
            case "Light":
              deviceType = "LED";
              break;
            case "Door":
              deviceType = "SERVO";
              break;
          }

          if (deviceType) {
            // Update Firebase with opposite of current status
            const deviceRef = ref(db, deviceType);
            const newValue = device.name === "On" ? 1 : 0;
            await set(deviceRef, newValue);

            // Update local state
            const newState = rooms.map((r) => {
              if (r.name === room.name) {
                return {
                  ...r,
                  device: r.device.map((d) => ({
                    ...d,
                    status: d.name === device.name,
                  })),
                };
              }
              return r;
            });
            setRooms(newState);
          }
        } catch (error) {
          console.error("Error updating device state:", error);
        }
      } else {
        // Original room selection logic
        setSelectedRoom(room);
      }
    },
    [rooms, db]
  );

  const labels = useMemo(() => {
    return [
      {
        label: "bat_den",
        deviceType: "LED",
        value: 1,
        name: "Light",
      },
      {
        label: "tat_den",
        deviceType: "LED",
        value: 0,
        name: "Light",
      },
      {
        label: "mo_cua",
        deviceType: "SERVO",
        value: 1,
        name: "Door",
      },
      {
        label: "dong_cua",
        deviceType: "SERVO",
        value: 0,
        name: "Door",
      },
      {
        label: "bat_quat",
        deviceType: "FAN",
        value: 1,
        name: "Fan",
      },
      {
        label: "tat_quat",
        deviceType: "FAN",
        value: 0,
        name: "Fan",
      },
    ];
  }, []);
  async function startRecording() {
    try {
      console.log(permissionResponse?.status);
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission..");
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: ".wav",
          outputFormat: IOSOutputFormat.LINEARPCM,
        },
      });
      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  const handleTurnDevice = async (device: any) => {
    try {
      let url = "";
      if (device.status) {
        if (device.name === "Light 1") url = "/api/turn-led-off";
        if (device.name === "Light 2") url = "/api/turn-led-outdoor-off";
        if (device.name === "Door") url = "/api/open-door";
        if (device.name === "Fan") url = "/api/turn-fan-off";
      } else {
        if (device.name === "Light 1") url = "/api/turn-led-on";
        if (device.name === "Light 2") url = "/api/turn-led-outdoor-on";
        if (device.name === "Door") url = "/api/close-door";
        if (device.name === "Fan") url = "/api/turn-fan-on";
      }
      const data = await axios.get(`http://10.10.27.143${url}`, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(data.data);
      const newState = rooms.map((room) => {
        if (room.device) {
          room.device = room.device.map((e) =>
            e.name === device.name ? { ...e, status: !e.status } : e
          );
        }
        return room;
      });

      setRooms(newState);
    } catch (error) {
      console.log(error);
    }
  };
  async function stopRecording() {
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording?.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording?.getURI();
    if (uri) {
      try {
        setAudio(uri);
        const formData = new FormData();
        //@ts-ignore
        formData.append("file", {
          uri: uri,
          name: `recording_${new Date().getTime()}.wav`,
          type: "audio/wav",
        });

        const response = await axios.post(
          // "http://127.0.0.1:5000/upload",
          "http://192.168.1.102:5001/upload",

          // "http://172.20.10.11:5001/upload",

          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            // Add timeout and retry configuration
            // timeout: 5000,
            // maxRetries: 3,
          }
        );

        const transcript = response.data.transcript;
        console.log("Received transcript:", transcript);

        // Uncomment and use the label processing code when server is working
        const label_result = labels.find((e) => e.label === transcript);
        if (label_result) {
          try {
            // Determine which device to update
            let deviceType = "";
            let value = 0;

            switch (label_result.name) {
              case "Fan":
                deviceType = "FAN";
                value = label_result.value ? 1 : 0;
                break;
              case "Light":
                deviceType = "LED";
                value = label_result.value ? 1 : 0;
                break;
              case "Door":
                deviceType = "SERVO";
                value = label_result.value ? 1 : 0;
                break;
            }

            if (deviceType) {
              // Update Firebase
              const deviceRef = ref(db, deviceType);
              await set(deviceRef, value);

              // Update local state
              const newState = rooms.map((room) => {
                if (room.name === label_result.name) {
                  return {
                    ...room,
                    device: room.device.map((device) => ({
                      ...device,
                      status:
                        device.name ===
                        (label_result.value === 1 ? "On" : "Off"),
                    })),
                  };
                }
                return room;
              });

              setRooms(newState);

              // Show alert for successful device status change
              Alert.alert(
                "Device Status Changed By Voice",
                `${label_result.name} has been turned ${
                  label_result.value === 1 ? "on" : "off"
                }`,
                [{ text: "OK" }]
              );

              console.log(`${deviceType} state updated to: ${value}`);
            }
          } catch (error) {
            // Show alert for error
            Alert.alert(
              "Error",
              "Failed to change device status. Please try again.",
              [{ text: "OK" }]
            );
            console.error("Error updating device state:", error);
          }
        } else {
          // Show alert for unrecognized command
          Alert.alert(
            "Unrecognized Command",
            "Sorry, I didn't understand that command. Please try again.",
            [{ text: "OK" }]
          );
        }
      } catch (error: any) {
        if (error.code === "ECONNREFUSED") {
          console.error(
            "Cannot connect to server. Please ensure the server is running."
          );
        } else {
          console.error("Error uploading file:", error?.message);
        }
      }
    }
  }

  useEffect(() => {
    const loadInitialStates = async () => {
      try {
        const fanRef = ref(db, "FAN");
        const ledRef = ref(db, "LED");
        const servoRef = ref(db, "SERVO");

        const [fanState, ledState, servoState] = await Promise.all([
          get(fanRef),
          get(ledRef),
          get(servoRef),
        ]);

        // Update local state based on Firebase values
        const newState = rooms.map((room) => {
          if (room.name === "Fan") {
            room.device = room.device.map((d) => ({
              ...d,
              status: !!fanState.val(),
            }));
          } else if (room.name === "Light") {
            room.device = room.device.map((d) => ({
              ...d,
              status: !!ledState.val(),
            }));
          } else if (room.name === "Door") {
            room.device = room.device.map((d) => ({
              ...d,
              status: !!servoState.val(),
            }));
          }
          return room;
        });

        setRooms(newState);
      } catch (error) {
        console.error("Error loading initial states:", error);
      }
    };

    loadInitialStates();
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#EAA9A9", "#000000", "#514E4E", "#000000"]}
        locations={[0, 0.5, 0.75, 1]}
        style={styles.background}
      >
        <ScrollView style={styles.scrollview}>
          {/* Title Section */}
          <Text style={styles.title}>Devices Management</Text>

          {/* Temperature and Device Info Section */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>30°C</Text>
              <Text style={styles.infoSubText}>Avg House Temp</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>37°C</Text>
              <Text style={styles.infoSubText}>Outside Temp</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>60%</Text>
              <Text style={styles.infoSubText}>Temperature</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>0</Text>
              <Text style={styles.infoSubText}>Demo</Text>
            </View>
          </View>

          {/* Room Section */}
          <Text style={styles.sectionTitle}>Devices</Text>
          <View style={styles.buttonGrid}>
            {rooms.map((room) => {
              // Get device type and current status from Firebase
              const deviceType = getDeviceType(room.name);
              const currentStatus =
                deviceStatus[deviceType as keyof typeof deviceStatus];

              return (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    { width: "48%" },
                    currentStatus === 0 && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    handlePressRoom(room);
                  }}
                >
                  <LinearGradient
                    colors={["#FFFFFF", "#99CCFF"]}
                    locations={[0.5, 1]}
                    start={{ x: 0, y: 1 }}
                    style={[
                      styles.roomButton,
                      currentStatus === 1 && {
                        borderWidth: 2,
                        borderColor: "#99CCFF",
                      },
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {room.name}
                      {currentStatus === 1 ? " (On)" : " (Off)"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Device in Use Section */}
          {selectedRoom && (
            <View>
              <Text style={styles.sectionTitle}>{selectedRoom.name}</Text>
              <LinearGradient
                colors={["#FFFFFF", "#99CCFF"]}
                locations={[0.5, 1]}
                start={{ x: 0, y: 1 }}
                style={styles.deviceIcons}
              >
                <ScrollView horizontal>
                  {selectedRoom.device.map((device: any) => {
                    const deviceType = getDeviceType(selectedRoom.name);
                    const currentStatus =
                      deviceStatus[deviceType as keyof typeof deviceStatus];
                    const isActive =
                      (device.name === "On" && currentStatus === 1) ||
                      (device.name === "Off" && currentStatus === 0);

                    return (
                      <TouchableOpacity
                        key={device.id}
                        style={[
                          styles.deviceWrapper,
                          {
                            backgroundColor: isActive ? "#99CCFF" : "#ffffff",
                            borderWidth: 1,
                            borderColor: "#99CCFF",
                          },
                        ]}
                        onPress={() => {
                          if (isActive) {
                            Alert.alert(
                              "Device Status",
                              `${
                                selectedRoom.name
                              } is already ${device.name.toLowerCase()}`,
                              [{ text: "OK" }]
                            );
                            return;
                          }
                          handlePressRoom(selectedRoom, device);
                        }}
                      >
                        <Text
                          style={[
                            styles.deviceText,
                            isActive && { fontWeight: "bold" },
                          ]}
                        >
                          {device.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </LinearGradient>
            </View>
          )}

          <View style={[styles.container, { marginTop: 20 }]}>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={recording ? stopRecording : startRecording}
            >
              <LinearGradient
                colors={
                  recording ? ["#ff4444", "#cc0000"] : ["#99CCFF", "#6699CC"]
                }
                style={styles.recordButtonGradient}
              >
                <Text style={styles.recordButtonText}>
                  {recording ? "Stop Recording" : "Start Recording"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* {getRecordingLines()} */}
          {/* <Button
            title={recordings.length > 0 ? "\n\n\nClear Recordings" : ""}
            onPress={clearRecordings}
          /> */}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: Dimensions.get("screen").height,
  },
  scrollview: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    flexDirection: "column",
  },

  parameterWrapper: {
    // backgroundColor: "#FEB35B",
    backgroundColor: "#99CCFF",

    borderRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    width: "48%",
    // backgroundColor: "#FFA726",
    backgroundColor: "#99CCFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  infoSubText: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    color: "#99CCFF",

    marginVertical: 10,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roomButton: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flex: 1,
  },
  buttonText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#000",
  },
  routineGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  routineButton: {
    width: "48%",
    backgroundColor: "#424242",
    borderRadius: 10,
    padding: 15,
  },
  activeRoutine: {
    // backgroundColor: "#FFA726",
    backgroundColor: "#99CCFF",
  },
  deviceIcons: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 40,
  },
  deviceWrapper: {
    width: 70,
    height: 70,
    marginRight: 10,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  deviceText: {
    fontSize: 16,
    color: "#000000",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginRight: 40,
  },
  fill: {
    flex: 1,
    margin: 15,
  },
  recordButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  recordButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default home;
