import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { Sun, Moon, MapPin } from 'lucide-react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    SharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingHeaderProps {
    scrollY?: SharedValue<number>;
    reportCount?: number;
}

export function FloatingHeader({ scrollY, reportCount = 1240 }: FloatingHeaderProps) {
    const { colorScheme, toggleColorScheme } = useColorScheme();
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';

    // Animation logic
    const headerStyle = useAnimatedStyle(() => {
        if (!scrollY) return { transform: [{ translateY: 0 }], opacity: 1 };

        const translate = interpolate(
            scrollY.value,
            [0, 100],
            [0, -100],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollY.value,
            [0, 50],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY: translate }],
            opacity: opacity,
        };
    });

    const Container = Platform.OS === 'ios' ? BlurView : View;
    const containerProps = Platform.OS === 'ios'
        ? { intensity: 80, tint: (isDark ? 'dark' : 'light') as BlurTint }
        : {};

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    top: insets.top + 10,
                    left: 20,
                    right: 20,
                    zIndex: 50
                },
                headerStyle
            ]}
        >
            <Container
                {...containerProps}
                className={`flex-row items-center justify-between px-4 py-3 rounded-full border ${isDark
                        ? 'bg-gray-900/80 border-gray-700'
                        : 'bg-white/80 border-gray-200'
                    } ${Platform.OS === 'android' ? 'shadow-sm' : ''}`}
                style={Platform.OS === 'android' ? { backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)' } : {}}
            >
                {/* Logo Section */}
                <View className="flex-row items-center gap-2">
                    <View className="bg-blue-500 p-1.5 rounded-full">
                        <MapPin size={16} color="white" />
                    </View>
                    <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Pothole Hero
                    </Text>
                </View>

                {/* Right Section: Count & Theme Toggle */}
                <View className="flex-row items-center gap-3">
                    <View className="flex-col items-end">
                        <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Reports
                        </Text>
                        <Text className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {reportCount.toLocaleString()}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={toggleColorScheme}
                        className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                        {isDark ? (
                            <Sun size={18} color="#fbbf24" />
                        ) : (
                            <Moon size={18} color="#4b5563" />
                        )}
                    </TouchableOpacity>
                </View>
            </Container>
        </Animated.View>
    );
}
