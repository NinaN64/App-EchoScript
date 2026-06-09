import { Platform } from 'react-native';

const tintColorLight = '#4F46E5';
const tintColorDark = '#818CF8';

export const Colors = {
  light: {
    text: '#111827',
    textMuted: '#6B7280',
    background: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
    tint: tintColorLight,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  dark: {
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    background: '#111827',
    card: '#1F2937',
    border: '#374151',
    tint: tintColorDark,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    success: '#34D399',
    warning: '#FCD34D',
    danger: '#F87171',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
