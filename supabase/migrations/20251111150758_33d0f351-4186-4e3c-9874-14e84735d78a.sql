-- Add status column to pothole_reports table for tracking resolution
ALTER TABLE pothole_reports 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add check constraint for valid status values
ALTER TABLE pothole_reports
ADD CONSTRAINT valid_status CHECK (status IN ('pending', 'under_review', 'in_progress', 'resolved', 'rejected'));

-- Create index for better query performance on status
CREATE INDEX idx_pothole_reports_status ON pothole_reports(status);

-- Create index for better query performance on area_name for filtering
CREATE INDEX idx_pothole_reports_area_name ON pothole_reports(area_name);

-- Create index for better query performance on created_at for date filtering
CREATE INDEX idx_pothole_reports_created_at ON pothole_reports(created_at);