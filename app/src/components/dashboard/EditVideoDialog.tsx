import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface EditVideoDialogProps {
  open: boolean;
  video: { id: string; title: string } | null;
  onClose: () => void;
  onSave: (id: string, title: string) => Promise<void>;
}

export function EditVideoDialog({ open, video, onClose, onSave }: EditVideoDialogProps) {
  const [newTitle, setNewTitle] = useState(video?.title ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (video) {
      setNewTitle(video.title);
    }
  }, [video]);

  const handleSave = async () => {
    if (!video || !newTitle.trim()) return;
    setSaving(true);
    try {
      await onSave(video.id, newTitle.trim());
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Video Title</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-title" className="text-sm font-medium text-gray-300">
              Video Title
            </Label>
            <Input
              id="video-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter video title..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!newTitle.trim() || newTitle === video?.title || saving}
            className="bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
