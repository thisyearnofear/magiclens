'use client';

import { I18nProvider } from '@videojs/react/i18n';
import { MuxVideo } from '@videojs/react/media/mux-video';
// Aliased: the app's own player (`@/components/ui/VideoPlayer`) owns the bare names.
// `Video` here is the generic progressive-source media element (mp4/webm) —
// real premiere clips play through this; Mux streams keep using MuxVideo.
import { VideoPlayer as VideoJsPlayer, Video as VideoJsMedia } from '@videojs/react/video';

import { VideoSkin } from '@/gilt/video/skin';

// Gilt — the cinematic Video.js v10 skin built for the Video.js Skins Design
// Challenge. Source lives in src/gilt/ (ported from the standalone skin project);
// its compiled stylesheet is served from /public/gilt-skin.css and linked by the
// page, since this app's Tailwind 3 PostCSS pipeline can't process TW4 output.
//
// Prop-driven so real MagicLens content can premiere here: pass a moment's
// stream + poster and the skin becomes that moment's cinema. Defaults keep the
// standalone challenge demo working with no backend.
export const GILT_DEMO_SRC = 'https://stream.mux.com/CeJ21NaY0040199ak00r01fJbsERZvOqzYlfWtETjrJP5RE.m3u8';
export const GILT_DEMO_POSTER =
  'https://image.mux.com/CeJ21NaY0040199ak00r01fJbsERZvOqzYlfWtETjrJP5RE/thumbnail.jpg?time=1';

interface GiltPlayerProps {
  src?: string;
  poster?: string;
  /** Keyed by the host when the feature changes so Video.js reloads the source. */
  featureKey?: string | number;
}

export function GiltPlayer({ src = GILT_DEMO_SRC, poster = GILT_DEMO_POSTER, featureKey }: GiltPlayerProps) {
  const isMuxStream = src.includes('.m3u8');
  return (
    <I18nProvider>
      <div className="gilt-player">
        <VideoJsPlayer key={featureKey ?? src} poster={poster}>
          <VideoSkin>
            {isMuxStream ? (
              <MuxVideo src={src} playsInline crossOrigin="" />
            ) : (
              <VideoJsMedia src={src} playsInline crossOrigin="" preload="metadata" />
            )}
          </VideoSkin>
        </VideoJsPlayer>
      </div>
    </I18nProvider>
  );
}
