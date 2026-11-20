import type { ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { ThemedText } from './ThemedText';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-6">
      <ThemedText variant="caption" className="mb-2 px-1 uppercase tracking-wider">
        {title}
      </ThemedText>
      <View className="overflow-hidden rounded-2xl border border-line bg-surface">{children}</View>
    </View>
  );
}

export function SettingsRow({
  label,
  hint,
  right,
  last,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
  last?: boolean;
}) {
  return (
    <View className={cn('min-h-14 flex-row items-center gap-3 px-4 py-3', !last && 'border-b border-line')}>
      <View className="flex-1">
        <ThemedText>{label}</ThemedText>
        {hint ? <ThemedText variant="caption">{hint}</ThemedText> : null}
      </View>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl bg-surface-raised p-1">
      {options.map((o) => (
        <ThemedText
          key={o.value}
          accessibilityRole="button"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => onChange(o.value)}
          variant="small"
          className={cn(
            'overflow-hidden rounded-lg px-3 py-1.5 font-semibold',
            o.value === value ? 'bg-primary text-on-primary' : 'text-fg-muted',
          )}
        >
          {o.label}
        </ThemedText>
      ))}
    </View>
  );
}
