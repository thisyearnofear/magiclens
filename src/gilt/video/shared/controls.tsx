/** @jsxImportSource react */

import { Time, Controls, BufferingIndicator, Tooltip } from '@videojs/react';
import type { ReactNode } from 'react';

import { cn } from '@/gilt/lib/resolve-class-name';

import { LiveButton } from './live-button';
import { AudioPlayButton, PlayButton } from './play-button';
import { TimeSlider } from './time-slider';
import { type ThumbnailSlot } from './time-slider';
import { VolumePopover } from './volume-popover';

export function ControlsRow({
  audio = false,
  captions,
  live = false,
  menu,
  rate,
  seekBackward,
  seekForward,
}: ControlsSlots & { audio?: boolean; live?: boolean; menu?: ReactNode } = {}) {
  return (
    <Controls.Group className={'flex items-center rtl:flex-row-reverse justify-between gap-2'}>
      <Controls.Group className={cn('flex items-center rtl:flex-row-reverse gap-2', 'min-w-0')}>
        {audio ? <AudioPlayButton /> : <PlayButton />}
        {seekBackward}
        {seekForward}
        {live && <LiveButton />}
        {!audio && <VolumePopover />}
        {!live && (
          <Time.Group
            className={'flex h-4 shrink-0 items-center rtl:flex-row-reverse gap-1 px-1 leading-none tabular-nums'}
          >
            <Time.Value
              className={cn(
                'cursor-pointer rounded-none media-xs:hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-media-ring',
                'data-disabled:cursor-not-allowed data-disabled:opacity-40 forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:opacity-100'
              )}
              type="current"
              toggle
            />
            <Time.Value className={'hidden media-xs:inline data-unavailable:opacity-50'} type="current" />
            <Time.Separator className={'hidden opacity-70 media-xs:inline data-unavailable:opacity-50'} />
            <Time.Value className={'hidden opacity-70 media-xs:inline data-unavailable:opacity-50'} type="duration" />
          </Time.Group>
        )}
      </Controls.Group>

      <Controls.Group className={'flex items-center rtl:flex-row-reverse gap-2'}>
        {captions}
        {rate}
        {menu ?? (audio && <VolumePopover />)}
      </Controls.Group>
    </Controls.Group>
  );
}

export interface ControlsSlots extends ThumbnailSlot {
  /** The captions toggle, supplied by the video presets because the audio presets have no text track feature. */
  captions?: ReactNode;
  /** The playback-rate control, supplied by the on-demand audio preset. */
  rate?: ReactNode;
  /** The skip-back control, supplied by the presets that have a timeline. */
  seekBackward?: ReactNode;
  /** The skip-forward control, supplied by the presets that have a timeline. */
  seekForward?: ReactNode;
}

export function ControlsContent({
  audio = false,
  captions,
  center = false,
  live = false,
  menu,
  rate,
  renderThumbnail,
  seekBackward,
  seekForward,
  top,
}: ControlsSlots & { audio?: boolean; center?: boolean; live?: boolean; menu?: ReactNode; top?: ReactNode } = {}) {
  return (
    <Controls.Content
      className={cn('group/controls pointer-events-none absolute inset-0 z-30', audio && 'relative! inset-auto!')}
    >
      <Tooltip.Provider>
        {top && (
          <Controls.Group
            className={cn(
              'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute inset-x-0 top-0 p-3 flex items-center rtl:flex-row-reverse justify-end gap-2',
              'media-high-contrast:rounded-none media-high-contrast:bg-media-background forced-colors:rounded-none forced-colors:bg-[Canvas]',
              'forced-colors:inset-x-0 forced-colors:top-0 forced-colors:justify-end forced-colors:rounded-none!',
              'forced-colors:inset-e-0',
              'group-not-data-visible/controls:opacity-0',
              'not-data-started:[visibility:var(--media-controls-before-start,hidden)]'
            )}
          >
            {top}
          </Controls.Group>
        )}
        {center && (
          <BufferingIndicator className={'group/center-buffering contents'}>
            <Controls.Group
              className={cn(
                'group-not-data-visible/controls:pointer-events-none pointer-events-auto absolute left-1/2 top-1/2 flex transform-[translate(-50%,-50%)] items-center rtl:flex-row-reverse gap-2',
                'media-high-contrast:rounded-none media-high-contrast:bg-media-background media-high-contrast:px-2 forced-colors:bg-transparent!',
                'group-not-data-visible/controls:opacity-0 group-data-visible/center-buffering:hidden!'
              )}
            >
              {seekBackward}
              <PlayButton
                className={cn(
                  'm-0! border! border-media-accent/45! bg-media-popover/40! media-high-contrast:bg-media-background! media-high-contrast:border-media-foreground! forced-colors:bg-[ButtonFace]! forced-colors:border-[ButtonText]!',
                  'shadow-[0_0_28px_rgb(250_204_21/0.18)] hover:shadow-[0_0_36px_rgb(250_204_21/0.32)] focus-visible:shadow-[0_0_36px_rgb(250_204_21/0.32)]',
                  'hover:bg-media-popover/60! focus-visible:bg-media-popover/60! aria-expanded:bg-media-popover/60!',
                  'media-high-contrast:hover:bg-media-foreground! media-high-contrast:focus-visible:bg-media-foreground! media-high-contrast:aria-expanded:bg-media-foreground!',
                  'forced-colors:hover:bg-[Highlight]! forced-colors:focus-visible:bg-[Highlight]! forced-colors:aria-expanded:bg-[Highlight]!',
                  'size-14.5! media-max-360:size-11!'
                )}
                iconClassName={'size-7! media-max-360:size-5.5!'}
                tooltip={false}
              />
              {seekForward}
            </Controls.Group>
          </BufferingIndicator>
        )}
        <div
          className={cn(
            'group-not-data-visible/controls:pointer-events-none pointer-events-auto gilt-controls absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-media-background px-3 pt-3 pb-2.5',
            'before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-[linear-gradient(to_right,transparent,var(--media-accent),transparent)] before:content-[""]',
            'media-high-contrast:before:hidden forced-colors:before:hidden',
            'media-high-contrast:rounded-none media-high-contrast:bg-media-background forced-colors:rounded-none forced-colors:bg-[Canvas]',
            'group-not-data-visible/controls:opacity-0',
            audio && 'static! p-3',
            !audio &&
              'forced-colors:inset-x-0 forced-colors:bottom-0 forced-colors:rounded-none! group-not-data-started/controls:[visibility:var(--media-controls-before-start,hidden)]'
          )}
        >
          {!live && <TimeSlider audio={audio} renderThumbnail={renderThumbnail} />}
          <ControlsRow
            audio={audio}
            captions={captions}
            live={live}
            menu={menu}
            rate={rate}
            seekBackward={center ? undefined : seekBackward}
            seekForward={center ? undefined : seekForward}
          />
        </div>
      </Tooltip.Provider>
    </Controls.Content>
  );
}
