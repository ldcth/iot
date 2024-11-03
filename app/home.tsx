import React, { FC, useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Button,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Audio } from "expo-av";
import { IOSOutputFormat } from "expo-av/build/Audio";

// Define recording options type
const home: FC = () => {
  const router = useRouter();

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
        { id: 5, name: "Open", status: false },
        { id: 6, name: "Close", status: true },
      ],
    },
    {
      id: 4,
      name: "Switch",
      device: [
        { id: 7, name: "On", status: false },
        { id: 8, name: "Off", status: true },
      ],
    },
  ]);

  const [selectedRoom, setSelectedRoom] = useState<any>();
  const [recording, setRecording] = useState<any>();

  const [recordings, setRecordings] = useState<any>();

  const [message, setMessage] = useState<string>("");
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const handlePressRoom = useCallback((room: any) => {
    setSelectedRoom(room);
  }, []);

  function getDurationFormatted(millis: any) {
    const minutes = millis / 1000 / 60;
    const minutesDisplay = Math.floor(minutes);
    const seconds = Math.round((minutes - minutesDisplay) * 60);
    const secondsDisplay = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutesDisplay}:${secondsDisplay}`;
  }

  // Define recording options
  // const startRecording = async () => {
  //   try {
  //     if (permissionResponse?.status !== "granted") {
  //       console.log("Requesting permission..");
  //       await requestPermission();
  //     }
  //     await Audio.setAudioModeAsync({
  //       allowsRecordingIOS: true,
  //       playsInSilentModeIOS: true,
  //     });

  //     console.log("Starting recording..");
  //     const { recording } = await Audio.Recording.createAsync(
  //       Audio.RecordingOptionsPresets.HIGH_QUALITY
  //     );
  //     setRecording(recording);
  //   } catch (error) {
  //     console.error("Failed to record", error);
  //   }
  // };
  // const stopRecording = async () => {
  //   console.log("Stopping recording..");
  //   setRecording(undefined);
  //   await recording.stopAndUnloadAsync();
  //   await Audio.setAudioModeAsync({
  //     allowsRecordingIOS: false,
  //   });
  //   const uri = recording.getURI();
  //   console.log("Recording stopped and stored at", uri);
  // };
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

  async function stopRecording() {
    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
  }
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
            {rooms.map((room) => (
              <TouchableOpacity
                style={{ width: "48%" }}
                onPress={() => {
                  handlePressRoom(room);
                }}
              >
                <LinearGradient
                  // colors={["#FFFFFF", "#FDA43C"]}
                  colors={["#FFFFFF", "#99CCFF"]}
                  locations={[0.5, 1]}
                  start={{ x: 0, y: 1 }}
                  style={styles.roomButton}
                >
                  <Text style={styles.buttonText}>{room.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Routines Section */}
          {/* <Text style={styles.sectionTitle}>Routines</Text>
          <View style={styles.routineGrid}>
            <TouchableOpacity
              style={[styles.routineButton, styles.activeRoutine]}
            >
              <Text style={styles.buttonText}>Morning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineButton}>
              <Text style={[styles.buttonText, { color: "#FDA43C" }]}>Out</Text>
            </TouchableOpacity>
          </View> */}

          {/* Device in Use Section */}
          {selectedRoom && (
            <View>
              <Text style={styles.sectionTitle}>{selectedRoom.name}</Text>
              <LinearGradient
                // colors={["#FFFFFF", "#FDA43C"]}
                colors={["#FFFFFF", "#99CCFF"]}
                locations={[0.5, 1]}
                start={{ x: 0, y: 1 }}
                style={styles.deviceIcons}
              >
                <ScrollView horizontal>
                  {selectedRoom.device.map((device: any) => (
                    <TouchableOpacity
                      style={[
                        styles.deviceWrapper,
                        device.status
                          ? { backgroundColor: "#99CCFF" }
                          : { backgroundColor: "#ffffff" },
                        // { backgroundColor: "#99CCFF" },
                      ]}
                      onPress={() => {
                        // navigation.navigate("detail", { id: 1 });
                        // router.push({
                        //   pathname: "/detail",
                        //   params: { ...device },
                        // });
                      }}
                    >
                      <Text style={styles.deviceText}>{device.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {/* <TouchableOpacity
                    style={[
                      styles.deviceWrapper,
                      { backgroundColor: "#99CCFF" },
                    ]}
                    onPress={() => {
                      // navigation.navigate("detail", { id: 1 });
                    }}
                  >
                    <Text style={styles.deviceText}>On</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deviceWrapper,
                      { backgroundColor: "#ffffff" },
                    ]}
                    onPress={() => {
                      // navigation.navigate("detail", { id: 1 });
                    }}
                  >
                    <Text style={styles.deviceText}>Off</Text>
                  </TouchableOpacity> */}
                </ScrollView>
              </LinearGradient>
            </View>
          )}

          <View style={styles.container}>
            <Button
              title={recording ? "Stop Recording" : "Start Recording"}
              onPress={recording ? stopRecording : startRecording}
            />
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
  // title: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   marginBottom: 20,
  //   color: "white",
  //   textAlign: "center",
  // },
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
    // color: "#FFA726",

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
    backgroundColor: "#ecf0f1",
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
});

export default home;
