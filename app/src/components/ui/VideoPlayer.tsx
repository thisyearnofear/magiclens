import React, { useRef } from 'react';
import { Play } from 'lucide-react';
import { Video } from '@/lib/sdk';

interface VideoPlayerProps {
    video: Pick<Video, 'file_path' | 'thumbnail_path' | 'title'>;
    className?: string;
    controls?: boolean;
    muted?: boolean;
    poster?: boolean;
    hoverToPlay?: boolean;
}

export default function VideoPlayer({
    video,
    className = "w-full h-full object-contain",
    controls = false,
    muted = false,
    poster = true,
    hoverToPlay = false
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    if (!video.file_path) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-black/20">
                <div className="text-center">
                    <Play className="h-12 w-12 mx-auto mb-2" />
                    <span className="text-sm">Video not available</span>
                </div>
            </div>
        );
    }

    const handleMouseEnter = () => {
        if (hoverToPlay && videoRef.current) {
            videoRef.current.play();
        }
    };

    const handleMouseLeave = () => {
        if (hoverToPlay && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <video
            ref={videoRef}
            src={video.file_path}
            className={className}
            controls={controls}
            muted={muted}
            poster={poster && video.thumbnail_path ? video.thumbnail_path : undefined}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            Your browser does not support the video tag.
        </video>
    );
}