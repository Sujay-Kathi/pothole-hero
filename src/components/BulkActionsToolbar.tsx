import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";

interface BulkActionsToolbarProps {
  selectedIds: string[];
  totalReports: number;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  onReportsUpdated?: () => void;
}

const BulkActionsToolbar = ({
  selectedIds,
  totalReports,
  onSelectAll,
  onClearSelection,
  onReportsUpdated,
}: BulkActionsToolbarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const allSelected = selectedIds.length === totalReports && totalReports > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < totalReports;

  const handleStatusUpdate = async () => {
    if (!newStatus || selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('pothole_reports')
        .update({ status: newStatus })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated status for ${selectedIds.length} report(s)`,
      });

      onClearSelection();
      onReportsUpdated?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowStatusDialog(false);
      setNewStatus("");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('pothole_reports')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedIds.length} report(s)`,
      });

      onClearSelection();
      onReportsUpdated?.();
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast({
        title: "Error",
        description: "Failed to delete reports",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExportCSV = async () => {
    if (selectedIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('pothole_reports')
        .select('*')
        .in('id', selectedIds);

      if (error) throw error;

      // Create CSV content
      const headers = ['ID', 'Area', 'Address', 'Status', 'Created Date', 'Latitude', 'Longitude', 'Duration'];
      const csvRows = [headers.join(',')];

      data?.forEach(report => {
        const row = [
          report.id,
          `"${report.area_name}"`,
          `"${report.address}"`,
          report.status,
          format(new Date(report.created_at), 'yyyy-MM-dd HH:mm:ss'),
          report.latitude,
          report.longitude,
          `"${report.duration}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `pothole-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Exported ${selectedIds.length} report(s) to CSV`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export reports",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                ref={(el) => {
                  if (el) {
                    (el as any).indeterminate = someSelected;
                  }
                }}
              />
              <span className="text-sm font-medium">
                {selectedIds.length > 0
                  ? `${selectedIds.length} report(s) selected`
                  : 'Select reports'}
              </span>
              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearSelection}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={newStatus}
                onValueChange={(value) => {
                  setNewStatus(value);
                  setShowStatusDialog(true);
                }}
                disabled={selectedIds.length === 0}
              >
                <SelectTrigger className="w-[180px]">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={selectedIds.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={selectedIds.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} report(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update status for {selectedIds.length} report(s) to "{newStatus.replace('-', ' ')}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => setNewStatus("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusUpdate} disabled={isProcessing}>
              {isProcessing ? "Updating..." : "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActionsToolbar;

