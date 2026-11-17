/** @jsxImportSource react */

import { Controls } from '@videojs/react';

import { cn } from '@/gilt/lib/resolve-class-name';

import { SeekButton } from './shared/seek-button';
import { SettingsMenu } from './shared/settings-menu';
import type { ThumbnailSlot } from './shared/time-slider';
import { VideoControlsContent } from './shared/video-controls';

export function VideoControls({ renderThumbnail }: ThumbnailSlot = {}) {
  return (
    <Controls.Root>
      <VideoControlsContent
        center
        menu={<SettingsMenu />}
        renderThumbnail={renderThumbnail}
        seekBackward={
          <SeekButton
            className={cn(
              'm-0! bg-media-popover/40! media-high-contrast:bg-media-background! forced-colors:bg-[ButtonFace]!',
              'hover:bg-media-popover/60! focus-visible:bg-media-popover/60! aria-expanded:bg-media-popover/60!',
              'media-high-contrast:hover:bg-media-foreground! media-high-contrast:focus-visible:bg-media-foreground! media-high-contrast:aria-expanded:bg-media-foreground!',
              'forced-colors:hover:bg-[Highlight]! forced-colors:focus-visible:bg-[Highlight]! forced-colors:aria-expanded:bg-[Highlight]!',
              'hidden size-8! pointer-fine:grid media-max-360:hidden! group-not-data-started/controls:hidden!'
            )}
            iconClassName={'size-4.5'}
            seconds={-10}
            tooltip={false}
          />
        }
        seekForward={
          <SeekButton
            className={cn(
              'm-0! bg-media-popover/40! media-high-contrast:bg-media-background! forced-colors:bg-[ButtonFace]!',
              'hover:bg-media-popover/60! focus-visible:bg-media-popover/60! aria-expanded:bg-media-popover/60!',
              'media-high-contrast:hover:bg-media-foreground! media-high-contrast:focus-visible:bg-media-foreground! media-high-contrast:aria-expanded:bg-media-foreground!',
              'forced-colors:hover:bg-[Highlight]! forced-colors:focus-visible:bg-[Highlight]! forced-colors:aria-expanded:bg-[Highlight]!',
              'hidden size-8! pointer-fine:grid media-max-360:hidden! group-not-data-started/controls:hidden!'
            )}
            iconClassName={'size-4.5'}
            seconds={10}
            tooltip={false}
          />
        }
      />
    </Controls.Root>
  );
}
