import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';

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

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white p-4 mb-4 rounded-xl shadow-sm mx-4">
            <Image source={{ uri: item.image_url }} className="w-full h-48 rounded-lg mb-3" resizeMode="cover" />
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                    <Text className="font-bold text-lg text-gray-900">{item.area_name}</Text>
                    <Text className="text-gray-500 text-sm">{item.address}</Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${item.status === 'resolved' ? 'bg-green-100' :
                        item.status === 'in-progress' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                    <Text className={`text-xs font-medium ${item.status === 'resolved' ? 'text-green-800' :
                            item.status === 'in-progress' ? 'text-blue-800' : 'text-yellow-800'
                        }`}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <Text className="text-gray-400 text-xs">Reported {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 pt-4">
            <Text className="text-2xl font-bold mb-4 px-4 text-gray-900">Recent Reports</Text>
            <FlatList
                data={reports}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}
