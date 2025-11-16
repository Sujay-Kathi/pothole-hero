-- Add status column to pothole_reports table
-- Status can be: pending, in-progress, or resolved
ALTER TABLE public.pothole_reports 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'in-progress', 'resolved'));

-- Add resolved_at column to track when a pothole was marked as resolved
ALTER TABLE public.pothole_reports 
ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;

-- Create index on status for faster filtering
CREATE INDEX idx_pothole_reports_status ON public.pothole_reports(status);

-- Create index on resolved_at for analytics queries
CREATE INDEX idx_pothole_reports_resolved_at ON public.pothole_reports(resolved_at);

-- Add policy to allow anyone to update report status (for dashboard management)
CREATE POLICY "Anyone can update pothole report status"
ON public.pothole_reports
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add policy to allow anyone to delete reports (for dashboard management)
CREATE POLICY "Anyone can delete pothole reports"
ON public.pothole_reports
FOR DELETE
USING (true);

-- Create trigger to automatically set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION public.set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is being changed to 'resolved', set resolved_at to now
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    NEW.resolved_at = now();
  END IF;
  
  -- If status is being changed from 'resolved' to something else, clear resolved_at
  IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_resolved_at_trigger
BEFORE UPDATE ON public.pothole_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_resolved_at();

