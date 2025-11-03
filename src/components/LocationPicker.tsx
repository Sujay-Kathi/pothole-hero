import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
  latitude: number | null;
  longitude: number | null;
}

const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore coordinates

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapEvents({ onMapClick }: MapEventsProps) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPicker = ({ onLocationSelect, latitude, longitude }: LocationPickerProps) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const mapCenter = latitude && longitude ? [latitude, longitude] : defaultCenter;

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      // Using OpenStreetMap's Nominatim API (free, no API key needed)
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
        
        // Extract area name from address components
        const areaName = 
          data.address.suburb || 
          data.address.neighbourhood || 
          data.address.locality || 
          data.address.city_district ||
          data.address.city ||
          "Unknown Area";
        
        return {
          address,
          area: areaName
        };
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
        <MapContainer
          center={mapCenter as [number, number]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents onMapClick={handleMapClick} />
          {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
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