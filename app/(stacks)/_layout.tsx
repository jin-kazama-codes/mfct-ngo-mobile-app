import { Stack } from 'expo-router';

export default function StacksLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="campaign-details" options={{ headerShown: false }} />
            <Stack.Screen name="donation" options={{ headerShown: false }} />
        </Stack>
    );
}
