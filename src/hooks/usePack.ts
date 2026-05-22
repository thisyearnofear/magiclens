import { useState, useEffect } from 'react';

export interface OverlayVariant {
  code?: string;
  name?: string;
  flagUrl?: string;
  style?: string;
  label?: string;
  colors?: string[];
  accent?: string;
}

export interface OverlayDefinition {
  id: string;
  name: string;
  type: 'halo' | 'banner' | 'particle' | 'overlay';
  description: string;
  previewColor: string;
  thumbnail: string;
  icon: string;
  position?: string;
  variants?: OverlayVariant[];
}

export interface PackManifest {
  id: string;
  name: string;
  description: string;
  author: string;
  contractAddress: string;
  packTokenId: number;
  overlays: OverlayDefinition[];
}

export interface SelectedOverlay extends OverlayDefinition {
  chosenVariant: OverlayVariant | null;
}

export function usePack(packId: string = 'world-cup-2026') {
  const [manifest, setManifest] = useState<PackManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/packs/${packId}/manifest.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load pack: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [packId]);

  const getOverlay = (id: string): OverlayDefinition | undefined =>
    manifest?.overlays.find(o => o.id === id);

  return { manifest, loading, error, getOverlay };
}
