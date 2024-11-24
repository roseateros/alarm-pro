import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);
  const [alarms, setAlarms] = useState([]);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
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
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    setExpoPushToken(token);
  };

  const setupNotificationListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle received notification
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification response (when user taps notification)
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

  const triggerAlarm = async (alarm) => {
    try {
      // Schedule a notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Wake Up!',
          body: `It's ${alarm.time}`,
          sound: 'default',
          priority: 'max',
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Show immediately
      });

      // Play sound
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alarm-sound.mp3'),
        { shouldPlay: true, isLooping: true }
      );

      // Keep playing for 1 minute or until stopped
      setTimeout(async () => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error stopping sound:', error);
        }
      }, 60000);

    } catch (error) {
      console.error('Error triggering alarm:', error);
    }
  };

  const toggleAlarm = (alarmToToggle) => {
    try {
      // Safety check for undefined alarms
      if (!alarms) {
        console.log('Alarms is undefined, initializing...');
        setAlarms([]);
        return;
      }

      const updatedAlarms = alarms.map(alarm => {
        if (alarm.time === alarmToToggle.time) {
          return {
            ...alarm,
            enabled: !alarm.enabled
          };
        }
        return alarm;
      });

      setAlarms(updatedAlarms);
      saveAlarmsToStorage(updatedAlarms);
    } catch (error) {
      console.error('Error in toggleAlarm:', error);
      // Recovery: reset to empty array if error occurs
      setAlarms([]);
    }
  };

  const saveAlarmsToStorage = async (alarmsToSave) => {
    try {
      // Safety check for undefined alarmsToSave
      if (!alarmsToSave) {
        console.log('alarmsToSave is undefined, saving empty array');
        await AsyncStorage.setItem('alarms', JSON.stringify([]));
        return;
      }

      const cleanAlarms = alarmsToSave.map(alarm => ({
        time: alarm.time || '',
        repeatDays: alarm.repeatDays || [],
        enabled: Boolean(alarm.enabled),
        alternateWeeks: Boolean(alarm.alternateWeeks),
        startWeek: alarm.startWeek || null,
        excludedDates: alarm.excludedDates || []
      }));

      await AsyncStorage.setItem('alarms', JSON.stringify(cleanAlarms));
      console.log('Alarms saved successfully:', cleanAlarms);
    } catch (error) {
      console.error('Error in saveAlarmsToStorage:', error);
      // Recovery: try to save empty array
      try {
        await AsyncStorage.setItem('alarms', JSON.stringify([]));
      } catch (backupError) {
        console.error('Backup save failed:', backupError);
      }
    }
  };

  // Load saved alarms when app starts
  useEffect(() => {
    loadSavedAlarms();
  }, []);

  const loadSavedAlarms = async () => {
    try {
      const savedAlarms = await AsyncStorage.getItem('alarms');
      if (savedAlarms) {
        const parsedAlarms = JSON.parse(savedAlarms);
        if (Array.isArray(parsedAlarms)) {
          setAlarms(parsedAlarms);
        } else {
          console.log('Saved alarms is not an array, initializing empty array');
          setAlarms([]);
        }
      } else {
        console.log('No saved alarms found, initializing empty array');
        setAlarms([]);
      }
    } catch (error) {
      console.error('Error in loadSavedAlarms:', error);
      setAlarms([]); // Recovery: set empty array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAlarm = (newAlarm) => {
    try {
      // Safety check for undefined alarms
      const currentAlarms = alarms || [];
      const updatedAlarms = [...currentAlarms, newAlarm];
      setAlarms(updatedAlarms);
      saveAlarmsToStorage(updatedAlarms);
      setShowAddAlarm(false);
    } catch (error) {
      console.error('Error in handleSaveAlarm:', error);
      alert('Failed to save alarm. Please try again.');
    }
  };

  // Add this to app.json to fix the architecture warning
  useEffect(() => {
    console.log('Current alarms state:', alarms); // Debug log
  }, [alarms]);

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
