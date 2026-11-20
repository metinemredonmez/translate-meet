import '../global.css';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { themeVars, useTheme } from '@/theme';
import { AuthGate } from '@/components/AuthGate';
import { useI18n } from '@/i18n';

export default function RootLayout() {
  const { scheme, colors } = useTheme();
  const { t } = useI18n();
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={themeVars(scheme)} className="flex-1 bg-background">
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="sign-in"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: t('auth.signIn'),
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.text,
                }}
              />
            </Stack>
          </AuthGate>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
