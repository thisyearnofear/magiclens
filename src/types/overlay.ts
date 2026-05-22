// Consolidated overlay types - Single source of truth
export interface BaseOverlay {
    id: string;
    title: string;
    source: string;
}

export interface GifOverlay extends BaseOverlay {
    preview_url: string;
    full_url: string;
    tags?: string[];
}

export interface AssetOverlay extends BaseOverlay {
    asset: {
        id: string;
        name: string;
        file_path: string;
        thumbnail_path?: string;
        category: string;
        asset_type?: string;
    };
    confidence?: number;
    reasoning?: string;
    placement: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        angle: number;
    };
}

export type OverlayItem = GifOverlay | AssetOverlay;

export interface OverlayPlacement {
    position: {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        angle: number;
    };
    timing: {
        startTime: number;
        endTime: number;
        fadeIn: number;
        fadeOut: number;
    };
    layerOrder: number;
}

export interface AppliedOverlay {
    asset: AssetOverlay['asset'];
    placement: OverlayPlacement;
}

// Environmental footage types
export interface EnvironmentalVideo {
    id: number;
    title: string;
    description: string;
    preview_url: string;
    video_url: string;
    duration: number;
    width: number;
    height: number;
    photographer: string;
    photographer_url: string;
    source: string;
    tags?: string[];
}

export interface EnvironmentalCategory {
    name: string;
    query: string;
    description: string;
}