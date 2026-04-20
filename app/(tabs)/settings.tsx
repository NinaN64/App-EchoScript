import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  tint: string;
  borderColor: string;
};

function SettingRow({ icon, label, value, toggle, toggleValue, onToggle, tint, borderColor }: SettingRowProps) {
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '18' }]}>
        <ThemedText style={styles.rowIconText}>{icon}</ThemedText>
      </View>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: tint }}
        />
      ) : (
        <ThemedText style={[styles.rowValue, { color: tint }]}>{value}</ThemedText>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon + '22';

  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saveLocally, setSaveLocally] = useState(false);

  const sectionBg = colorScheme === 'dark' ? '#1e2022' : '#f8f9fa';
  const sectionBorder = colorScheme === 'dark' ? '#2c2f31' : '#e8ebed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>TRANSCRIPTION</ThemedText>
          <SettingRow icon="🌐" label="Language" value="English" tint={tint} borderColor={borderColor} />
        </View>
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>STORAGE</ThemedText>
          <SettingRow icon="💾" label="Save recordings locally" toggle toggleValue={saveLocally} onToggle={setSaveLocally} tint={tint} borderColor={borderColor} />
          <SettingRow icon="☁️" label="Cloud backup" value="iCloud" tint={tint} borderColor="transparent" />
        </View>
        <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
          <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>NOTIFICATIONS</ThemedText>
          <SettingRow icon="🔔" label="Enable notifications" toggle toggleValue={notifications} onToggle={setNotifications} tint={tint} borderColor="transparent" />
        </View>

        <ThemedText style={[styles.version, { color: Colors[colorScheme].icon }]}>
          EchoScript v1.0.0
        </ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 32, fontWeight: '800', paddingTop: 16, marginBottom: 8 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileInfo: { gap: 2 },
  profileName: { fontSize: 16, fontWeight: '600' },
  profileEmail: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { fontSize: 16 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: 16 },
});
