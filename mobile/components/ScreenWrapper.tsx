import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { GradientBackground } from './GradientBackground';
import { FloatingHeader } from './FloatingHeader';

interface ScreenWrapperProps {
    children: React.ReactNode;
    scrollable?: boolean;
    contentContainerStyle?: ViewStyle;
    style?: ViewStyle;
}

export function ScreenWrapper({
    children,
    scrollable = true,
    contentContainerStyle,
    style
}: ScreenWrapperProps) {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    return (
        <GradientBackground style={style}>
            <FloatingHeader scrollY={scrollable ? scrollY : undefined} />

            {scrollable ? (
                <Animated.ScrollView
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    contentContainerStyle={[
                        { paddingTop: 120, paddingBottom: 40, paddingHorizontal: 20 },
                        contentContainerStyle
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </Animated.ScrollView>
            ) : (
                <View style={[{ flex: 1, paddingTop: 0 }, contentContainerStyle]}>
                    {children}
                </View>
            )}
        </GradientBackground>
    );
}
