import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Glass, Pill } from '@/components/glass';
import { Button, Text } from '@/components/ui';
import { confirmDecision } from '@/lib/decide';
import { APPROVAL_TYPE, isSensitive, useAiEmployees, useApproval, useDecide } from '@/lib/data';
import { waitingFor } from '@/lib/format';
import { useColors } from '@/theme';

export default function ApprovalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { data: a } = useApproval(id);
  const ai = useAiEmployees().data ?? [];
  const decide = useDecide();
  const [busy, setBusy] = useState<'approved' | 'rejected' | null>(null);
  if (!a) return <Stack.Screen options={{ title: '' }} />;
  const sensitive = isSensitive(a);
  const name = ai.find((x) => x.id === a.requested_by_ai_employee_id)?.name ?? 'NEXUS';
  const run = async (decision: 'approved' | 'rejected', comment?: string) => {
    setBusy(decision);
    const ok = await confirmDecision(a, decision, decide.mutateAsync, comment);
    setBusy(null);
    if (ok) router.back();
  };
  const reject = () => Alert.prompt('رفض الطلب', 'سبب الرفض (اختياري)', [{ text: 'إلغاء', style: 'cancel' }, { text: 'رفض', style: 'destructive', onPress: (t?: string) => void run('rejected', t) }], 'plain-text');
  const color = a.risk === 'high' ? c.destructive : sensitive ? c.warning : c.info;
  return (
    <>
      <Stack.Screen options={{ title: APPROVAL_TYPE[a.approval_type] ?? 'طلب', headerLargeTitleEnabled: false }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={{ backgroundColor: c.elevated, borderRadius: 24, padding: 18, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={a.risk === 'high' ? 'خطورة عالية' : a.risk === 'medium' ? 'خطورة متوسطة' : 'بسيطة'} color={color} />
            {sensitive ? <Pill label="تتطلب Face ID" color={c.warning} /> : null}
            {a.status !== 'pending' ? <Pill label={a.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'} color={a.status === 'approved' ? c.success : c.destructive} /> : null}
          </View>
          <Text weight="bold" size={22}>{a.title}</Text>
          {a.description ? <Text size={16} style={{ lineHeight: 26 }}>{a.description}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SymbolView name="sparkles" size={14} tintColor={c.mutedForeground} />
            <Text muted size={14}>طلب من {name} · منذ {waitingFor(a.created_at)}</Text>
          </View>
          {a.task_id ? <Button title="عرض المهمة المرتبطة" variant="ghost" onPress={() => router.push(`/tasks/${a.task_id}`)} /> : null}
        </View>
        {a.status === 'pending' ? (
          <Glass style={{ gap: 10 }}>
            <Button title={sensitive ? 'موافقة بـ Face ID' : 'موافقة'} icon={<SymbolView name={sensitive ? 'faceid' : 'checkmark'} size={18} tintColor="#fff" />} loading={busy === 'approved'} disabled={busy !== null} onPress={() => void run('approved')} style={{ backgroundColor: c.success }} />
            <Button title="رفض" variant="destructive" loading={busy === 'rejected'} disabled={busy !== null} onPress={reject} />
          </Glass>
        ) : null}
      </ScrollView>
    </>
  );
}
