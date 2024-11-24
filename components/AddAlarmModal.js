import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { darkTheme } from '../theme/colors';

export default function AddAlarmModal({ visible, onClose, onSave }) {
  const [time, setTime] = useState(new Date());
  const [repeatDays, setRepeatDays] = useState([]);
  const [alternateWeeks, setAlternateWeeks] = useState(false);
  const [excludedDates, setExcludedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleSave = () => {
    const newAlarm = {
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      repeatDays: repeatDays || [],
      enabled: true,
      alternateWeeks: alternateWeeks || false,
      startWeek: alternateWeeks ? Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000)) : null,
      excludedDates: Object.keys(excludedDates || {})
    };
    
    onSave(newAlarm);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <LinearGradient colors={darkTheme.gradients.card} style={styles.modalContent}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>New Alarm</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            <View style={styles.timePickerContainer}>
              <DateTimePicker
                value={time}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={(event, selectedTime) => setTime(selectedTime || time)}
                textColor={darkTheme.text.primary}
              />
            </View>

            {/* Repeat Days */}
            <Text style={styles.sectionTitle}>Repeat Days</Text>
            <View style={styles.daysContainer}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayPill, repeatDays.includes(day) && styles.selectedDay]}
                  onPress={() => {
                    if (repeatDays.includes(day)) {
                      setRepeatDays(repeatDays.filter(d => d !== day));
                    } else {
                      setRepeatDays([...repeatDays, day]);
                    }
                  }}
                >
                  <Text style={[styles.dayText, repeatDays.includes(day) && styles.selectedDayText]}>
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Alternate Weeks */}
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Alternate Weeks</Text>
              <Switch
                value={alternateWeeks}
                onValueChange={setAlternateWeeks}
                trackColor={{ false: '#767577', true: darkTheme.accent.purple }}
                thumbColor={alternateWeeks ? '#fff' : '#f4f3f4'}
              />
            </View>

            {/* Excluded Dates */}
            <Text style={styles.sectionTitle}>Exclude Dates</Text>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={styles.calendarButtonText}>
                {Object.keys(excludedDates).length} dates excluded
              </Text>
            </TouchableOpacity>

            {showCalendar && (
              <Calendar
                theme={{
                  backgroundColor: darkTheme.background.card,
                  calendarBackground: darkTheme.background.card,
                  textSectionTitleColor: darkTheme.text.primary,
                  selectedDayBackgroundColor: darkTheme.accent.red,
                  selectedDayTextColor: darkTheme.text.primary,
                  todayTextColor: darkTheme.accent.purple,
                  dayTextColor: darkTheme.text.primary,
                  textDisabledColor: darkTheme.text.muted,
                  monthTextColor: darkTheme.text.primary,
                }}
                markedDates={typeof excludedDates === 'object' ? excludedDates : 
                  (Array.isArray(excludedDates) ? excludedDates.reduce((acc, date) => ({
                    ...acc,
                    [date]: { selected: true, selectedColor: darkTheme.accent.red }
                  }), {}) : {})}
                onDayPress={(day) => {
                  setExcludedDates(prev => {
                    const newDates = typeof prev === 'object' ? { ...prev } : 
                      (Array.isArray(prev) ? prev.reduce((acc, date) => ({
                        ...acc,
                        [date]: { selected: true, selectedColor: darkTheme.accent.red }
                      }), {}) : {});

                    if (newDates[day.dateString]) {
                      delete newDates[day.dateString];
                    } else {
                      newDates[day.dateString] = { selected: true, selectedColor: darkTheme.accent.red };
                    }
                    return newDates;
                  });
                }}
              />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Alarm</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: darkTheme.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: darkTheme.text.primary,
  },
  closeButton: {
    padding: 8,
  },
  timePickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: darkTheme.background.card,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: darkTheme.text.primary,
    marginBottom: 15,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  dayPill: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: darkTheme.background.card,
    minWidth: '14%',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: darkTheme.accent.purple,
  },
  dayText: {
    color: darkTheme.text.secondary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  selectedDayText: {
    color: darkTheme.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: darkTheme.text.primary,
  },
  calendarButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: darkTheme.background.card,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: darkTheme.text.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: darkTheme.accent.purple,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: darkTheme.text.primary,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
}); 