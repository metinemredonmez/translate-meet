import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/cn';

type Variant = 'title' | 'heading' | 'body' | 'small' | 'caption';

const variants: Record<Variant, string> = {
  title: 'text-2xl font-bold text-fg',
  heading: 'text-lg font-semibold text-fg',
  body: 'text-base text-fg',
  small: 'text-sm text-fg',
  caption: 'text-xs text-fg-muted',
};

export function ThemedText({
  variant = 'body',
  muted,
  className,
  ...props
}: TextProps & { variant?: Variant; muted?: boolean; className?: string }) {
  return <Text className={cn(variants[variant], muted && 'text-fg-muted', className)} {...props} />;
}
