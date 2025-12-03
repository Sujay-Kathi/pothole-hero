import { LinearGradient } from 'expo-linear-gradient';
import { ViewProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface GradientBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export function GradientBackground({ children, style, ...props }: GradientBackgroundProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <LinearGradient
            colors={isDark
                ? ['#111827', '#1f2937', '#374151'] // gray-900 to gray-700
                : ['#f3f4f6', '#e5e7eb', '#d1d5db'] // gray-100 to gray-300
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ flex: 1 }, style]}
            {...props}
        >
            {children}
        </LinearGradient>
    );
}
