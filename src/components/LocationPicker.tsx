import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet
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

const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bangalore

const LocationPicker = ({ onLocationSelect, latitude, longitude }: LocationPickerProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] as [number, number] : null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'PotholeHeroApp/1.0' } }
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.display_name as string;
        const areaName =
          data.address.suburb ||
          data.address.neighbourhood ||
          data.address.locality ||
          data.address.city_district ||
          data.address.city ||
          "Unknown Area";
        return { address, area: areaName as string };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocoding(false);
    }
    return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, area: "Unknown Area" };
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);

    // Create or move marker
    if (mapRef.current) {
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    const { address, area } = await reverseGeocode(lat, lng);
    onLocationSelect(lat, lng, address, area);
  }, [onLocationSelect, reverseGeocode]);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const startCenter = (latitude && longitude) ? [latitude, longitude] as [number, number] : defaultCenter;
    const map = L.map(mapContainerRef.current).setView(startCenter, 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize marker if position provided
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [latitude, longitude, handleMapClick]);

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

      <div
        ref={mapContainerRef}
        className="rounded-lg overflow-hidden border shadow-[var(--shadow-card)]"
        style={{ height: '400px', width: '100%' }}
      />

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
