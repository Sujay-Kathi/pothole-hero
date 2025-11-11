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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageVerified, setImageVerified] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleImageChange = async (file: File | null) => {
    setImage(file);
    setImageVerified(false);
    setTempImageUrl(null);

    if (!file) return;

    setIsAnalyzing(true);

    try {
      // Upload image temporarily to analyze it
      const fileExt = file.name.split('.').pop();
      const fileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pothole-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pothole-images')
        .getPublicUrl(filePath);

      setTempImageUrl(publicUrl);

      // Analyze the image with AI
      const { data, error } = await supabase.functions.invoke('analyze-pothole', {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      if (data.isPothole) {
        setImageVerified(true);
        toast({
          title: "Image Verified ✓",
          description: "This appears to be a pothole. You can proceed with the report.",
        });
      } else {
        setImage(null);
        setTempImageUrl(null);
        // Delete the temporary image
        await supabase.storage.from('pothole-images').remove([filePath]);
        
        toast({
          title: "Image Not Valid",
          description: data.reason || "This does not appear to be a pothole. Please upload a photo of a road pothole.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive"
      });
      setImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, addr: string, area: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setAreaName(area);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image || !imageVerified || !latitude || !longitude || !address || !areaName || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and ensure the image is verified",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the already uploaded and verified image URL
      const publicUrl = tempImageUrl;

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

      <ImageUpload image={image} onImageChange={handleImageChange} />
      
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing image with AI to verify it's a pothole...</span>
        </div>
      )}

      {imageVerified && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
          <span className="font-medium">✓ Image verified as a pothole</span>
        </div>
      )}

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
        disabled={isSubmitting || !imageVerified || isAnalyzing}
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