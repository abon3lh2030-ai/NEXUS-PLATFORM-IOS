import { Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, View } from 'react-native';
import { Empty, Glass, Hero, Pill, Row } from '@/components/glass';
import { Text } from '@/components/ui';
import { AI_STATUS, isStuck, PRIORITY, TASK_STATUS, useAiEmployees, useTask } from '@/lib/data';
import { ago, dueLabel } from '@/lib/format';
import { useColors } from '@/theme';

/** Task status with the AI employee's live progress (refreshes every 10 seconds). */
export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { data } = useTask(id);
  const ai = useAiEmployees().data ?? [];
  const t = data?.task;
  if (!t) return <Stack.Screen options={{ title: '' }} />;
  const employee = ai.find((a) => a.id === t.assignee_ai_employee_id);
  const s = data?.session;
  const stuck = isStuck(t);
  const color = t.status === 'done' ? c.success : stuck ? c.destructive : c.primary;
  return (
    <>
      <Stack.Screen options={{ title: 'المهمة', headerLargeTitleEnabled: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}>
        <View style={{ backgroundColor: c.elevated, borderRadius: 24, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={stuck && t.status !== 'blocked' ? 'متأخرة' : TASK_STATUS[t.status]} color={color} />
            <Pill label={`أولوية ${PRIORITY[t.priority]}`} color={t.priority === 'urgent' || t.priority === 'high' ? c.warning : c.mutedForeground} />
            {t.due_date && t.status !== 'done' ? <Pill label={dueLabel(t.due_date) ?? ''} color={stuck ? c.destructive : c.mutedForeground} /> : null}
          </View>
          <Text weight="bold" size={22}>{t.title}</Text>
          {t.description ? <Text size={16} style={{ lineHeight: 26 }}>{t.description}</Text> : null}
        </View>

        {employee ? (
          <Hero>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SymbolView name="sparkles" size={20} tintColor="#fff" />
              <Text weight="bold" size={17} style={{ color: '#fff', flex: 1 }}>{employee.name}</Text>
              <Text size={13} style={{ color: 'rgba(255,255,255,0.9)' }}>{AI_STATUS[employee.status] ?? employee.status}</Text>
            </View>
            <Glass style={{ gap: 4 }}>
              <Text size={13} style={{ color: 'rgba(255,255,255,0.85)' }}>{s ? 'الخطوة الحالية' : 'الحالة'}</Text>
              <Text weight="semibold" size={16} style={{ color: '#fff' }}>{s?.current_step ?? (t.status === 'done' ? 'أنهى المهمة' : 'لم يبدأ بعد')}</Text>
              {s ? <Text size={12} style={{ color: 'rgba(255,255,255,0.8)' }}>{s.step_count} خطوات · بدأ {ago(s.started_at)}</Text> : null}
            </Glass>
          </Hero>
        ) : null}

        {employee ? (
          <View style={{ gap: 8 }}>
            <Text weight="bold" size={20} style={{ paddingHorizontal: 6 }}>سجل العمل</Text>
            <View style={{ backgroundColor: c.elevated, borderRadius: 22, overflow: 'hidden' }}>
              {(data?.events ?? []).length === 0 ? (
                <Empty icon="clock" title="لا خطوات مسجلة بعد" />
              ) : (
                data!.events.map((e, i) => <Row key={e.id} icon="circle.fill" iconColor={c.primary} title={e.message} subtitle={ago(e.created_at)} last={i === data!.events.length - 1} />)
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
