import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "./ImageUpload";
import LocationPicker from "./LocationPicker";
import { Loader2 } from "lucide-react";

interface ReportFormProps {
  onSuccess: (reportData: any) => void;
}

const ReportForm = ({ onSuccess }: ReportFormProps) => {
  const [image, setImage] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [areaName, setAreaName] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleLocationSelect = (lat: number, lng: number, addr: string, area: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setAreaName(area);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image || !latitude || !longitude || !address || !areaName || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pothole-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pothole-images')
        .getPublicUrl(filePath);

      // Insert report into database
      const { data: reportData, error: insertError } = await supabase
        .from('pothole_reports')
        .insert({
          image_url: publicUrl,
          latitude,
          longitude,
          address,
          area_name: areaName,
          duration,
          description: description || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Report Submitted",
        description: "Preparing email to BBMP...",
      });

      onSuccess(reportData);
      
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Submit Pothole Report</h2>
        <p className="text-muted-foreground">
          Help us make Bangalore's roads safer. All fields marked with * are required.
        </p>
      </div>

      <ImageUpload image={image} onImageChange={setImage} />

      <LocationPicker
        onLocationSelect={handleLocationSelect}
        latitude={latitude}
        longitude={longitude}
      />

      {address && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Address</label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Auto-filled from map"
          />
        </div>
      )}

      {areaName && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Area Name</label>
          <Input
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder="Auto-filled from map"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          How long has this pothole existed? <span className="text-destructive">*</span>
        </label>
        <Select value={duration} onValueChange={setDuration}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="less-than-week">Less than a week</SelectItem>
            <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
            <SelectItem value="2-4-weeks">2-4 weeks</SelectItem>
            <SelectItem value="1-3-months">1-3 months</SelectItem>
            <SelectItem value="3-6-months">3-6 months</SelectItem>
            <SelectItem value="more-than-6-months">More than 6 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Additional Details (Optional)</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any additional information about the pothole, nearby landmarks, or safety concerns..."
          rows={4}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting Report...
          </>
        ) : (
          "Submit Report & Email BBMP"
        )}
      </Button>
    </form>
  );
};

export default ReportForm;