import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Report, ReportStatistics, ReportFilters } from "@/types/report";
import { Loader2, BarChart3, Map, FileText } from "lucide-react";
import DashboardMap from "@/components/DashboardMap";
import DashboardAnalytics from "@/components/DashboardAnalytics";
import DashboardFilters from "@/components/DashboardFilters";
import DashboardReportCards from "@/components/DashboardReportCards";
import DashboardStatistics from "@/components/DashboardStatistics";
import LocationSearch, { NominatimResult } from "@/components/LocationSearch";

const Dashboard = () => {
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
      setAllReports(data || []);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Pothole Hero" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Pothole Hero Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Total Reports Counter */}
              <div className="rounded-full border border-transparent bg-orange-100 text-orange-800 font-semibold transition-colors hover:bg-orange-200/80 flex items-center gap-2 px-3 py-1.5 text-sm">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">{allReports.length}</span>
<<<<<<< HEAD
                <span className="hidden sm:inline text-muted-foreground">Total Reports</span>
=======
                <span className="hidden sm:inline">Total Reports</span>
>>>>>>> 101566f19d8beb947869a6020e567fc0d9e5e29c
              </div>
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="map-analytics" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map & Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <DashboardStatistics statistics={statistics} />

            <DashboardFilters
              filters={filters}
              onFiltersChange={setFilters}
              uniqueAreas={uniqueAreas}
            />

            <DashboardReportCards reports={filteredReports} />
          </TabsContent>

          {/* Map & Analytics Tab */}
          <TabsContent value="map-analytics" className="space-y-6">
            {/* Debug info - remove after testing */}
            {console.log('Map & Analytics Tab - allReports:', allReports.length, 'filteredReports:', filteredReports.length)}

            {/* Map - Shows ALL reports */}
            <Card>
              <CardHeader>
                <CardTitle>Report Locations ({allReports.length} reports)</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <LocationSearch 
                  onLocationSelect={setSelectedLocation}
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4"
                />
                {allReports.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">No reports available. Submit a report to see it on the map.</p>
                  </div>
                ) : (
                  <DashboardMap reports={allReports} selectedLocation={selectedLocation} />
                )}
              </CardContent>
            </Card>

            {/* Analytics - Shows FILTERED reports */}
            <div>
              {filteredReports.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-muted-foreground">No reports match the current filters.</p>
                    </div>
                  </CardContent>
                </Card>
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
