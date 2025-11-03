import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  image: File | null;
  onImageChange: (file: File | null) => void;
}

const ImageUpload = ({ image, onImageChange }: ImageUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageChange(acceptedFiles[0]);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const removeImage = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Pothole Image <span className="text-destructive">*</span>
      </label>
      
      {!image ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors hover:border-primary
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-sm text-foreground">Drop the image here</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPEG, PNG, WebP (max 10MB)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border">
          <img
            src={URL.createObjectURL(image)}
            alt="Pothole"
            className="w-full h-64 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-sm font-medium">{image.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;