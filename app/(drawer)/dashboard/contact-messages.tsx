import React from 'react';
import { View, Text } from 'react-native';
import { MessageSquare } from 'lucide-react-native';

export default function ContactMessagesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950 p-6">
      <MessageSquare color="#10b981" size={48} />
      <Text className="text-xl font-bold text-slate-900 dark:text-white mt-4">Contact Messages</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
        Messages submitted through the contact form will appear here.
      </Text>
    </View>
  );
}
