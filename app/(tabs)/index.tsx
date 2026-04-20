import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const secondaryBg = isDark ? '#1e2022' : '#f0f0f5';
  const secondaryBorder = isDark ? '#2c2f31' : '#dddde3';
  const secondaryText = isDark ? '#e0e0e0' : '#222';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.appName}>
            EchoScript
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
            Your AI meeting assistant
          </ThemedText>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: secondaryBg, borderColor: secondaryBorder },
            ]}
            onPress={() => router.push('/(tabs)/new-meeting')}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.secondaryLabel, { color: secondaryText }]}>
              Start New Meeting
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: secondaryBg, borderColor: secondaryBorder },
            ]}
            onPress={() => router.push('/(tabs)/history')}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.secondaryLabel, { color: secondaryText }]}>
              View History
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
  },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  illustrationIcon: {
    fontSize: 56,
  },
  illustrationText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    gap: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 50,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 24,
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    gap: 10,
  },
  secondaryIcon: {
    fontSize: 18,
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
