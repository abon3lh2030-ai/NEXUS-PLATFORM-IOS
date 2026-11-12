import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { RectButton } from 'react-native-gesture-handler';
import { Empty, Pill, Row, ScreenTitle } from '@/components/glass';
import { Text } from '@/components/ui';
import { confirmDecision } from '@/lib/decide';
import { APPROVAL_TYPE, isSensitive, useAiEmployees, useDecide, usePendingApprovals, type Approval } from '@/lib/data';
import { waitingFor } from '@/lib/format';
import { useColors } from '@/theme';

export default function Approvals() {
  const c = useColors();
  const qc = useQueryClient();
  const { data, isLoading } = usePendingApprovals();
  const ai = useAiEmployees().data ?? [];
  const names = useMemo(() => new Map(ai.map((a) => [a.id, a.name])), [ai]);
  const [refreshing, setRefreshing] = useState(false);
  const approvals = data ?? [];
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await qc.invalidateQueries(); setRefreshing(false); }} />}
      >
        <ScreenTitle title="الموافقات" subtitle={approvals.length ? `${approvals.length} بانتظار قرارك` : undefined} />
        {approvals.length > 0 && <Text muted size={13} style={{ paddingHorizontal: 6 }}>اسحب لليمين للموافقة ولليسار للرفض. الطلبات المميزة بالقفل تتطلب Face ID.</Text>}
        {!isLoading && approvals.length === 0 ? (
          <View style={{ backgroundColor: c.elevated, borderRadius: 22 }}><Empty icon="checkmark.seal" title="لا توجد موافقات منتظرة" subtitle="سنخبرك عندما يحتاج موظفو الذكاء الاصطناعي قرارك." /></View>
        ) : (
          approvals.map((a) => <SwipeCard key={a.id} a={a} name={names.get(a.requested_by_ai_employee_id ?? '') ?? 'NEXUS'} />)
        )}
      </ScrollView>
    </>
  );
}

function SwipeCard({ a, name }: { a: Approval; name: string }) {
  const c = useColors();
  const decide = useDecide();
  const ref = useRef<SwipeableMethods>(null);
  const sensitive = isSensitive(a);
  const act = async (decision: 'approved' | 'rejected') => {
    ref.current?.close();
    await confirmDecision(a, decision, decide.mutateAsync);
  };
  const action = (decision: 'approved' | 'rejected') => (
    <RectButton onPress={() => void act(decision)} style={[styles.action, { backgroundColor: decision === 'approved' ? c.success : c.destructive }]}>
      <SymbolView name={decision === 'approved' ? (sensitive ? 'faceid' : 'checkmark') : 'xmark'} size={22} tintColor="#fff" />
      <Text weight="semibold" size={13} style={{ color: '#fff' }}>{decision === 'approved' ? 'موافقة' : 'رفض'}</Text>
    </RectButton>
  );
  const color = a.risk === 'high' ? c.destructive : sensitive ? c.warning : c.info;
  return (
    <View style={{ borderRadius: 22, overflow: 'hidden' }}>
      {/* Physical directions: dragging right reveals the left panel (approve), dragging left the right one (reject). */}
      <ReanimatedSwipeable ref={ref} friction={1.6} overshootFriction={8} renderLeftActions={() => action('approved')} renderRightActions={() => action('rejected')} containerStyle={{ backgroundColor: c.elevated }}>
        <View style={{ backgroundColor: c.elevated }}>
          <Row
            icon={sensitive ? 'lock.shield' : 'checkmark.seal'}
            iconColor={color}
            title={a.title}
            subtitle={`${name} · ${APPROVAL_TYPE[a.approval_type] ?? a.approval_type} · منذ ${waitingFor(a.created_at)}`}
            trailing={<Pill label={a.risk === 'high' ? 'عالية' : a.risk === 'medium' ? 'متوسطة' : 'بسيطة'} color={color} />}
            onPress={() => router.push(`/approvals/${a.id}`)}
            last
          />
        </View>
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { width: 96, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
