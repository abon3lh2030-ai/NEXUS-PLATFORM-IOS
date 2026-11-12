import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSession } from '@/auth/session';
import { Empty, Hero, Pill, Row, ScreenTitle, Section, StatTile } from '@/components/glass';
import { Text } from '@/components/ui';
import { AI_STATUS, APPROVAL_TYPE, isAiWorking, isEscalated, isSensitive, isStuck, TASK_STATUS, useActiveSessions, useAiEmployees, usePendingApprovals, useRecentEvents, useTasks, type Approval, type Task } from '@/lib/data';
import { ago, dueLabel, waitingFor } from '@/lib/format';
import { APP_ROLE_LABEL } from '@/lib/roles';
import { useColors } from '@/theme';

export default function Home() {
  const { org, userName } = useSession();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };
  if (!org) return null;
  const firstName = userName.split(' ')[0] ?? userName;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}>
        <ScreenTitle title={`أهلًا ${firstName}`} subtitle={`${org.name} · ${APP_ROLE_LABEL[org.appRole]}`} />
        {org.appRole === 'ceo' ? <CeoHome /> : org.appRole === 'manager' ? <ManagerHome /> : <EmployeeHome />}
      </ScrollView>
    </>
  );
}

function useNames() {
  const ai = useAiEmployees().data ?? [];
  return useMemo(() => new Map(ai.map((a) => [a.id, a.name])), [ai]);
}

/* ------------------------------ CEO ------------------------------ */

function CeoHome() {
  const approvals = usePendingApprovals().data ?? [];
  const tasks = useTasks().data ?? [];
  const ai = useAiEmployees().data ?? [];
  const events = useRecentEvents(4).data ?? [];
  const names = useNames();
  const today = new Date().toDateString();
  const doneToday = tasks.filter((t) => t.completed_at && new Date(t.completed_at).toDateString() === today).length;
  const stuck = tasks.filter(isStuck);
  const escalated = approvals.filter(isEscalated);
  return (
    <>
      <Hero>
        <Text weight="semibold" size={15} style={{ color: '#fff' }}>نبض الشركة</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile label="موظف AI يعمل الآن" value={ai.filter((a) => isAiWorking(a.status)).length} icon="cpu" />
          <StatTile label="منجزة اليوم" value={doneToday} icon="checkmark.circle" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile label="مهام متعثرة" value={stuck.length} icon="exclamationmark.triangle" onPress={() => router.push('/tasks?filter=stuck')} />
          <StatTile label="موافقات منتظرة" value={approvals.length} icon="checkmark.seal" onPress={() => router.push('/approvals')} />
        </View>
      </Hero>

      <Section title="مصعّدة لك">
        {escalated.length === 0 ? <Empty icon="checkmark.shield" title="لا شيء يحتاجك الآن" subtitle="تظهر هنا الموافقات عالية الخطورة أو المنتظرة أكثر من 24 ساعة." /> : escalated.map((a, i) => <ApprovalRow key={a.id} a={a} name={names.get(a.requested_by_ai_employee_id ?? '')} last={i === escalated.length - 1} />)}
      </Section>

      <Timeline events={events} names={names} />
    </>
  );
}

/* ------------------------------ Manager ------------------------------ */

function ManagerHome() {
  const c = useColors();
  const approvals = usePendingApprovals().data ?? [];
  const tasks = useTasks().data ?? [];
  const sessions = useActiveSessions().data ?? [];
  const ai = useAiEmployees().data ?? [];
  const events = useRecentEvents(6).data ?? [];
  const names = useNames();
  const stuck = tasks.filter(isStuck);
  return (
    <>
      <Hero>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile label="بانتظار قرارك" value={approvals.length} icon="checkmark.seal" onPress={() => router.push('/approvals')} />
          <StatTile label="متعثرة" value={stuck.length} icon="exclamationmark.triangle" onPress={() => router.push('/tasks?filter=stuck')} />
          <StatTile label="AI يعمل" value={ai.filter((a) => isAiWorking(a.status)).length} icon="cpu" />
        </View>
      </Hero>

      <Section title="صندوق الموافقات" action={approvals.length ? { label: 'الكل', onPress: () => router.push('/approvals') } : undefined}>
        {approvals.length === 0 ? <Empty icon="checkmark.seal" title="لا توجد موافقات منتظرة" /> : approvals.slice(0, 3).map((a, i, arr) => <ApprovalRow key={a.id} a={a} name={names.get(a.requested_by_ai_employee_id ?? '')} last={i === arr.length - 1} />)}
      </Section>

      <Section title="مهام متعثرة">
        {stuck.length === 0 ? <Empty icon="checkmark.circle" title="لا توجد مهام متعثرة" /> : stuck.slice(0, 5).map((t, i, arr) => <TaskRow key={t.id} t={t} name={names.get(t.assignee_ai_employee_id ?? '')} last={i === arr.length - 1} />)}
      </Section>

      <Section title="الفريق الآن">
        {ai.map((e, i) => {
          const s = sessions.find((x) => x.ai_employee_id === e.id);
          return <Row key={e.id} icon="person.crop.circle.badge.checkmark" iconColor={isAiWorking(e.status) ? c.success : c.mutedForeground} title={e.name} subtitle={s?.current_step ?? e.job_title} trailing={<Pill label={AI_STATUS[e.status] ?? e.status} color={isAiWorking(e.status) ? c.success : c.mutedForeground} />} last={i === ai.length - 1} />;
        })}
      </Section>

      <Timeline events={events} names={names} />
    </>
  );
}

