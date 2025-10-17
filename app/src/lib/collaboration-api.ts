import { apiClient } from './api-client';
import { OverlayData } from '@/types/overlay-types';

export const addOverlayToCollaboration = async (
  collaborationId: string,
  assetId: string,
  positionData: any,
  timingData: any,
  layerOrder: number
) => {
  const response = await apiClient.post(
    '/collaboration_service/add_overlay_to_collaboration',
    {
      collaboration_id: collaborationId,
      asset_id: assetId,
      position_data: positionData,
      timing_data: timingData,
      layer_order: layerOrder,
    }
  );
  return response.data;
};

export const getCollaborationOverlays = async (collaborationId: string) => {
  const response = await apiClient.post(
    '/collaboration_service/get_collaboration_overlays',
    {
      collaboration_id: collaborationId,
    }
  );
  return response.data;
};

export const updateOverlay = async (
  overlayId: string,
  positionData: any,
  timingData: any,
  layerOrder: number
) => {
  const response = await apiClient.post('/collaboration_service/update_overlay', {
    overlay_id: overlayId,
    position_data: positionData,
    timing_data: timingData,
    layer_order: layerOrder,
  });
  return response.data;
};

export const deleteOverlay = async (overlayId: string) => {
  const response = await apiClient.post('/collaboration_service/delete_overlay', {
    overlay_id: overlayId,
  });
  return response.data;
};