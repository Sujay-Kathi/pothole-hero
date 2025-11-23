import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Report } from "@/types/report";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardReportCardsProps {
  reports: Report[];
}

const DashboardReportCards = ({ reports }: DashboardReportCardsProps) => {
  const formatDuration = (duration: string) => {
    return duration.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

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

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No reports found matching the current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card 
            key={report.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow relative group"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={report.image_url}
                alt={`Pothole in ${report.area_name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge 
                className={`absolute top-3 right-3 ${getStatusColor(report.status)}`}
                variant="outline"
              >
                {getStatusLabel(report.status)}
              </Badge>
            </div>
            
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-lg">{report.area_name}</h3>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{report.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Existed: {formatDuration(report.duration)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
};

export default DashboardReportCards;
