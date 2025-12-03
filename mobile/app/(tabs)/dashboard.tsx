import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { GradientBackground } from '../../components/GradientBackground';
import { FloatingHeader } from '../../components/FloatingHeader';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

export default function DashboardScreen() {
    const [reports, setReports] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('pothole_reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error(error);
        else setReports(data || []);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchReports();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white/50 dark:bg-gray-800/50 p-4 mb-4 rounded-xl shadow-sm mx-4 border border-gray-200 dark:border-gray-700">
            <Image source={{ uri: item.image_url }} className="w-full h-48 rounded-lg mb-3" resizeMode="cover" />
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-900 dark:text-white">{item.area_name}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.address}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === 'resolved' ? 'bg-green-100 dark:bg-green-900' :
                    item.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'
                    }`}>
                    <Text className={`text-xs font-medium ${item.status === 'resolved' ? 'text-green-800 dark:text-green-100' :
                        item.status === 'in-progress' ? 'text-blue-800 dark:text-blue-100' : 'text-yellow-800 dark:text-yellow-100'
                        }`}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Reported {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
        </View>
    );

    return (
        <GradientBackground>
            <FloatingHeader scrollY={scrollY} />
            <Animated.FlatList
                data={reports}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 120, paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9ca3af" />
                }
            />
        </GradientBackground>
    );
}
