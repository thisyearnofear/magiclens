import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface DeleteVideoDialogProps {
  open: boolean;
  video: { id: string; title: string } | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteVideoDialog({ open, video, loading, onClose, onConfirm }: DeleteVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-gray-900 border-red-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-400 flex items-center space-x-2">
            <Trash2 className="h-5 w-5" />
            <span>Delete Video</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-2">
              You are about to permanently delete:
            </p>
            <p className="text-white font-semibold">
              &ldquo;{video?.title}&rdquo;
            </p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ Warning</p>
            <p className="text-gray-300 text-sm">
              This action cannot be undone. The video and all associated data will be permanently removed.
            </p>
          </div>
        </div>
        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Video
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
