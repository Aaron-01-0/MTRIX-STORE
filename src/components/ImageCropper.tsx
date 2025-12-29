import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  open: boolean;
}

export const ImageCropper = ({ image, onCropComplete, onClose, open }: ImageCropperProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    // Calculate actual pixel dimensions
    const pixelWidth = completedCrop.width * scaleX;
    const pixelHeight = completedCrop.height * scaleY;

    // Constrain Max Width to 1080px for bandwidth optimization
    const MAX_WIDTH = 1080;
    let outputWidth = pixelWidth;
    let outputHeight = pixelHeight;

    if (outputWidth > MAX_WIDTH) {
      outputHeight = Math.round((outputHeight * MAX_WIDTH) / outputWidth);
      outputWidth = MAX_WIDTH;
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw resized image
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      pixelWidth,
      pixelHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/webp', // Force WebP
        0.8 // Quality 80%
      );
    });
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      // If no crop defined, use full image
      const response = await fetch(image);
      const blob = await response.blob();
      onCropComplete(blob);
      onClose();
      return;
    }

    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription className="sr-only">
            Crop the image or use it as-is. This dialog is scrollable if content exceeds the screen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="mb-2 text-sm text-muted-foreground">
            Drag to crop the image, or leave as-is to use the full image.
          </div>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
          >
            <img ref={imgRef} src={image} alt="Crop preview" className="max-w-full max-h-[60vh] object-contain" />
          </ReactCrop>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCropComplete}>
              Crop & Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
