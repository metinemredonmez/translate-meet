import { ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n, type AppLanguage } from '@/i18n';
import { useTheme } from '@/theme';
import { SPEECH_RATE_MAX, SPEECH_RATE_MIN, SPEECH_RATE_STEP, useSettings } from '@/store/settings';
import { useAuth } from '@/store/auth';
import { router } from 'expo-router';
import { Segmented, SettingsRow, SettingsSection } from '@/components/SettingsRow';
import { ThemedText } from '@/components/ThemedText';
import { Button, IconButton } from '@/components/Button';

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { colors } = useTheme();
  const speechRate = useSettings((s) => s.speechRate);
  const setSpeechRate = useSettings((s) => s.setSpeechRate);
  const autoPlay = useSettings((s) => s.autoPlay);
  const setAutoPlay = useSettings((s) => s.setAutoPlay);
  const authStatus = useAuth((s) => s.status);
  const signOut = useAuth((s) => s.signOut);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-gutter py-4">
        <ThemedText variant="title" className="mb-6">
          {t('tabs.settings')}
        </ThemedText>

        <SettingsSection title={t('tabs.settings')}>
          <SettingsRow
            label={t('settings.appLanguage')}
            right={
              <Segmented<AppLanguage>
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'tr', label: 'TR' },
                  { value: 'en', label: 'EN' },
                ]}
              />
            }
          />
          <SettingsRow
            label={t('settings.speechRate')}
            right={
              <View className="flex-row items-center gap-2">
                <IconButton
                  icon="remove"
                  label={t('settings.decrease')}
                  disabled={speechRate <= SPEECH_RATE_MIN}
                  onPress={() => setSpeechRate(speechRate - SPEECH_RATE_STEP)}
                />
                <ThemedText className="w-12 text-center font-semibold">{speechRate.toFixed(1)}x</ThemedText>
                <IconButton
                  icon="add"
                  label={t('settings.increase')}
                  disabled={speechRate >= SPEECH_RATE_MAX}
                  onPress={() => setSpeechRate(speechRate + SPEECH_RATE_STEP)}
                />
              </View>
            }
          />
          <SettingsRow
            last
            label={t('settings.autoPlay')}
            hint={t('settings.autoPlayHint')}
            right={
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={autoPlay ? colors.primary : colors.surfaceRaised}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title={t('settings.account')}>
          <View className="p-4">
            {authStatus === 'signedIn' ? (
              <Button title={t('auth.signOut')} kind="secondary" icon="log-out-outline" onPress={() => void signOut()} />
            ) : (
              <Button title={t('auth.signIn')} icon="log-in-outline" onPress={() => router.push('/sign-in')} />
            )}
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
