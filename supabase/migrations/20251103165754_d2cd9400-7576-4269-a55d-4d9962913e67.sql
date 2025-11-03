-- Create storage bucket for pothole images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pothole-images', 'pothole-images', true);

-- Create pothole_reports table
CREATE TABLE public.pothole_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  area_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pothole_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert reports (public reporting)
CREATE POLICY "Anyone can submit pothole reports"
ON public.pothole_reports
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to view reports (public transparency)
CREATE POLICY "Anyone can view pothole reports"
ON public.pothole_reports
FOR SELECT
USING (true);

-- Create storage policies for pothole images
CREATE POLICY "Anyone can upload pothole images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pothole-images');

CREATE POLICY "Pothole images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pothole-images');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pothole_reports_updated_at
BEFORE UPDATE ON public.pothole_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();