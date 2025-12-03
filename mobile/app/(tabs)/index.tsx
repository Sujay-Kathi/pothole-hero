import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import LeafletMap from '../../components/LeafletMap';
import { ScreenWrapper } from '../../components/ScreenWrapper';

export default function HomeScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();

        fetchReports();
    }, []);

    const fetchReports = async () => {
        const { data, error } = await supabase
            .from('pothole_reports')
            .select('*');
        if (error) console.error(error);
        else setReports(data || []);
    };

    const markers = reports.map(r => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        title: r.area_name,
        color: r.status === 'resolved' ? 'green' : 'red'
    }));

    return (
        <ScreenWrapper scrollable={false}>
            {location ? (
                <LeafletMap
                    latitude={location.coords.latitude}
                    longitude={location.coords.longitude}
                    markers={markers}
                />
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 dark:text-gray-400">{errorMsg || 'Loading map...'}</Text>
                </View>
            )}
        </ScreenWrapper>
    );
}
