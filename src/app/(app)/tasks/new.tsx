import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { PRIORITY, useAiEmployees, useCreateAiTask, type Task } from '@/lib/data';
import { useColors } from '@/theme';

/** New task handed to an AI employee, who starts working on it right away. */
export default function NewTask() {
  const c = useColors();
  const ai = useAiEmployees().data ?? [];
  const create = useCreateAiTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiId, setAiId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');

  const submit = async () => {
    if (!title.trim() || !aiId) return Alert.alert('مهمة جديدة', 'اكتب عنوان المهمة واختر موظف الذكاء الاصطناعي.');
    try {
      const task = await create.mutateAsync({ title: title.trim(), description: description.trim(), priority, ai_employee_id: aiId, due_date: null });
      router.replace(`/tasks/${task.id}`);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      Alert.alert('لم تُنشأ المهمة', code === 'ai_weekly_limit_reached' ? 'وصلت شركتك لحد استخدام الذكاء الاصطناعي هذا الأسبوع.' : code === 'plan_limit_reached' ? 'وصلت شركتك للحد المسموح في الباقة.' : 'حدث خطأ. حاول مرة أخرى.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'مهمة جديدة', presentation: 'formSheet', headerLargeTitleEnabled: false, sheetAllowedDetents: [0.9], headerLeft: () => <Pressable onPress={() => router.back()} hitSlop={10}><Text style={{ color: c.primary }}>إلغاء</Text></Pressable> }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
        <Input label="العنوان" value={title} onChangeText={setTitle} placeholder="مثال: لخّص تقارير المبيعات لهذا الشهر" maxLength={300} />
        <Input label="التفاصيل" value={description} onChangeText={setDescription} placeholder="وش المطلوب بالضبط؟" multiline style={{ height: 110, paddingTop: 12, textAlignVertical: 'top' }} maxLength={4000} />
        <View style={{ gap: 8 }}>
          <Text weight="medium" size={14}>موظف الذكاء الاصطناعي</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ai.map((a) => (
              <Pressable key={a.id} onPress={() => setAiId(a.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: aiId === a.id ? c.primary : c.border, backgroundColor: aiId === a.id ? c.accent : c.elevated }}>
                <Text weight="semibold" size={15}>{a.name}</Text>
                <Text muted size={12}>{a.job_title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text weight="medium" size={14}>الأولوية</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(Object.keys(PRIORITY) as Task['priority'][]).map((p) => (
              <Pressable key={p} onPress={() => setPriority(p)} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: priority === p ? c.primary : c.elevated }}>
                <Text weight="semibold" size={14} style={{ color: priority === p ? c.primaryForeground : c.foreground }}>{PRIORITY[p]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Button title="أرسل للموظف" loading={create.isPending} onPress={() => void submit()} />
      </ScrollView>
    </>
  );
}
