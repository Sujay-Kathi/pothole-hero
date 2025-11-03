import { useState, useCallback, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, area: string) => void;
  latitude: number | null;
  longitude: number | null;
}

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 12.9716, // Bangalore coordinates
  lng: 77.5946
};

const LocationPicker = ({ onLocationSelect, latitude, longitude }: LocationPickerProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  useEffect(() => {
    const savedKey = localStorage.getItem("google_maps_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setShowKeyInput(false);
    }
  }, []);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem("google_maps_api_key", apiKey);
      setShowKeyInput(false);
    }
  };

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Extract area name (locality or sublocality)
        const areaComponent = addressComponents.find(
          (component: any) => 
            component.types.includes("sublocality") || 
            component.types.includes("locality")
        );
        
        return {
          address: result.formatted_address,
          area: areaComponent?.long_name || "Unknown Area"
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    
    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      area: "Unknown Area"
    };
  }, [apiKey]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      setMarkerPosition({ lat, lng });
      
      const { address, area } = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address, area);
    }
  }, [onLocationSelect, reverseGeocode]);

  if (showKeyInput) {
    return (
      <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Google Maps API Key Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To use the location picker, please enter your Google Maps API key. 
              Get one at <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>
            </p>
            <form onSubmit={handleApiKeySubmit} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter your Google Maps API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          Location <span className="text-destructive">*</span>
        </label>
        <button
          onClick={() => setShowKeyInput(true)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Change API Key
        </button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Click on the map to mark the pothole location
      </p>
      
      <div className="rounded-lg overflow-hidden border shadow-[var(--shadow-card)]">
        <LoadScript googleMapsApiKey={apiKey}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={markerPosition || mapCenter}
            zoom={13}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {markerPosition && <Marker position={markerPosition} />}
          </GoogleMap>
        </LoadScript>
      </div>
      
      {markerPosition && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
          <strong>Selected:</strong> {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;