// Report type definition for pothole reports
export interface Report {
  id: string;
  image_url: string;
  area_name: string;
  address: string;
  duration: string;
  status: 'pending' | 'in-progress' | 'resolved';
  created_at: string;
  latitude: number;
  longitude: number;
  resolved_at: string | null;
  description: string | null;
  updated_at: string;
}

// Statistics for dashboard overview
export interface ReportStatistics {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
}

// Filter options for dashboard
export interface ReportFilters {
  area: string | null;
  status: string | null;
  dateRange: {
    start: Date;
    end: Date;
  } | null;
}

