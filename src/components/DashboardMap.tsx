import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Report {
  id: string;
  image_url: string;
  area_name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

interface DashboardMapProps {
  reports: Report[];
}

// Component to fit map bounds to all markers
const FitBounds = ({ reports }: { reports: Report[] }) => {
  const map = useMap();

  useEffect(() => {
    if (reports.length > 0) {
      const bounds = L.latLngBounds(
        reports.map(r => [r.latitude, r.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, map]);

  return null;
};

const getMarkerIcon = (status: string) => {
  const getColor = () => {
    switch(status) {
      case "pending": return "#eab308"; // yellow
      case "under_review": return "#3b82f6"; // blue
      case "in_progress": return "#a855f7"; // purple
      case "resolved": return "#22c55e"; // green
      case "rejected": return "#ef4444"; // red
      default: return "#6b7280"; // gray
    }
  };

  const color = getColor();
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 12px;
          height: 12px;
          background-color: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const getStatusBadgeStyle = (status: string) => {
  switch(status) {
    case "pending":
      return { backgroundColor: '#fef9c3', color: '#854d0e' };
    case "under_review":
      return { backgroundColor: '#dbeafe', color: '#1e40af' };
    case "in_progress":
      return { backgroundColor: '#f3e8ff', color: '#6b21a8' };
    case "resolved":
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case "rejected":
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#4b5563' };
  }
};

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const DashboardMap = ({ reports }: DashboardMapProps) => {
  // Default center (Bangalore)
  const defaultCenter: [number, number] = [12.9716, 77.5946];

  if (reports.length === 0) {
    return (
      <div className="h-[500px] w-full bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No reports to display on map</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds reports={reports} />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getMarkerIcon(report.status)}
          >
            <Popup>
              <div className="min-w-[200px]">
                <img 
                  src={report.image_url} 
                  alt={report.area_name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h3 className="font-semibold text-sm mb-1">{report.area_name}</h3>
                <p className="text-xs text-gray-600 mb-2">{report.address}</p>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={getStatusBadgeStyle(report.status)}
                  >
                    {formatStatus(report.status)}
                  </span>
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
