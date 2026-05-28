import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnvironmentalFootageGallery } from '@/components/EnvironmentalFootageGallery';

interface EnvironmentalGalleryDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EnvironmentalGalleryDialog({ open, onClose }: EnvironmentalGalleryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Environmental Footage Inspiration</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <EnvironmentalFootageGallery showAsInspiration={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
