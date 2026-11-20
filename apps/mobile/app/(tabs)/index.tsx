import { useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type DictKey } from '@/i18n';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';
import type { LanguageCode } from '@/lib/languages';
import type { CaptionLine, CaptionsState, Side } from '@/lib/captions';
import type { ConnectionState } from '@/lib/realtime';
import { useConverse } from '@/lib/useConverse';
import { LanguageBar } from '@/components/LanguagePicker';
import { Button } from '@/components/Button';
import { ThemedText } from '@/components/ThemedText';

const STATE_TONE: Record<ConnectionState, string> = {
  idle: 'text-fg-muted',
  connecting: 'text-fg-muted',
  ready: 'text-success',
  quota_exhausted: 'text-warning',
  network_lost: 'text-warning',
  auth_error: 'text-danger',
  error: 'text-danger',
};

function CaptionHalf({ side, captions, rotated }: { side: Side; captions: CaptionsState; rotated?: boolean }) {
  const { t } = useI18n();
  const lines: CaptionLine[] = captions[side];
  const partial = captions.partial?.side === side ? captions.partial.text : null;
  return (
    <View className={cn('flex-1 rounded-2xl border border-line bg-surface p-3', rotated && 'rotate-180')}>
      <ScrollView contentContainerClassName="gap-2">
        {lines.length === 0 && !partial ? <ThemedText variant="caption">{t('converse.empty')}</ThemedText> : null}
        {lines.map((l) => (
          <View key={l.id}>
            <ThemedText variant="caption">{l.kind === 'forYou' ? t('converse.forYou') : t('converse.heard')}</ThemedText>
            <ThemedText
              variant={l.kind === 'forYou' ? 'heading' : 'small'}
              className={l.kind === 'forYou' ? undefined : 'text-fg-muted'}
            >
              {l.text}
            </ThemedText>
          </View>
        ))}
        {partial ? (
          <ThemedText variant="small" className="italic text-fg-muted">
            {partial}…
          </ThemedText>
        ) : null}
      </ScrollView>
    </View>
  );
}

export default function ConverseScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [langs, setLangs] = useState<{ source: LanguageCode; target: LanguageCode }>({ source: 'tr', target: 'en' });
  const { state, errorCode, captions, connect, disconnect, sendText } = useConverse(langs.source, langs.target);
  const [devText, setDevText] = useState('');

  const active = state === 'connecting' || state === 'ready';
  const stateKey = `converse.state.${state}` as DictKey;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="flex-1 gap-3 px-gutter py-3">
        {/* Top half faces the person opposite (rotated 180°). */}
        <CaptionHalf side="top" captions={captions} rotated />

        <View className="gap-2">
          <LanguageBar
            source={langs.source}
            target={langs.target}
            onChange={(next) => {
              if (!active) setLangs(next);
            }}
          />
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 flex-row items-center gap-2">
              {state === 'connecting' ? <ActivityIndicator color={colors.primary} /> : null}
              <ThemedText variant="small" className={STATE_TONE[state]} accessibilityLiveRegion="polite">
                {t(stateKey, { code: errorCode ?? '' })}
              </ThemedText>
            </View>
            {captions.quotaSeconds !== null ? (
              <ThemedText variant="caption">{t('converse.quotaLeft', { seconds: captions.quotaSeconds })}</ThemedText>
            ) : null}
          </View>
          {active ? (
            <Button title={t('converse.disconnect')} kind="secondary" icon="stop-circle-outline" onPress={disconnect} />
          ) : (
            <Button title={t('converse.connect')} icon="radio-outline" onPress={() => void connect()} />
          )}
          {__DEV__ ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                value={devText}
                onChangeText={setDevText}
                placeholder={t('converse.devInput')}
                placeholderTextColor={colors.textMuted}
                editable={state === 'ready'}
                className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-fg"
                onSubmitEditing={() => {
                  if (sendText(devText)) setDevText('');
                }}
              />
              <Button
                title={t('converse.send')}
                kind="secondary"
                disabled={state !== 'ready' || devText.trim().length === 0}
                onPress={() => {
                  if (sendText(devText)) setDevText('');
                }}
              />
            </View>
          ) : null}
        </View>

        <CaptionHalf side="bottom" captions={captions} />
      </View>
    </SafeAreaView>
  );
}
