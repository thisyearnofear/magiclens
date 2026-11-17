/** @jsxImportSource react */

import { Controls } from '@videojs/react';
import type { ReactNode } from 'react';

import { cn } from '@/gilt/lib/resolve-class-name';

import { CaptionsToggle } from './captions-button';
import { ControlsContent, type ControlsSlots } from './controls';
import { ScreenControls } from './screen-controls';
import { Title } from './title';
import { VideoBufferingIndicator } from './video-feedback';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
}: ControlsSlots & { center?: boolean; live?: boolean; menu?: ReactNode } = {}) {
  return (
    <>
      <Controls.Backdrop
        className={cn(
          'pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.75),transparent_42%,transparent_62%,rgb(0_0_0/0.55))] not-data-visible:hidden forced-colors:bg-none',
          'not-data-started:[visibility:var(--media-controls-before-start,hidden)]'
        )}
      />
      <VideoBufferingIndicator />
      <ControlsContent
        captions={!live && <CaptionsToggle />}
        center={center}
        live={live}
        menu={menu}
        renderThumbnail={renderThumbnail}
        seekBackward={seekBackward}
        seekForward={seekForward}
        top={
          <>
            <Title />
            <ScreenControls />
          </>
        }
      />
    </>
  );
}
