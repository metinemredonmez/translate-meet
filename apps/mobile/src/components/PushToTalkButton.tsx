import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';
import { ThemedText } from './ThemedText';

/**
 * Hold-to-talk button (UI only in sprint 1).
 * TODO(sprint-2): record PCM16 mono 16 kHz (expo-audio), request mic permission, stream/send audio.
 */
export function PushToTalkButton({ onStart, onEnd }: { onStart?: () => void; onEnd?: () => void }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('translate.pushToTalk')}
        accessibilityState={{ selected: pressed }}
        onPressIn={() => {
          setPressed(true);
          onStart?.();
        }}
        onPressOut={() => {
          setPressed(false);
          onEnd?.();
        }}
        className={cn(
          'h-20 w-20 items-center justify-center rounded-full',
          pressed ? 'scale-110 bg-accent' : 'bg-primary',
        )}
      >
        <Ionicons name={pressed ? 'mic' : 'mic-outline'} size={34} color={colors.onPrimary} />
      </Pressable>
      <ThemedText variant="caption">{pressed ? t('translate.recording') : t('translate.pushToTalk')}</ThemedText>
    </View>
  );
}
