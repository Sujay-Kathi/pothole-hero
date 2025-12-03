import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Search, X, MapPin } from 'lucide-react-native';
import { useDebounce } from '../hooks/useDebounce';
import { useColorScheme } from 'nativewind';

export interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

interface LocationSearchProps {
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    currentLocation?: { latitude: number; longitude: number } | null;
}

export function LocationSearch({ onLocationSelect, currentLocation }: LocationSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const lat = currentLocation ? currentLocation.latitude : 12.9716;
            const lon = currentLocation ? currentLocation.longitude : 77.5946;

            const tags = [
                "place", "amenity", "building", "shop", "office", "tourism", "leisure"
            ].map(t => `&osm_tag=${t}`).join("");

            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=${lat}&lon=${lon}&limit=15&bbox=77.379,12.834,77.786,13.143${tags}`
            );
            const data = await response.json();

            const mappedResults: NominatimResult[] = data.features
                .filter((feature: any) => {
                    const p = feature.properties;
                    const context = [p.city, p.state, p.district].join(" ").toLowerCase();
                    return context.includes("bangalore") || context.includes("bengaluru") || context.includes("karnataka");
                })
                .map((feature: any, index: number) => {
                    const p = feature.properties;
                    const parts = [
                        p.name, p.housenumber, p.street, p.district, p.city, p.state, p.postcode
                    ].filter(Boolean);

                    return {
                        place_id: p.osm_id || index,
                        lat: feature.geometry.coordinates[1].toString(),
                        lon: feature.geometry.coordinates[0].toString(),
                        display_name: parts.join(", ")
                    };
                });

            setResults(mappedResults);
        } catch (error) {
            console.error("Error fetching from Photon:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentLocation]);

    useEffect(() => {
        handleSearch(debouncedQuery);
    }, [debouncedQuery, handleSearch]);

    const handleSelect = (result: NominatimResult) => {
        onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        setQuery('');
        setResults([]);
    };

    return (
        <View className="absolute top-4 left-4 right-4 z-50">
            <View className={`flex-row items-center rounded-xl border shadow-sm px-3 py-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                <TextInput
                    className={`flex-1 ml-2 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
                    placeholder="Search for places..."
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        setQuery('');
                        setResults([]);
                    }}>
                        <X size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                    </TouchableOpacity>
                )}
            </View>

            {(results.length > 0 || isLoading) && (
                <View className={`mt-2 rounded-xl border shadow-lg overflow-hidden max-h-64 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                    {isLoading ? (
                        <View className="p-4 items-center">
                            <ActivityIndicator color={isDark ? '#60a5fa' : '#2563eb'} />
                        </View>
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.place_id.toString()}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`flex-row items-center p-3 border-b ${isDark ? 'border-gray-700 active:bg-gray-700' : 'border-gray-100 active:bg-gray-50'
                                        }`}
                                    onPress={() => handleSelect(item)}
                                >
                                    <MapPin size={16} color={isDark ? '#9ca3af' : '#6b7280'} className="mt-0.5" />
                                    <View className="ml-3 flex-1">
                                        <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.display_name.split(',')[0]}
                                        </Text>
                                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`} numberOfLines={1}>
                                            {item.display_name.split(',').slice(1).join(', ')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            )}
        </View>
    );
}
