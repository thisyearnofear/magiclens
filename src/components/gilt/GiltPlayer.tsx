'use client';

import { I18nProvider } from '@videojs/react/i18n';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { VideoPlayer } from '@videojs/react/video';

import { VideoSkin } from '@/gilt/video/skin';

// Gilt — the cinematic Video.js v10 skin built for the Video.js Skins Design
// Challenge. Source lives in src/gilt/ (ported from the standalone skin project);
// its compiled stylesheet is served from /public/gilt-skin.css and linked by the
// page, since this app's Tailwind 3 PostCSS pipeline can't process TW4 output.
const SRC = 'https://stream.mux.com/CeJ21NaY0040199ak00r01fJbsERZvOqzYlfWtETjrJP5RE.m3u8';
const POSTER =
  'https://image.mux.com/CeJ21NaY0040199ak00r01fJbsERZvOqzYlfWtETjrJP5RE/thumbnail.jpg?time=1';

export function GiltPlayer() {
  return (
    <I18nProvider>
      <div className="gilt-player">
        <VideoPlayer poster={POSTER}>
          <VideoSkin>
            <MuxVideo src={SRC} playsInline crossOrigin="" />
          </VideoSkin>
        </VideoPlayer>
      </div>
    </I18nProvider>
  );
}
