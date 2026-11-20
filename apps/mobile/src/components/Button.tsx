import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';
import { ThemedText } from './ThemedText';

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger';

const box: Record<Kind, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-raised border border-line',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};
const label: Record<Kind, string> = {
  primary: 'text-on-primary',
  secondary: 'text-fg',
  ghost: 'text-primary',
  danger: 'text-background',
};

export function Button({
  title,
  kind = 'primary',
  icon,
  loading,
  disabled,
  className,
  ...props
}: Omit<PressableProps, 'children'> & {
  title: string;
  kind?: Kind;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  className?: string;
}) {
  const { colors } = useTheme();
  const iconColor = kind === 'primary' ? colors.onPrimary : kind === 'danger' ? colors.background : colors.text;
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      className={cn(
        'min-h-11 flex-row items-center justify-center gap-2 rounded-xl px-4 py-2.5 active:opacity-80',
        box[kind],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={iconColor} />
      ) : null}
      <ThemedText variant="small" className={cn('font-semibold', label[kind])}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label: a11yLabel,
  className,
  ...props
}: Omit<PressableProps, 'children'> & { icon: keyof typeof Ionicons.glyphMap; label: string; className?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      hitSlop={8}
      className={cn('h-11 w-11 items-center justify-center rounded-full bg-surface-raised active:opacity-80', className)}
      {...props}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );
}
