import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type PauseMenuSettings = {
  volume: number;
  brightness: number;
  fontSize: number;
  autoSave: boolean;
  haptics: boolean;
  darkMode: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  settings: PauseMenuSettings;
  onSettingsChange: (s: PauseMenuSettings) => void;
};

type CustomSliderProps = {
  value: number;
  color: string;
  onChange: (v: number) => void;
};

function CustomSlider({ value, color, onChange }: CustomSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const posX = useRef(new Animated.Value(0)).current;
  const lastValue = useRef(value);

  useEffect(() => {
    if (trackWidth > 0) {
      posX.setValue(value * trackWidth);
    }
  }, [value, trackWidth, posX]);

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const tw = trackWidth || 1;
        const clamped = clamp(x, 0, tw);
        posX.setValue(clamped);
        const newVal = clamp(clamped / tw, 0, 1);
        lastValue.current = newVal;
        onChange(newVal);
      },
      onPanResponderMove: (_, gs) => {
        const tw = trackWidth || 1;
        const raw = lastValue.current * tw + gs.dx;
        const clamped = clamp(raw, 0, tw);
        posX.setValue(clamped);
        onChange(clamp(clamped / tw, 0, 1));
      },
      onPanResponderRelease: (_, gs) => {
        const tw = trackWidth || 1;
        const raw = lastValue.current * tw + gs.dx;
        const clamped = clamp(raw, 0, tw);
        const final = clamp(clamped / tw, 0, 1);
        lastValue.current = final;
        onChange(final);
      },
    })
  ).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(w);
    posX.setValue(lastValue.current * w);
  }, [posX]);

  const fillWidth = trackWidth > 0
    ? posX.interpolate({ inputRange: [0, trackWidth], outputRange: [0, trackWidth], extrapolate: 'clamp' })
    : new Animated.Value(0);

  return (
    <View style={sliderStyles.wrap} onLayout={onLayout} {...panResponder.panHandlers}>
      <View style={[sliderStyles.track, { backgroundColor: color + '33' }]}>
        <Animated.View style={[sliderStyles.fill, { backgroundColor: color, width: fillWidth }]} />
      </View>
      <Animated.View
        style={[
          sliderStyles.thumb,
          { backgroundColor: color, borderColor: color + '55', transform: [{ translateX: posX }] },
        ]}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: {
    height: 40,
    justifyContent: 'center',
    marginTop: 4,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    marginLeft: -11,
    top: '50%',
    marginTop: -11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

type SliderRowProps = {
  icon: string;
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
};

function SliderRow({ icon, label, value, color, onChange }: SliderRowProps) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
          <ThemedText style={styles.iconText}>{icon}</ThemedText>
        </View>
        <ThemedText style={styles.sliderLabel}>{label}</ThemedText>
        <ThemedText style={[styles.pct, { color }]}>{pct}%</ThemedText>
      </View>
      <CustomSlider value={value} color={color} onChange={onChange} />
    </View>
  );
}

type ToggleRowProps = {
  icon: string;
  label: string;
  value: boolean;
  color: string;
  borderColor: string;
  onToggle: (v: boolean) => void;
};

function ToggleRow({ icon, label, value, color, borderColor, onToggle }: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, { borderBottomColor: borderColor }]}>
      <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
        <ThemedText style={styles.iconText}>{icon}</ThemedText>
      </View>
      <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: color, false: color + '44' }}
        thumbColor={Platform.OS === 'android' ? (value ? color : '#f0f0f0') : undefined}
      />
    </View>
  );
}

const ACCENT  = '#6C63FF';
const AMBER   = '#F5A623';
const GREEN   = '#34C759';
const ORANGE  = '#FF9500';
const INDIGO  = '#5E5CE6';

export default function PauseMenu({ visible, onClose, settings, onSettingsChange }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const [local, setLocal] = useState<PauseMenuSettings>(settings);
  useEffect(() => { if (visible) setLocal(settings); }, [visible, settings]);

  const set = <K extends keyof PauseMenuSettings>(key: K, val: PauseMenuSettings[K]) => {
    const next = { ...local, [key]: val };
    setLocal(next);
    onSettingsChange(next);
  };

  const slideY   = useRef(new Animated.Value(700)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY,  { toValue: 0,   useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim,{ toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,   { toValue: 700, duration: 280, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideY, fadeAnim]);

  const cardBg  = isDark ? '#1e2224' : '#ffffff';
  const innerBg = isDark ? '#252a2d' : '#f5f7f9';
  const divider = isDark ? '#2c3033' : '#e5e8ea';
  const textSub = isDark ? '#9BA1A6' : '#687076';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar translucent backgroundColor="transparent" />

      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheetWrap, { transform: [{ translateY: slideY }] }]}>
        <View style={[styles.sheet, { backgroundColor: cardBg }]}>
          <SafeAreaView edges={['bottom']}>

            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: ACCENT + '66' }]} />
            </View>

            <View style={styles.header}>
              <View>
                <ThemedText style={styles.headerTitle}>⏸  Pause Menu</ThemedText>
                <ThemedText style={[styles.headerSub, { color: textSub }]}>Adjust your preferences</ThemedText>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: divider }]}>
                <ThemedText style={styles.closeBtnText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.sectionLabel, { color: textSub }]}>AUDIO & DISPLAY</ThemedText>
            <View style={[styles.card, { backgroundColor: innerBg, borderColor: divider }]}>
              <SliderRow icon="🔊" label="Volume"     value={local.volume}     color={ACCENT} onChange={v => set('volume', v)} />
              <View style={[styles.divLine, { backgroundColor: divider }]} />
              <SliderRow icon="☀️" label="Brightness" value={local.brightness} color={AMBER}  onChange={v => set('brightness', v)} />
              <View style={[styles.divLine, { backgroundColor: divider }]} />
              <SliderRow icon="🔡" label="Font Size"  value={local.fontSize}   color={GREEN}  onChange={v => set('fontSize', v)} />
            </View>

            <ThemedText style={[styles.sectionLabel, { color: textSub }]}>PREFERENCES</ThemedText>
            <View style={[styles.card, { backgroundColor: innerBg, borderColor: divider }]}>
              <ToggleRow icon="💾" label="Auto-save recordings" value={local.autoSave} color={ACCENT}  borderColor={divider} onToggle={v => set('autoSave', v)} />
              <ToggleRow icon="📳" label="Haptic feedback"      value={local.haptics}  color={ORANGE}  borderColor={divider} onToggle={v => set('haptics', v)} />
              <ToggleRow icon="🌙" label="Dark mode"            value={local.darkMode} color={INDIGO}  borderColor="transparent" onToggle={v => set('darkMode', v)} />
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={[styles.doneBtn, { backgroundColor: ACCENT }]}
            >
              <ThemedText style={styles.doneBtnText}>Done</ThemedText>
            </TouchableOpacity>

          </SafeAreaView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },

  handleWrap: { alignItems: 'center', paddingTop: 14, paddingBottom: 6 },
  handle: { width: 44, height: 5, borderRadius: 3 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    marginTop: 6,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub:   { fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  divLine: { height: 1, marginHorizontal: 16 },

  sliderRow: { paddingHorizontal: 16, paddingVertical: 12 },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 17 },
  sliderLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  pct: { fontSize: 14, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  doneBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
