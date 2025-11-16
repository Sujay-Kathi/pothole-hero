import { useMemo, useState } from "react";
import { Report } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  format,
  startOfWeek,
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
} from "date-fns";

interface DashboardAnalyticsProps {
  reports: Report[];
  dateRange: { start: Date; end: Date } | null;
}

type TimelineView = "daily" | "weekly" | "monthly";

const DashboardAnalytics = ({ reports, dateRange }: DashboardAnalyticsProps) => {
  const [timelineView, setTimelineView] = useState<TimelineView>("weekly");

  // Timeline Chart Data
  const timelineData = useMemo(() => {
    if (reports.length === 0) return [];

    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstDate = new Date(sortedReports[0].created_at);
    const lastDate = new Date(sortedReports[sortedReports.length - 1].created_at);

    let intervals: Date[] = [];
    let formatStr = "";

    if (timelineView === "daily") {
      intervals = eachDayOfInterval({ start: firstDate, end: lastDate });
      formatStr = "MMM dd";
    } else if (timelineView === "weekly") {
      intervals = eachWeekOfInterval({ start: firstDate, end: lastDate });
      formatStr = "'Week' w";
    } else {
      intervals = eachMonthOfInterval({ start: firstDate, end: lastDate });
      formatStr = "MMM yyyy";
    }

    return intervals.map((date) => {
      const count = reports.filter((report) => {
        const reportDate = new Date(report.created_at);
        if (timelineView === "daily") {
          return format(reportDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
        } else if (timelineView === "weekly") {
          const weekStart = startOfWeek(date);
          const reportWeekStart = startOfWeek(reportDate);
          return format(weekStart, "yyyy-MM-dd") === format(reportWeekStart, "yyyy-MM-dd");
        } else {
          const monthStart = startOfMonth(date);
          const reportMonthStart = startOfMonth(reportDate);
          return format(monthStart, "yyyy-MM") === format(reportMonthStart, "yyyy-MM");
        }
      }).length;

      return {
        date: format(date, formatStr),
        count,
      };
    });
  }, [reports, timelineView]);

  // Status Distribution Data
  const statusData = useMemo(() => {
    const pending = reports.filter((r) => r.status === "pending").length;
    const inProgress = reports.filter((r) => r.status === "in-progress").length;
    const resolved = reports.filter((r) => r.status === "resolved").length;

    return [
      { status: "Pending", count: pending, fill: "#FCD34D" },
      { status: "In Progress", count: inProgress, fill: "#3B82F6" },
      { status: "Resolved", count: resolved, fill: "#10B981" },
    ];
  }, [reports]);

  // Area Hotspots Data (Top 10)
  const areaData = useMemo(() => {
    const areaCounts = reports.reduce((acc, report) => {
      acc[report.area_name] = (acc[report.area_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(areaCounts)
      .map(([area, count]) => ({
        area: area.length > 20 ? area.substring(0, 20) + "..." : area,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [reports]);

  // Resolution Trends Data
  const resolutionTrendsData = useMemo(() => {
    const resolvedReports = reports.filter(
      (r) => r.status === "resolved" && r.resolved_at && r.created_at
    );

    if (resolvedReports.length < 5) {
      return null; // Insufficient data
    }

    // Group by week
    const weeklyData = resolvedReports.reduce((acc, report) => {
      const weekStart = format(startOfWeek(new Date(report.resolved_at!)), "MMM dd");
      const daysToResolve = differenceInDays(
        new Date(report.resolved_at!),
        new Date(report.created_at)
      );

      if (!acc[weekStart]) {
        acc[weekStart] = { total: 0, count: 0 };
      }
      acc[weekStart].total += daysToResolve;
      acc[weekStart].count += 1;

      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      avgDays: Math.round(data.total / data.count),
    }));
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available for analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reports Timeline</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={timelineView === "daily" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimelineView("daily")}
              >
                Daily
              </Button>
              <Button
                variant={timelineView === "weekly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimelineView("weekly")}
              >
                Weekly
              </Button>
              <Button
                variant={timelineView === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimelineView("monthly")}
              >
                Monthly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Reports"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" label={{ position: "top" }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Area Hotspots */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Area Hotspots</CardTitle>
        </CardHeader>
        <CardContent>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="area" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" label={{ position: "right" }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No area data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Trends (Avg Days to Resolve)</CardTitle>
        </CardHeader>
        <CardContent>
          {resolutionTrendsData && resolutionTrendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={resolutionTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Avg Days"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Insufficient data (need at least 5 resolved reports)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardAnalytics;

