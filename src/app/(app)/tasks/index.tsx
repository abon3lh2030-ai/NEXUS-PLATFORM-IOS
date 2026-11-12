import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Empty, Pill, Row, ScreenTitle } from '@/components/glass';
import { Text } from '@/components/ui';
import { isStuck, TASK_STATUS, useAiEmployees, useTasks, type Task } from '@/lib/data';
import { dueLabel } from '@/lib/format';
import { useColors } from '@/theme';

type Filter = 'open' | 'stuck' | 'done';
const FILTERS: Array<[Filter, string]> = [['open', 'مفتوحة'], ['stuck', 'متعثرة'], ['done', 'منجزة']];

export default function Tasks() {
  const c = useColors();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'open');
  const [refreshing, setRefreshing] = useState(false);
  const tasks = useTasks().data ?? [];
  const ai = useAiEmployees().data ?? [];
  const names = useMemo(() => new Map(ai.map((a) => [a.id, a.name])), [ai]);
  const list = tasks.filter((t) => (filter === 'done' ? t.status === 'done' : filter === 'stuck' ? isStuck(t) : t.status !== 'done'));
  const statusColor = (t: Task) => (t.status === 'done' ? c.success : isStuck(t) ? c.destructive : t.status === 'in_progress' ? c.primary : t.status === 'review' ? c.warning : c.mutedForeground);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await qc.invalidateQueries(); setRefreshing(false); }} />}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <ScreenTitle title="المهام" />
          <Pressable onPress={() => router.push('/tasks/new')} hitSlop={10} style={{ backgroundColor: c.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 4 }}>
            <Text weight="semibold" size={14} style={{ color: c.primaryForeground }}>+ مهمة جديدة</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, backgroundColor: c.elevated, borderRadius: 999, padding: 4 }}>
          {FILTERS.map(([f, label]) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, backgroundColor: filter === f ? c.primary : 'transparent', alignItems: 'center' }}>
              <Text weight="semibold" size={14} style={{ color: filter === f ? c.primaryForeground : c.foreground }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ backgroundColor: c.elevated, borderRadius: 22, overflow: 'hidden' }}>
          {list.length === 0 ? (
            <Empty icon="checklist" title={filter === 'stuck' ? 'لا توجد مهام متعثرة' : 'لا توجد مهام'} />
          ) : (
            list.map((t, i) => (
              <Row
                key={t.id}
                icon={t.assignee_ai_employee_id ? 'sparkles' : 'person'}
                iconColor={statusColor(t)}
                title={t.title}
                subtitle={[t.assignee_ai_employee_id ? names.get(t.assignee_ai_employee_id) : null, t.status !== 'done' ? dueLabel(t.due_date) : null].filter(Boolean).join(' · ') || null}
                trailing={<Pill label={TASK_STATUS[t.status]} color={statusColor(t)} />}
                onPress={() => router.push(`/tasks/${t.id}`)}
                last={i === list.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}
