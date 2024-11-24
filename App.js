import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { darkTheme } from './theme/colors';
import AddAlarmModal from './components/AddAlarmModal';
import AlarmItem from './components/AlarmItem';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export default function App() {
  const [alarms, setAlarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const soundRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setIsLoading(false);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    setupNotificationListeners();
    startAlarmChecker();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useEffect(() => {
    saveAlarmsToStorage();
  }, [alarms]);

  const registerForPushNotificationsAsync = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      console.error('Error registering for notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });
  };

  const startAlarmChecker = () => {
    // Check alarms every minute
    setInterval(() => {
      checkAlarms();
    }, 60000); // 60000ms = 1 minute
    
    // Also check immediately
    checkAlarms();
  };

  const checkAlarms = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = now.toISOString().split('T')[0];
    const currentWeek = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));

    console.log('Checking alarms:', { currentHour, currentMinute, currentDay });

    alarms.forEach(alarm => {
      if (!alarm.enabled) return;

      // Check if date is excluded
      if (alarm.excludedDates?.includes(currentDate)) {
        console.log('Date excluded:', currentDate);
        return;
      }

      // Check alternate weeks
      if (alarm.alternateWeeks) {
        const weeksSinceStart = currentWeek - alarm.startWeek;
        if (weeksSinceStart % 2 !== 0) {
          console.log('Alternate week - skipping');
          return;
        }
      }

      const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
      
      if (currentHour === alarmHour && 
          currentMinute === alarmMinute && 
          alarm.repeatDays.includes(currentDay)) {
        console.log('Triggering alarm:', alarm);
        triggerAlarm(alarm);
      }
    });
  };

  const stopAlarm = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      Vibration.cancel();
    } catch (error) {
      console.error('Error stopping alarm:', error);
    }
  };

  const triggerAlarm = async (alarm) => {
    try {
      // Stop any existing alarm
      await stopAlarm();

      // Play notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Wake Up!',
          body: `It's ${alarm.time}`,
          sound: 'default',
          priority: 'max',
        },
        trigger: null,
      });

      // Start vibration
      Vibration.vibrate([1000, 2000, 3000], true);

      // Play sound
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alarm-sound.mp3'),
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      
      soundRef.current = sound;

      // Show stop alert
      Alert.alert(
        'Alarm!',
        `It's ${alarm.time}`,
        [
          {
            text: 'STOP',
            onPress: stopAlarm,
            style: 'destructive',
          }
        ],
        { 
          cancelable: false,
          onDismiss: stopAlarm 
        }
      );

    } catch (error) {
      console.error('Error triggering alarm:', error);
    }
  };

  const toggleAlarm = async (alarmToToggle) => {
    const updatedAlarms = alarms.map(alarm => 
      alarm.time === alarmToToggle.time 
        ? { ...alarm, enabled: !alarm.enabled }
        : alarm
    );
    setAlarms(updatedAlarms);
  };

  const saveAlarmsToStorage = async (alarmsToSave = alarms) => {
    try {
      const cleanAlarms = alarmsToSave.map(alarm => ({
        time: alarm.time,
        repeatDays: alarm.repeatDays || [],
        enabled: Boolean(alarm.enabled),
        alternateWeeks: Boolean(alarm.alternateWeeks),
        startWeek: alarm.startWeek || null,
        excludedDates: alarm.excludedDates || []
      }));

      await AsyncStorage.setItem('alarms', JSON.stringify(cleanAlarms));
      console.log('Alarms saved successfully:', cleanAlarms);
    } catch (error) {
      console.error('Error saving alarms:', error);
      alert('Failed to save alarms. Please try again.');
    }
  };

  // Load alarms immediately when app starts
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const savedAlarms = await AsyncStorage.getItem('@alarms');
        if (savedAlarms !== null) {
          setAlarms(JSON.parse(savedAlarms));
          console.log('Loaded alarms:', JSON.parse(savedAlarms));
        }
      } catch (error) {
        console.error('Error loading alarms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlarms();
  }, []);

  // Save alarms whenever they change
  useEffect(() => {
    const saveAlarms = async () => {
      try {
        await AsyncStorage.setItem('@alarms', JSON.stringify(alarms));
        console.log('Saved alarms:', alarms);
      } catch (error) {
        console.error('Error saving alarms:', error);
      }
    };

    if (!isLoading) {
      saveAlarms();
    }
  }, [alarms, isLoading]);

  const handleSaveAlarm = async (newAlarm) => {
    setAlarms(prevAlarms => [...prevAlarms, newAlarm]);
    setShowAddAlarm(false);
  };

  // Check alarms every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

      alarms.forEach(alarm => {
        if (!alarm.enabled) return;

        const [alarmHour, alarmMinute] = alarm.time.split(':').map(Number);
        
        if (currentHour === alarmHour && 
            currentMinute === alarmMinute && 
            alarm.repeatDays.includes(currentDay)) {
          triggerAlarm(alarm);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [alarms]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <LottieView
          source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_qm8eqzse.json' }}
          autoPlay
          loop
          style={styles.animation}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[darkTheme.background.primary, darkTheme.background.secondary]}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Alarm</Text>
              <Text style={styles.headerSubtitle}>
                {(alarms || []).filter(a => a.enabled).length} Active
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddAlarm(true)}
            >
              <Text style={styles.addButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Alarms List */}
          <ScrollView 
            style={styles.alarmList}
            showsVerticalScrollIndicator={false}
          >
            {Array.isArray(alarms) && alarms.map((alarm, index) => (
              <AlarmItem
                key={index}
                alarm={alarm}
                onToggle={() => toggleAlarm(alarm)}
                onDelete={() => {
                  const newAlarms = alarms.filter((_, i) => i !== index);
                  setAlarms(newAlarms);
                  saveAlarmsToStorage(newAlarms);
                }}
              />
            ))}
          </ScrollView>

          {/* Add Alarm Modal */}
          {showAddAlarm && (
            <AddAlarmModal
              visible={showAddAlarm}
              onClose={() => setShowAddAlarm(false)}
              onSave={handleSaveAlarm}
            />
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.background.primary,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: darkTheme.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    color: darkTheme.text.primary,
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 20,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: darkTheme.text.primary,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: darkTheme.text.secondary,
    marginTop: 4,
  },
  addButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  addButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    color: darkTheme.text.primary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  alarmList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: darkTheme.text.primary,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: darkTheme.text.secondary,
    marginTop: 8,
  },
});
