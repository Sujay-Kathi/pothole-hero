-- Add mail_status column to pothole_reports table
ALTER TABLE public.pothole_reports 
ADD COLUMN mail_status text NOT NULL DEFAULT 'pending';

-- Create index for faster queries
CREATE INDEX idx_pothole_reports_mail_status ON public.pothole_reports(mail_status);

-- Add comment
COMMENT ON COLUMN public.pothole_reports.mail_status IS 'Status of email sending: pending or sent';