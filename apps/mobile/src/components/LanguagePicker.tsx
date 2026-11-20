import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '@/i18n';
import { LANGUAGES, languageLabelKey, type LanguageCode } from '@/lib/languages';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';
import { ThemedText } from './ThemedText';
import { IconButton } from './Button';

export function LanguagePicker({
  value,
  onChange,
  label,
  className,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  label: string;
  className?: string;
}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${t(languageLabelKey(value))}`}
        onPress={() => setOpen(true)}
        className={cn('flex-1 rounded-xl border border-line bg-surface px-3 py-2 active:opacity-80', className)}
      >
        <ThemedText variant="caption">{label}</ThemedText>
        <View className="flex-row items-center justify-between">
          <ThemedText variant="body" className="font-semibold">
            {t(languageLabelKey(value))}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('lang.pick')}
            className="absolute inset-0 bg-background opacity-70"
            onPress={() => setOpen(false)}
          />
          <View className="max-h-[70%] rounded-t-3xl border border-line bg-surface p-4">
            <ThemedText variant="heading" className="mb-2">
              {t('lang.pick')}
            </ThemedText>
            <FlatList
              data={LANGUAGES as readonly LanguageCode[]}
              keyExtractor={(c) => c}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === value }}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex-row items-center justify-between rounded-xl px-3 py-3',
                    item === value && 'bg-surface-raised',
                  )}
                >
                  <ThemedText>{t(languageLabelKey(item))}</ThemedText>
                  {item === value ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Source + target pickers with a swap button. */
export function LanguageBar({
  source,
  target,
  onChange,
  className,
}: {
  source: LanguageCode;
  target: LanguageCode;
  onChange: (next: { source: LanguageCode; target: LanguageCode }) => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <LanguagePicker
        label={t('lang.from')}
        value={source}
        onChange={(s) => onChange({ source: s, target: s === target ? source : target })}
      />
      <IconButton icon="swap-horizontal" label={t('lang.swap')} onPress={() => onChange({ source: target, target: source })} />
      <LanguagePicker
        label={t('lang.to')}
        value={target}
        onChange={(tg) => onChange({ source: tg === source ? target : source, target: tg })}
      />
    </View>
  );
}
