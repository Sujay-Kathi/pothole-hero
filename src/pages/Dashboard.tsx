import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Report, ReportStatistics, ReportFilters } from "@/types/report";
import { Loader2, BarChart3, Map, FileText } from "lucide-react";
import DashboardMap from "@/components/DashboardMap";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardReportCards from "@/components/DashboardReportCards";
import DashboardStatistics from "@/components/DashboardStatistics";
import LocationSearch, { NominatimResult } from "@/components/LocationSearch";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScrollHeader } from "@/hooks/use-scroll-header";

const Dashboard = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollHeader(); // Normal scroll behavior for dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'map-analytics'>('overview');
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({
    area: null,
    status: null,
    dateRange: null,
  });
  const [selectedLocation, setSelectedLocation] = useState<NominatimResult | null>(null);

  const { toast } = useToast();

  // Fetch all reports from database
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pothole_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllReports((data as unknown as Report[]) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to reports
  const filteredReports = useMemo(() => {
    let filtered = [...allReports];

    // Filter by area
    if (filters.area) {
      filtered = filtered.filter(report => report.area_name === filters.area);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at);
        return reportDate >= filters.dateRange!.start && reportDate <= filters.dateRange!.end;
      });
    }

    return filtered;
  }, [allReports, filters]);

  // Calculate statistics
  const statistics: ReportStatistics = useMemo(() => {
    return {
      total: filteredReports.length,
      pending: filteredReports.filter(r => r.status === 'pending').length,
      inProgress: filteredReports.filter(r => r.status === 'in-progress').length,
      resolved: filteredReports.filter(r => r.status === 'resolved').length,
    };
  }, [filteredReports]);

  // Get unique areas for filter dropdown
  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(allReports.map(r => r.area_name))).sort();
  }, [allReports]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-zinc-900 dark:via-zinc-900 dark:to-black selection:bg-primary/20">
      {/* Floating Header with Scroll Behavior */}
      <header
        className={`fixed top-2 sm:top-4 left-0 right-0 z-50 px-2 sm:px-4 transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-24'
          }`}
      >
        <div className="container mx-auto p-0 sm:p-0">
          <div className="glass rounded-3xl sm:rounded-full border-x-0 border-t-0 sm:border px-4 py-3 sm:px-6 sm:py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="no-glass-effect flex items-center gap-2 md:gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                <img src="/logo.jpg" alt="Pothole Hero" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full border-2 border-white/50" />
              </div>
              <h1 className="text-sm md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Dashboard
              </h1>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {/* Total Reports Counter */}
              <div className="glass px-3 py-1.5 md:px-4 rounded-full text-xs md:text-sm font-medium text-primary flex items-center gap-1.5 md:gap-2 hover:bg-white/80 transition-colors cursor-default">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-bold">{allReports.length}</span>
                <span className="hidden sm:inline">Total Reports</span>
              </div>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="glass text-xs md:text-sm font-medium text-primary hover:text-primary transition-all duration-300 px-3 py-1.5 md:px-4 md:py-2 rounded-full h-auto hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
              >
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 pt-24 md:pt-28 pb-12">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-8">
          <TabsList className="glass p-1 rounded-full w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="map-analytics" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300">
              <Map className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Map & Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <DashboardStatistics statistics={statistics} />

            <div className="glass-card rounded-3xl p-6 md:p-8">
              <DashboardFilters
                filters={filters}
                onFiltersChange={setFilters}
                uniqueAreas={uniqueAreas}
              />
            </div>

            <DashboardReportCards reports={filteredReports} />
          </TabsContent>

          {/* Map & Analytics Tab */}
          <TabsContent value="map-analytics" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Map - Shows ALL reports */}
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold">Report Locations ({allReports.length} reports)</h3>
              </div>
              <div className="p-6 relative">
                <LocationSearch
                  onLocationSelect={setSelectedLocation}
                  className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4"
                />
                {allReports.length === 0 ? (
                  <div className="h-[500px] flex items-center justify-center bg-secondary/30 rounded-2xl">
                    <p className="text-muted-foreground">No reports available. Submit a report to see it on the map.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden shadow-inner">
                    <DashboardMap reports={allReports} selectedLocation={selectedLocation} />
                  </div>
                )}
              </div>
            </div>

            {/* Analytics - Shows FILTERED reports */}
            <div>
              {filteredReports.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center">
                  <h3 className="text-xl font-semibold mb-2">Analytics</h3>
                  <p className="text-muted-foreground">No reports match the current filters.</p>
                </div>
              ) : (
                <DashboardAnalytics
                  reports={filteredReports}
                  dateRange={filters.dateRange}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
