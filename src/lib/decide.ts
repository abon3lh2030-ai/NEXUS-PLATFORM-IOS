import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { ApiError } from './api';
import { authenticate } from './biometrics';
import { isSensitive, type Approval } from './data';

const ERRORS: Record<string, string> = {
  already_decided: 'تم اتخاذ قرار في هذا الطلب مسبقًا.',
  'missing_permission:approvals.decide': 'ليست لديك صلاحية اتخاذ هذا القرار.',
  network_error: 'تعذّر الاتصال بالخادم.',
};

/**
 * Approve/reject with the safety rules: sensitive approvals (high risk or reaching people outside the
 * company) need Face ID before they are approved.
 */
export async function confirmDecision(a: Pick<Approval, 'id' | 'title' | 'risk' | 'approval_type'>, decision: 'approved' | 'rejected', run: (v: { id: string; decision: 'approved' | 'rejected'; comment?: string }) => Promise<unknown>, comment?: string): Promise<boolean> {
  if (decision === 'approved' && isSensitive(a)) {
    if (!(await authenticate('تأكيد الموافقة الحساسة'))) return false;
  }
  try {
    await run({ id: a.id, decision, ...(comment ? { comment } : {}) });
    void Haptics.notificationAsync(decision === 'approved' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    return true;
  } catch (err) {
    Alert.alert('لم يتم التنفيذ', (err instanceof ApiError && ERRORS[err.code]) || 'حدث خطأ. حاول مرة أخرى.');
    return false;
  }
}
