from typing import Dict, List, Optional
from uuid import UUID
import subprocess
import json
import os
from core.videos import Video
from core.overlays import Overlay
from core.artist_assets import ArtistAsset
from core.media import get_from_bucket, save_to_bucket, MediaFile

class FFmpegRenderer:
    """Service for rendering videos with overlays using FFmpeg."""
    
    def __init__(self):
        self.temp_dir = "/tmp/renders"
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def render_collaboration(self, video_path: str, overlays_data: List[Dict], output_settings: Dict) -> str:
        """Render a video with overlays using FFmpeg."""
        
        try:
            # Download video file locally
            video_file = get_from_bucket(video_path)
            local_video_path = f"{self.temp_dir}/input_video_{UUID.uuid4().hex}.mp4"
            
            with open(local_video_path, 'wb') as f:
                f.write(video_file.bytes)
            
            # Download overlay assets
            overlay_files = []
            for overlay in overlays_data:
                asset_file = get_from_bucket(overlay['asset_path'])
                local_asset_path = f"{self.temp_dir}/overlay_{overlay['id']}_{UUID.uuid4().hex}.{overlay['format']}"
                
                with open(local_asset_path, 'wb') as f:
                    f.write(asset_file.bytes)
                
                overlay_files.append({
                    'path': local_asset_path,
                    'data': overlay
                })
            
            # Build FFmpeg command
            output_path = f"{self.temp_dir}/output_{UUID.uuid4().hex}.mp4"
            ffmpeg_cmd = self._build_ffmpeg_command(
                local_video_path, 
                overlay_files, 
                output_path, 
                output_settings
            )
            
            # Execute FFmpeg
            result = subprocess.run(
                ffmpeg_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise RuntimeError(f"FFmpeg failed: {result.stderr}")
            
            # Upload result to media bucket
            with open(output_path, 'rb') as f:
                output_media = MediaFile(
                    size=os.path.getsize(output_path),
                    mime_type='video/mp4',
                    bytes=f.read()
                )
            
            bucket_path = save_to_bucket(output_media, f"renders/{UUID.uuid4().hex}.mp4")
            
            # Cleanup temporary files
            self._cleanup_files([local_video_path, output_path] + [f['path'] for f in overlay_files])
            
            return bucket_path
            
        except Exception as e:
            # Cleanup on error
            if 'local_video_path' in locals():
                self._cleanup_files([local_video_path])
            if 'overlay_files' in locals():
                self._cleanup_files([f['path'] for f in overlay_files])
            if 'output_path' in locals() and os.path.exists(output_path):
                os.remove(output_path)
            
            raise e
    
    def _build_ffmpeg_command(self, video_path: str, overlay_files: List[Dict], output_path: str, settings: Dict) -> List[str]:
        """Build FFmpeg command for compositing overlays."""
        
        cmd = ['ffmpeg', '-y']  # -y to overwrite output files
        
        # Input video
        cmd.extend(['-i', video_path])
        
        # Input overlay files
        for overlay_file in overlay_files:
            cmd.extend(['-i', overlay_file['path']])
        
        # Build filter complex for overlays
        filter_complex = self._build_filter_complex(overlay_files)
        if filter_complex:
            cmd.extend(['-filter_complex', filter_complex])
        
        # Output settings
        resolution = settings.get('resolution', '1920x1080')
        quality = settings.get('quality', 'high')
        fps = settings.get('fps', 30)
        
        # Quality settings
        if quality == 'high':
            cmd.extend(['-crf', '18'])
        elif quality == 'medium':
            cmd.extend(['-crf', '23'])
        else:  # low
            cmd.extend(['-crf', '28'])
        
        # Video codec and settings
        cmd.extend([
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-r', str(fps),
            '-s', resolution
        ])
        
        # Audio settings (copy from original)
        cmd.extend(['-c:a', 'aac', '-b:a', '128k'])
        
        # Output file
        cmd.append(output_path)
        
        return cmd
    
    def _build_filter_complex(self, overlay_files: List[Dict]) -> str:
        """Build FFmpeg filter complex string for overlays."""
        
        if not overlay_files:
            return ""
        
        filters = []
        current_layer = "0"
        
        for i, overlay_file in enumerate(overlay_files):
            overlay_data = overlay_file['data']
            input_index = i + 1  # +1 because input 0 is the main video
            
            # Position and timing
            x = overlay_data.get('position', {}).get('x', 0)
            y = overlay_data.get('position', {}).get('y', 0)
            scale_x = overlay_data.get('position', {}).get('scaleX', 1)
            scale_y = overlay_data.get('position', {}).get('scaleY', 1)
            start_time = overlay_data.get('timing', {}).get('startTime', 0)
            end_time = overlay_data.get('timing', {}).get('endTime', 30)
            fade_in = overlay_data.get('timing', {}).get('fadeIn', 0)
            fade_out = overlay_data.get('timing', {}).get('fadeOut', 0)
            
            # Scale filter
            scale_filter = f"[{input_index}]scale={int(scale_x*100)}:{int(scale_y*100)}[scaled{i}]"
            filters.append(scale_filter)
            
            # Fade filter (if needed)
            fade_filter = f"[scaled{i}]"
            if fade_in > 0 or fade_out > 0:
                fade_filter = f"[scaled{i}]fade=t=in:st={start_time}:d={fade_in}:alpha=1"
                if fade_out > 0:
                    fade_filter += f",fade=t=out:st={end_time-fade_out}:d={fade_out}:alpha=1"
                fade_filter += f"[faded{i}]"
                filters.append(fade_filter)
                overlay_input = f"faded{i}"
            else:
                overlay_input = f"scaled{i}"
            
            # Overlay filter
            next_layer = f"layer{i}"
            enable_condition = f"between(t,{start_time},{end_time})"
            overlay_filter = f"[{current_layer}][{overlay_input}]overlay={x}:{y}:enable='{enable_condition}'[{next_layer}]"
            filters.append(overlay_filter)
            
            current_layer = next_layer
        
        return ";".join(filters)
    
    def _cleanup_files(self, file_paths: List[str]):
        """Clean up temporary files."""
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                print(f"Warning: Could not delete temporary file {path}: {e}")
    
    def get_video_info(self, video_path: str) -> Dict:
        """Get video information using FFprobe."""
        
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"FFprobe failed: {result.stderr}")
        
        return json.loads(result.stdout)

# Example usage function that would be called by the render service
def render_video_with_overlays(video_path: str, overlays: List[Overlay], assets: List[ArtistAsset], settings: Dict) -> str:
    """High-level function to render a video with overlays."""
    
    renderer = FFmpegRenderer()
    
    # Prepare overlay data for FFmpeg
    overlays_data = []
    asset_map = {asset.id: asset for asset in assets}
    
    for overlay in overlays:
        asset = asset_map.get(overlay.asset_id)
        if not asset:
            continue
        
        overlay_data = {
            'id': overlay.id,
            'asset_path': asset.file_path,
            'format': asset.asset_type,
            'position': overlay.position_data,
            'timing': overlay.timing_data,
            'layer_order': overlay.layer_order
        }
        overlays_data.append(overlay_data)
    
    # Sort by layer order
    overlays_data.sort(key=lambda x: x['layer_order'])
    
    return renderer.render_collaboration(video_path, overlays_data, settings)