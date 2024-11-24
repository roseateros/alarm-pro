import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkTheme } from '../theme/colors';

export default function AlarmItem({ alarm, onToggle }) {
  const repeatDays = alarm.repeatDays || [];
  const excludedDates = alarm.excludedDates || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={darkTheme.gradients.card}
        style={styles.cardGradient}
      >
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{alarm.time}</Text>
          <Switch
            value={alarm.enabled}
            onValueChange={() => onToggle()}
            trackColor={{ false: '#404040', true: darkTheme.accent.purple }}
            thumbColor={alarm.enabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        {repeatDays.length > 0 && (
          <View style={styles.daysContainer}>
            {repeatDays.map((day, index) => (
              <View 
                key={day}
                style={[styles.dayPill, index < repeatDays.length - 1 && styles.dayPillMargin]}
              >
                <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
              </View>
            ))}
          </View>
        )}

        {alarm.alternateWeeks && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Alternate Weeks</Text>
          </View>
        )}

        {excludedDates.length > 0 && (
          <View style={styles.excludedDatesContainer}>
            <Text style={styles.excludedDatesText}>
              {excludedDates.length} excluded {excludedDates.length === 1 ? 'date' : 'dates'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 40,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: darkTheme.text.primary,
    letterSpacing: -1,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  dayPill: {
    backgroundColor: darkTheme.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dayText: {
    color: darkTheme.text.secondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  badge: {
    backgroundColor: darkTheme.accent.purple,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  badgeText: {
    color: darkTheme.text.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  excludedDatesContainer: {
    backgroundColor: darkTheme.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  excludedDatesText: {
    color: darkTheme.text.secondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
}); 