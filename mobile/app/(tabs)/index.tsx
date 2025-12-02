import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import LeafletMap from '../../components/LeafletMap';

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
        <View style={styles.container}>
            {location ? (
                <LeafletMap
                    latitude={location.coords.latitude}
                    longitude={location.coords.longitude}
                    markers={markers}
                />
            ) : (
                <View style={styles.loading}>
                    <Text style={styles.text}>{errorMsg || 'Loading map...'}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // gray-900
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111827',
    },
    text: {
        color: '#9ca3af' // gray-400
    }
});
