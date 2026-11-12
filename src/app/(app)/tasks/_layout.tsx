import { Stack } from 'expo-router';
import { useStackOptions } from '@/components/stack';

export default function Layout() {
  return <Stack screenOptions={useStackOptions()} />;
}
