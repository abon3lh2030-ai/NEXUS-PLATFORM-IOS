import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/auth/session';
import { api } from './api';
import { supabase } from './supabase';

/**
 * Reads go straight to Supabase (protected by the existing RLS: members see only their organization).
 * Writes go through the existing NEXUS API, which runs the business logic (RLS blocks client writes).
 */

export interface AiEmployee { id: string; name: string; job_title: string; status: string }
export interface Approval { id: string; title: string; description: string; approval_type: string; risk: 'low' | 'medium' | 'high'; status: string; created_at: string; requested_by_ai_employee_id: string | null; task_id: string | null; payload: Record<string, unknown> }
export interface Task { id: string; title: string; description: string; status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'blocked' | 'done'; priority: 'low' | 'medium' | 'high' | 'urgent'; due_date: string | null; completed_at: string | null; updated_at: string; created_at: string; assignee_ai_employee_id: string | null; assignee_member_id: string | null; creator_user_id: string | null }
export interface Session { id: string; ai_employee_id: string; task_id: string | null; status: string; current_step: string | null; started_at: string | null; completed_at: string | null; step_count: number }
export interface SessionEvent { id: number; session_id: string; ai_employee_id: string; event_type: string; message: string; created_at: string }

const OPEN_TASK = ['backlog', 'todo', 'in_progress', 'review', 'blocked'];

/** Needs Face ID before approving: high risk, or anything that reaches people outside the company. */
export function isSensitive(a: Pick<Approval, 'risk' | 'approval_type'>): boolean {
  return a.risk === 'high' || a.approval_type === 'email_send' || a.approval_type === 'meeting_action';
}

/** Escalated to the CEO: high risk, or waiting more than 24 hours. */
export function isEscalated(a: Pick<Approval, 'risk' | 'created_at'>): boolean {
  return a.risk === 'high' || Date.now() - Date.parse(a.created_at) > 24 * 3_600_000;
}

/** Stuck: blocked, or past its due date and not done. */
export function isStuck(t: Pick<Task, 'status' | 'due_date'>): boolean {
  return t.status === 'blocked' || (t.status !== 'done' && Boolean(t.due_date) && Date.parse(t.due_date!) < Date.now());
}

export const APPROVAL_TYPE: Record<string, string> = {
  ai_tool_action: 'إجراء موظف ذكاء اصطناعي', ai_output: 'اعتماد مخرجات', task_review: 'مراجعة مهمة', file_publish: 'نشر ملف',
  document: 'مستند', custom: 'طلب', presentation: 'عرض تقديمي', email_send: 'إرسال بريد', meeting_action: 'دعوة اجتماع',
};
export const TASK_STATUS: Record<Task['status'], string> = { backlog: 'قائمة الانتظار', todo: 'للتنفيذ', in_progress: 'قيد التنفيذ', review: 'للمراجعة', blocked: 'متعثرة', done: 'منجزة' };
export const PRIORITY: Record<Task['priority'], string> = { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' };
export const AI_STATUS: Record<string, string> = {
  offline: 'غير متصل', idle: 'متاح', queued: 'في الانتظار', preparing: 'يستعد', thinking: 'يفكر', researching: 'يبحث', reading: 'يقرأ',
  writing: 'يكتب', executing: 'ينفّذ', waiting: 'ينتظر', waiting_approval: 'بانتظار موافقة', blocked: 'متعثر', completed: 'أنهى', failed: 'فشل',
};
export const isAiWorking = (status: string) => !['offline', 'idle', 'completed', 'failed'].includes(status);

function useOrgId() {
  return useSession().org?.id ?? '';
}

export function useAiEmployees() {
  const org = useOrgId();
  return useQuery({
    queryKey: ['ai', org],
    enabled: Boolean(org),
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_employees').select('id, name, job_title, status').eq('organization_id', org).is('deleted_at', null).order('name');
      if (error) throw error;
      return (data ?? []) as AiEmployee[];
    },
  });
}

export function usePendingApprovals() {
  const org = useOrgId();
  return useQuery({
    queryKey: ['approvals', org],
    enabled: Boolean(org),
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('approvals').select('id, title, description, approval_type, risk, status, created_at, requested_by_ai_employee_id, task_id, payload').eq('organization_id', org).eq('status', 'pending').order('created_at');
      if (error) throw error;
      return (data ?? []) as Approval[];
    },
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: ['approval', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('approvals').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as (Approval & { decided_at: string | null; decision_comment: string | null }) | null;
    },
  });
}

export function useTasks() {
  const org = useOrgId();
  return useQuery({
    queryKey: ['tasks', org],
    enabled: Boolean(org),
    refetchInterval: 30_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, priority, due_date, completed_at, updated_at, created_at, assignee_ai_employee_id, assignee_member_id, creator_user_id')
        .eq('organization_id', org)
        .is('deleted_at', null)
        .or(`status.in.(${OPEN_TASK.join(',')}),completed_at.gte.${since}`)
        .order('updated_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    refetchInterval: 10_000,
    queryFn: async () => {
      const [{ data: task }, { data: sessions }] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', id).maybeSingle(),
        supabase.from('ai_work_sessions').select('id, ai_employee_id, task_id, status, current_step, started_at, completed_at, step_count').eq('task_id', id).order('created_at', { ascending: false }).limit(1),
      ]);
      const session = ((sessions ?? []) as Session[])[0] ?? null;
      const { data: events } = session
        ? await supabase.from('ai_session_events').select('id, session_id, ai_employee_id, event_type, message, created_at').eq('session_id', session.id).order('id', { ascending: false }).limit(30)
        : { data: [] };
      return { task: task as Task | null, session, events: (events ?? []) as SessionEvent[] };
    },
  });
}

export function useActiveSessions() {
  const org = useOrgId();
  return useQuery({
    queryKey: ['sessions', org],
    enabled: Boolean(org),
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_work_sessions').select('id, ai_employee_id, task_id, status, current_step, started_at, completed_at, step_count').eq('organization_id', org).in('status', ['queued', 'preparing', 'running', 'paused', 'waiting_approval']);
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });
}

export function useRecentEvents(limit = 8) {
  const org = useOrgId();
  return useQuery({
    queryKey: ['events', org, limit],
    enabled: Boolean(org),
    refetchInterval: 20_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_session_events').select('id, session_id, ai_employee_id, event_type, message, created_at').eq('organization_id', org).order('id', { ascending: false }).limit(limit);
      if (error) throw error;
      return (data ?? []) as SessionEvent[];
    },
  });
}

export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, comment }: { id: string; decision: 'approved' | 'rejected'; comment?: string }) => api(`/approvals/${id}/decide`, { method: 'POST', body: { decision, comment: comment ?? '' } }),
    onSettled: () => void qc.invalidateQueries(),
  });
}

/** Creates a task and hands it to an AI employee, which starts working on it. */
export function useCreateAiTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description: string; priority: Task['priority']; ai_employee_id: string; due_date: string | null }) => {
      const task = await api<{ id: string }>('/work/tasks', { method: 'POST', body: { title: input.title, description: input.description, priority: input.priority, status: 'todo', due_date: input.due_date, assignee_ai_employee_id: input.ai_employee_id } });
      await api(`/ai/employees/${input.ai_employee_id}/assign`, { method: 'POST', body: { task_id: task.id } });
      return task;
    },
    onSettled: () => void qc.invalidateQueries(),
  });
}
