import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReportFilters } from "@/types/report";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DashboardFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  uniqueAreas: string[];
}

const DashboardFilters = ({ filters, onFiltersChange, uniqueAreas }: DashboardFiltersProps) => {
  const handleAreaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      area: value === "all" ? null : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? null : value,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.from,
          end: range.to,
        },
      });
    } else if (!range?.from && !range?.to) {
      onFiltersChange({
        ...filters,
        dateRange: null,
      });
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      area: null,
      status: null,
      dateRange: null,
    });
  };

  const hasActiveFilters = filters.area || filters.status || filters.dateRange;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Area Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Area</label>
            <Select value={filters.area || "all"} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {uniqueAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange ? (
                    <>
                      {format(filters.dateRange.start, "MMM dd, yyyy")} -{" "}
                      {format(filters.dateRange.end, "MMM dd, yyyy")}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={
                    filters.dateRange
                      ? { from: filters.dateRange.start, to: filters.dateRange.end }
                      : undefined
                  }
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;

