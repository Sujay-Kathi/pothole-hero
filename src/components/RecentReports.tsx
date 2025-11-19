import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: string;
  image_url: string;
  area_name: string;
  address: string;
  duration: string;
  created_at: string;
}

export interface RecentReportsHandles {
  refresh: () => void;
}

const RecentReports = forwardRef<RecentReportsHandles>((props, ref) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('pothole_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchReports
  }));

  const formatDuration = (duration: string) => {
    return duration.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Recent Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card rounded-3xl overflow-hidden animate-pulse">
                <div className="h-56 bg-secondary/50" />
                <div className="p-6">
                  <div className="h-6 bg-secondary/50 rounded-lg mb-3" />
                  <div className="h-4 bg-secondary/50 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Recent Reports
          </h2>
          <div className="glass-card rounded-3xl p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No reports yet. Be the first to report a pothole!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          Recent Reports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-card rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={report.image_url}
                  alt={`Pothole in ${report.area_name}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-bold text-xl">{report.area_name}</h3>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="line-clamp-2">{report.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Existed: {formatDuration(report.duration)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-white/10">
                  Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

RecentReports.displayName = "RecentReports";

export default RecentReports;