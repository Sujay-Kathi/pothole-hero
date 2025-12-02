import { Tabs } from 'expo-router';
import { Home, PlusCircle, List } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#60a5fa', // blue-400
      tabBarInactiveTintColor: '#9ca3af', // gray-400
      tabBarStyle: {
        backgroundColor: '#111827', // gray-900
        borderTopColor: '#1f2937', // gray-800
      },
      headerStyle: {
        backgroundColor: '#111827', // gray-900
      },
      headerTintColor: '#f3f4f6', // gray-100
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
