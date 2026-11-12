import { ScrollView } from 'react-native';
import { useSession } from '@/auth/session';
import { Card, Screen, Text } from '@/components/ui';
import { APP_ROLE_LABEL } from '@/lib/roles';

/** Role-based home. Stage 1 shows who you are; stage 2 adds approvals, tasks and team activity. */
export default function Home() {
  const { userName, org } = useSession();
  if (!org) return null;
  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text muted size={14}>{org.name}</Text>
        <Text weight="bold" size={26}>أهلًا {userName}</Text>
        <Card>
          <Text muted size={13}>دورك في التطبيق</Text>
          <Text weight="semibold" size={18}>{APP_ROLE_LABEL[org.appRole]}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
