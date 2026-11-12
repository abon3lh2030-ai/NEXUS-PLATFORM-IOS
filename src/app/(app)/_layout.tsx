import { NativeTabs } from 'expo-router/native-tabs';
import { useSession } from '@/auth/session';
import { usePendingApprovals } from '@/lib/data';
import { useColors } from '@/theme';

/** Native iOS tab bar — Liquid Glass on iOS 26. */
export default function AppTabs() {
  const c = useColors();
  const { can } = useSession();
  const canDecide = can('approvals.decide');
  const pending = usePendingApprovals().data?.length ?? 0;
  return (
    <NativeTabs tintColor={c.primary} minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>الرئيسية</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="approvals" hidden={!canDecide}>
        <NativeTabs.Trigger.Label>الموافقات</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.seal', selected: 'checkmark.seal.fill' }} />
        {canDecide && pending > 0 ? <NativeTabs.Trigger.Badge>{pending > 9 ? '9+' : String(pending)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Label>المهام</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'checklist', selected: 'checklist' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>الإعدادات</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
