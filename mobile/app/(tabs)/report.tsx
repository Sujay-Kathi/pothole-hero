import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { Camera, MapPin } from 'lucide-react-native';
import LeafletMap from '../../components/LeafletMap';

export default function ReportScreen() {
    const [image, setImage] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
            updateAddress(location.coords.latitude, location.coords.longitude);
        })();
    }, []);

    const updateAddress = async (lat: number, lng: number) => {
        try {
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lng
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                setAddress(`${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const submitReport = async () => {
        if (!image || !location) {
            Alert.alert('Please take a photo and ensure location is fetched.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const fileName = `${Date.now()}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pothole-images')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('pothole-images')
                .getPublicUrl(fileName);

            const { error: insertError } = await supabase
                .from('pothole_reports')
                .insert([
                    {
                        image_url: publicUrl,
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        address: address,
                        area_name: address.split(' ')[1] || 'Unknown Area',
                        description: description,
                        duration: '1-2 weeks',
                        status: 'pending'
                    }
                ]);

            if (insertError) throw insertError;

            Alert.alert('Success', 'Report submitted successfully!');
            setImage(null);
            setDescription('');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <Text className="text-2xl font-bold mb-6 text-white">Report Pothole</Text>

            <TouchableOpacity onPress={pickImage} className="bg-gray-800 p-8 rounded-xl border-2 border-dashed border-gray-700 items-center justify-center mb-6 h-64">
                {image ? (
                    <Image source={{ uri: image }} className="w-full h-full rounded-lg" resizeMode="cover" />
                ) : (
                    <View className="items-center">
                        <Camera size={48} color="#9ca3af" />
                        <Text className="text-gray-400 mt-2">Tap to take photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View className="bg-gray-800 p-4 rounded-xl mb-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-medium text-gray-400">Location</Text>
                    <TouchableOpacity onPress={() => setShowMap(true)} className="flex-row items-center">
                        <MapPin size={16} color="#2563eb" />
                        <Text className="text-blue-600 ml-1 text-xs font-bold">Adjust on Map</Text>
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-200">{address || 'Fetching location...'}</Text>
            </View>

            <View className="bg-gray-800 p-4 rounded-xl mb-6 shadow-sm">
                <Text className="text-sm font-medium text-gray-500 mb-2">Description</Text>
                <TextInput
                    className="text-gray-200 h-24"
                    placeholderTextColor="#9ca3af"
                    multiline
                    placeholder="Describe the pothole..."
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                onPress={submitReport}
                disabled={loading}
                className={`p-4 rounded-xl items-center ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Submit Report</Text>
                )}
            </TouchableOpacity>

            <Modal visible={showMap} animationType="slide">
                <View className="flex-1 bg-gray-900">
                    <View className="p-4 bg-gray-900 pt-12 flex-row justify-between items-center border-b border-gray-800">
                        <Text className="font-bold text-lg text-white">Pick Location</Text>
                        <TouchableOpacity onPress={() => setShowMap(false)}>
                            <Text className="text-blue-600 font-bold">Done</Text>
                        </TouchableOpacity>
                    </View>
                    {location && (
                        <LeafletMap
                            latitude={location.coords.latitude}
                            longitude={location.coords.longitude}
                            onMapClick={(lat, lng) => {
                                setLocation({ ...location, coords: { ...location.coords, latitude: lat, longitude: lng } });
                                updateAddress(lat, lng);
                                // Don't close modal immediately, let user confirm
                            }}
                        />
                    )}
                    <View className="absolute bottom-10 left-4 right-4 bg-gray-800 p-4 rounded-xl shadow-lg">
                        <Text className="text-center text-gray-400 text-xs">Tap on the map to move the pin</Text>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
