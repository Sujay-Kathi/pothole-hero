import { useState, useCallback, useEffect } from "react";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
  latitude: number | null;
  longitude: number | null;
}

const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore coordinates

const LocationPicker = ({ onLocationSelect, latitude, longitude }: LocationPickerProps) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const mapCenter = latitude && longitude ? [latitude, longitude] : defaultCenter;

  // Ensure we only render the map on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PotholeHeroApp/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.display_name;
        
        const areaName = 
          data.address.suburb || 
          data.address.neighbourhood || 
          data.address.locality || 
          data.address.city_district ||
          data.address.city ||
          "Unknown Area";
        
        return { address, area: areaName };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
    
    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      area: "Unknown Area"
    };
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const position: [number, number] = [lat, lng];
    setMarkerPosition(position);
    
    const { address, area } = await reverseGeocode(lat, lng);
    onLocationSelect(lat, lng, address, area);
  }, [onLocationSelect, reverseGeocode]);

  // Dynamically import and render the map component
  const MapComponent = useCallback(() => {
    if (!isMounted) return null;

    // Dynamic import to avoid SSR issues
    const { MapContainer, TileLayer, Marker, useMapEvents } = require("react-leaflet");
    const L = require("leaflet");

    // Fix marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    function MapEvents() {
      useMapEvents({
        click: (e: any) => {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        },
      });
      return null;
    }

    return (
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        key="map-container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents />
        {markerPosition && <Marker position={markerPosition} />}
      </MapContainer>
    );
  }, [isMounted, mapCenter, markerPosition, handleMapClick]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="block text-sm font-medium">
          Location <span className="text-destructive">*</span>
        </label>
        {isGeocoding && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Loading address...
          </span>
        )}
      </div>
      
      <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            <strong>Click anywhere on the map</strong> to mark the exact pothole location. 
            The address will be automatically filled for you.
          </p>
        </div>
      </div>
      
      <div className="rounded-lg overflow-hidden border shadow-[var(--shadow-card)]" style={{ height: '400px', width: '100%' }}>
        {isMounted ? (
          <MapComponent />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
      </div>
      
      {markerPosition && (
        <div className="text-sm bg-muted/30 p-3 rounded-md border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <strong>Selected Coordinates:</strong> {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;