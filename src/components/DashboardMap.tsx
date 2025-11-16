import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Report } from "@/types/report";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";
import { NominatimResult } from "./LocationSearch";

// Fix for default marker icons in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DashboardMapProps {
  reports: Report[];
  onReportClick?: (reportId: string) => void;
  selectedLocation?: NominatimResult | null;
}

// Component to fit map bounds to markers
const FitBounds = ({ reports }: { reports: Report[] }) => {
  const map = useMap();

  useEffect(() => {
    const validReports = reports.filter(
      (r) => r.latitude != null && r.longitude != null
    );

    if (validReports.length > 0) {
      const bounds = L.latLngBounds(
        validReports.map((r) => [r.latitude, r.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, map]);

  return null;
};

const FlyToSelectedLocation = ({ location }: { location: NominatimResult }) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);
      map.flyTo([lat, lon], 15);
    }
  }, [location, map]);

  if (!location) return null;

  const position: [number, number] = [parseFloat(location.lat), parseFloat(location.lon)];

  return <Marker position={position} />;
};


// Create custom marker icons based on status
const createMarkerIcon = (status: string) => {
  let color = "#FCD34D"; // Yellow for pending
  
  if (status === "in-progress") {
    color = "#3B82F6"; // Blue
  } else if (status === "resolved") {
    color = "#10B981"; // Green
  }

  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z" 
            fill="${color}" stroke="#000" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const DashboardMap = ({ reports, onReportClick, selectedLocation }: DashboardMapProps) => {
  // Filter reports with valid coordinates
  const validReports = useMemo(() => {
    return reports.filter(
      (report) =>
        report.latitude != null &&
        report.longitude != null &&
        !isNaN(report.latitude) &&
        !isNaN(report.longitude)
    );
  }, [reports]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  if (validReports.length === 0 && !selectedLocation) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">No location data available</p>
      </div>
    );
  }

  // Default center (Bangalore)
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {!selectedLocation && <FitBounds reports={validReports} />}
        {selectedLocation && <FlyToSelectedLocation location={selectedLocation} />}


        {validReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createMarkerIcon(report.status)}
            eventHandlers={{
              click: () => {
                if (onReportClick) {
                  onReportClick(report.id);
                }
              },
            }}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <h3 className="font-semibold">{report.area_name}</h3>
                <p className="text-sm text-gray-600">{report.address}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <div>ID: {report.id.slice(0, 8)}...</div>
                  <div>Created: {format(new Date(report.created_at), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DashboardMap;
