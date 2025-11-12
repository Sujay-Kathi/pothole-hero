import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Filter, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Report {
  id: string;
  image_url: string;
  area_name: string;
  address: string;
  duration: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchArea, setSearchArea] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchArea, statusFilter, dateFilter]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('pothole_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Report[]) => {
    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      in_progress: data.filter(r => r.status === 'in_progress' || r.status === 'under_review').length,
      resolved: data.filter(r => r.status === 'resolved').length,
    });
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Area search filter
    if (searchArea) {
      filtered = filtered.filter(r => 
        r.area_name.toLowerCase().includes(searchArea.toLowerCase()) ||
        r.address.toLowerCase().includes(searchArea.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter(r => {
        const reportDate = new Date(r.created_at);
        const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch(dateFilter) {
          case "today": return daysDiff === 0;
          case "week": return daysDiff <= 7;
          case "month": return daysDiff <= 30;
          default: return true;
        }
      });
    }

    setFilteredReports(filtered);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "under_review": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "in_progress": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "resolved": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDuration = (duration: string) => {
    return duration.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                PH
              </div>
              <h1 className="text-xl font-bold">Pothole Hero Dashboard</h1>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.in_progress}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search by Area</label>
                <Input
                  placeholder="Enter area name or address..."
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {filteredReports.length} of {reports.length} reports</span>
              {(searchArea || statusFilter !== "all" || dateFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchArea("");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Reports</h2>
          
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No reports found matching your filters.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="overflow-hidden hover:shadow-[var(--shadow-elevated)] transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={report.image_url}
                      alt={`Pothole in ${report.area_name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[image:var(--gradient-overlay)]" />
                    <Badge 
                      className={`absolute top-2 right-2 ${getStatusColor(report.status)}`}
                    >
                      {formatStatus(report.status)}
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
