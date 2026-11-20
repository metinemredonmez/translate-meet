import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useMutation } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { translateText } from '@/api/endpoints';
import { MAX_TEXT_CHARS, type Translation } from '@/api/types';
import { errorKey } from '@/lib/errorMessage';
import type { LanguageCode } from '@/lib/languages';
import { LanguageBar } from '@/components/LanguagePicker';
import { Button } from '@/components/Button';
import { ThemedText } from '@/components/ThemedText';
import { PushToTalkButton } from '@/components/PushToTalkButton';

export default function TranslateScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [langs, setLangs] = useState<{ source: LanguageCode; target: LanguageCode }>({ source: 'tr', target: 'en' });
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [voiceHint, setVoiceHint] = useState(false);

  const mutation = useMutation<Translation, unknown, { text: string; source_lang: string; target_lang: string }>({
    mutationFn: translateText, // fresh Idempotency-Key generated per call
  });

  const trimmed = text.trim();
  const tooLong = text.length > MAX_TEXT_CHARS;
  const canSubmit = trimmed.length > 0 && !tooLong && !mutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    setCopied(false);
    mutation.mutate({ text: trimmed, source_lang: langs.source, target_lang: langs.target });
  };

  const paste = async () => {
    const clip = await Clipboard.getStringAsync();
    if (clip) setText(clip.slice(0, MAX_TEXT_CHARS));
  };

  const copy = async () => {
    if (!mutation.data) return;
    await Clipboard.setStringAsync(mutation.data.translated_text);
    setCopied(true);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-4 px-gutter py-4" keyboardShouldPersistTaps="handled">
          <ThemedText variant="title">{t('tabs.translate')}</ThemedText>
          <LanguageBar source={langs.source} target={langs.target} onChange={setLangs} />

          <View className="rounded-2xl border border-line bg-surface p-3">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('translate.placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={MAX_TEXT_CHARS + 1}
              className="min-h-32 text-base text-fg"
              textAlignVertical="top"
              accessibilityLabel={t('translate.placeholder')}
            />
            <View className="mt-2 flex-row items-center justify-between">
              <ThemedText variant="caption" className={tooLong ? 'text-danger' : undefined}>
                {tooLong ? t('translate.tooLong', { max: MAX_TEXT_CHARS }) : `${text.length}/${MAX_TEXT_CHARS}`}
              </ThemedText>
              <View className="flex-row gap-2">
                {text.length > 0 ? (
                  <Button title={t('translate.clear')} kind="ghost" onPress={() => setText('')} />
                ) : null}
                <Button title={t('translate.paste')} kind="secondary" icon="clipboard-outline" onPress={() => void paste()} />
              </View>
            </View>
          </View>

          <Button
            title={t('translate.submit')}
            icon="arrow-forward"
            onPress={submit}
            disabled={!canSubmit}
            loading={mutation.isPending}
          />

          {mutation.isError ? (
            <ThemedText className="text-danger" accessibilityRole="alert">
              {t(errorKey(mutation.error))}
            </ThemedText>
          ) : null}

          {mutation.data ? (
            <View className="gap-2 rounded-2xl border border-line bg-surface-raised p-4">
              <ThemedText variant="caption">{t('translate.result')}</ThemedText>
              <ThemedText variant="body" selectable>
                {mutation.data.translated_text}
              </ThemedText>
              <Button
                title={copied ? t('translate.copied') : t('translate.copy')}
                kind="secondary"
                icon={copied ? 'checkmark' : 'copy-outline'}
                onPress={() => void copy()}
                className="self-start"
              />
            </View>
          ) : null}

          <View className="mt-4 items-center gap-2">
            {/* TODO(sprint-2): send recorded audio for translation. */}
            <PushToTalkButton onEnd={() => setVoiceHint(true)} />
            {voiceHint ? <ThemedText variant="caption">{t('translate.voiceSoon')}</ThemedText> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
