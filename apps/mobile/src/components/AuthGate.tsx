import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/store/auth';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

/**
 * Shows the sign-in screen when signed out. In development builds the app stays usable
 * (with a "not signed in" banner) so screens can be built before OAuth is wired.
 * There is NO local sign-in bypass: tokens only come from the API.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);
  const { colors } = useTheme();

  useEffect(() => {
    hydrate().catch(() => useAuth.getState().markSignedOut());
  }, [hydrate]);

  if (status === 'unknown') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (status === 'signedOut' && !__DEV__) return <SignInScreen />;
  return (
    <View className="flex-1 bg-background">
      {status === 'signedOut' ? <NotSignedInBanner /> : null}
      <View className="flex-1">{children}</View>
    </View>
  );
}

export function NotSignedInBanner() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/sign-in')}
      className="flex-row items-center justify-center gap-2 bg-warning px-4 pb-2 pt-12"
    >
      <Ionicons name="alert-circle" size={16} color={colors.background} />
      <ThemedText variant="small" className="font-semibold text-background">
        {t('auth.notSignedIn')} · {t('auth.signIn')}
      </ThemedText>
    </Pressable>
  );
}

export function SignInScreen() {
  const { t } = useI18n();

  const notWired = () => Alert.alert(t('auth.signIn'), t('auth.needsDevBuild'));

  // TODO(auth): Apple — expo-apple-authentication (dev build): signInAsync({ nonce: sha256(rawNonce) }),
  //   then useAuth.getState().signInWithIdToken('apple', credential.identityToken, rawNonce).
  const onApple = notWired;
  // TODO(auth): Google — @react-native-google-signin/google-signin (dev build): GoogleSignin.signIn({ nonce }),
  //   then useAuth.getState().signInWithIdToken('google', idToken, rawNonce).
  const onGoogle = notWired;

  return (
    <View className="flex-1 justify-center gap-4 bg-background px-gutter">
      <ThemedText variant="title">{t('auth.title')}</ThemedText>
      <ThemedText muted>{t('auth.subtitle')}</ThemedText>
      <View className="mt-6 gap-3">
        <Button title={t('auth.apple')} icon="logo-apple" onPress={onApple} />
        <Button title={t('auth.google')} icon="logo-google" kind="secondary" onPress={onGoogle} />
      </View>
    </View>
  );
}