/* ------------------------------ Employee ------------------------------ */

function EmployeeHome() {
  const c = useColors();
  const { userId } = useSession();
  const tasks = useTasks().data ?? [];
  const names = useNames();
  const sessions = useActiveSessions().data ?? [];
  // Tasks I handed to AI employees.
  const mine = tasks.filter((t) => t.assignee_ai_employee_id && t.creator_user_id === userId);
  const open = mine.filter((t) => t.status !== 'done');
  return (
    <>
      <Hero>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <StatTile label="قيد التنفيذ" value={open.length} icon="arrow.triangle.2.circlepath" />
          <StatTile label="منجزة هذا الأسبوع" value={mine.length - open.length} icon="checkmark.circle" />
        </View>
      </Hero>
      <Section title="مهامي عند موظفي AI" action={{ label: 'مهمة جديدة', onPress: () => router.push('/tasks/new') }}>
        {mine.length === 0 ? (
          <Empty icon="sparkles" title="لم تكلّف موظفي الذكاء الاصطناعي بشيء بعد" subtitle="أضف مهمة وسيبدأ الموظف العمل عليها مباشرة." />
        ) : (
          mine.map((t, i) => {
            const s = sessions.find((x) => x.task_id === t.id);
            return <Row key={t.id} icon={t.status === 'done' ? 'checkmark.circle.fill' : 'sparkles'} iconColor={t.status === 'done' ? c.success : c.primary} title={t.title} subtitle={`${names.get(t.assignee_ai_employee_id!) ?? ''} · ${s?.current_step ?? TASK_STATUS[t.status]}`} onPress={() => router.push(`/tasks/${t.id}`)} last={i === mine.length - 1} />;
          })
        )}
      </Section>
    </>
  );
}

/* ------------------------------ shared rows ------------------------------ */

function ApprovalRow({ a, name, last }: { a: Approval; name?: string | undefined; last: boolean }) {
  const c = useColors();
  const color = a.risk === 'high' ? c.destructive : isSensitive(a) ? c.warning : c.info;
  return <Row icon={isSensitive(a) ? 'lock.shield' : 'checkmark.seal'} iconColor={color} title={a.title} subtitle={`${name ?? 'NEXUS'} · ${APPROVAL_TYPE[a.approval_type] ?? a.approval_type} · منذ ${waitingFor(a.created_at)}`} onPress={() => router.push(`/approvals/${a.id}`)} last={last} />;
}

function TaskRow({ t, name, last }: { t: Task; name?: string | undefined; last: boolean }) {
  const c = useColors();
  const due = dueLabel(t.due_date);
  return <Row icon={t.status === 'blocked' ? 'pause.circle' : 'clock.badge.exclamationmark'} iconColor={c.destructive} title={t.title} subtitle={[name, t.status === 'blocked' ? 'متعثرة' : due].filter(Boolean).join(' · ')} onPress={() => router.push(`/tasks/${t.id}`)} last={last} />;
}

function Timeline({ events, names }: { events: Array<{ id: number; ai_employee_id: string; message: string; created_at: string }>; names: Map<string, string> }) {
  const c = useColors();
  return (
    <Section title="آخر الأحداث">
      {events.length === 0 ? (
        <Empty icon="clock" title="لا أحداث بعد" />
      ) : (
        events.map((e, i) => <Row key={e.id} icon="circle.fill" iconColor={c.primary} title={e.message} subtitle={`${names.get(e.ai_employee_id) ?? ''} · ${ago(e.created_at)}`} last={i === events.length - 1} />)
      )}
    </Section>
  );
}
