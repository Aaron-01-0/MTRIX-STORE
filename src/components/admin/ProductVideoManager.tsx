import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Video, Play, ExternalLink, MoveUp, MoveDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type ProductVideo = Tables<'product_videos'>;

interface ProductVideoManagerProps {
  productId: string;
}

const ProductVideoManager = ({ productId }: ProductVideoManagerProps) => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const [newVideo, setNewVideo] = useState({
    video_url: '',
    video_type: 'youtube',
    title: '',
    description: '',
    thumbnail_url: '',
    display_order: 0
  });

  useEffect(() => {
    loadVideos();
  }, [productId]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_videos')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "Failed to load product videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingVideo(true);
    
    try {
      // Generate automatic filename: productId_timestamp.extension
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${productId}_${timestamp}.${extension}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-videos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(filename);

      // Add video to database
      const { data, error } = await supabase
        .from('product_videos')
        .insert([{
          product_id: productId,
          video_url: publicUrl,
          video_type: 'direct',
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: null,
          thumbnail_url: null,
          display_order: videos.length
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video uploaded successfully"
      });

      loadVideos();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload video",
        variant: "destructive"
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const addVideo = async () => {
    if (!newVideo.video_url) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_videos')
        .insert([{
          product_id: productId,
          video_url: newVideo.video_url,
          video_type: newVideo.video_type,
          title: newVideo.title || 'Product Video',
          description: newVideo.description || null,
          thumbnail_url: newVideo.thumbnail_url || null,
          display_order: newVideo.display_order || videos.length
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video added successfully"
      });

      setNewVideo({
        video_url: '',
        video_type: 'youtube',
        title: '',
        description: '',
        thumbnail_url: '',
        display_order: 0
      });

      loadVideos();
    } catch (error: any) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add video",
        variant: "destructive"
      });
    }
  };

  const updateVideo = async (videoId: string, updates: Partial<ProductVideo>) => {
    try {
      const { error } = await supabase
        .from('product_videos')
        .update(updates)
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video updated successfully"
      });

      loadVideos();
    } catch (error: any) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update video",
        variant: "destructive"
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      // Get the video to extract the storage path
      const video = videos.find(vid => vid.id === videoId);
      
      // Delete from database
      const { error } = await supabase
        .from('product_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Try to delete from storage if it's a storage URL
      if (video && video.video_url.includes('product-videos')) {
        const filename = video.video_url.split('/').pop();
        if (filename) {
          await supabase.storage
            .from('product-videos')
            .remove([filename]);
        }
      }

      toast({
        title: "Success",
        description: "Video deleted successfully"
      });

      loadVideos();
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const moveVideo = async (videoId: string, direction: 'up' | 'down') => {
    const currentVideo = videos.find(vid => vid.id === videoId);
    if (!currentVideo) return;

    const targetOrder = direction === 'up' 
      ? currentVideo.display_order - 1 
      : currentVideo.display_order + 1;

    const targetVideo = videos.find(vid => vid.display_order === targetOrder);
    if (!targetVideo) return;

    try {
      // Swap display orders
      await Promise.all([
        supabase
          .from('product_videos')
          .update({ display_order: targetOrder })
          .eq('id', videoId),
        supabase
          .from('product_videos')
          .update({ display_order: currentVideo.display_order })
          .eq('id', targetVideo.id)
      ]);

      loadVideos();
    } catch (error: any) {
      console.error('Error moving video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to move video",
        variant: "destructive"
      });
    }
  };

  const getVideoEmbedUrl = (url: string, type: string) => {
    if (type === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (type === 'vimeo') {
      const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  const getVideoThumbnail = (url: string, type: string) => {
    if (type === 'youtube') {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Video Section */}
      <Card className="bg-mtrix-black border-mtrix-gray">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Add New Video</h3>
          
          {/* File Upload */}
          <div className="mb-6">
            <Label htmlFor="video-upload" className="text-sm font-medium text-foreground">
              Upload Video File
            </Label>
            <div className="mt-2">
              <input
                id="video-upload"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-mtrix-black hover:file:bg-primary/80"
                disabled={uploadingVideo}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Max file size: 50MB. Supported formats: MP4, WebM, MOV
              </p>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-mtrix-gray" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-mtrix-black px-2 text-muted-foreground">Or add video URL</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">Video URL *</Label>
              <Input
                id="video_url"
                value={newVideo.video_url}
                onChange={(e) => setNewVideo(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                className="bg-mtrix-dark border-mtrix-gray"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="video_type">Video Type</Label>
              <Select
                value={newVideo.video_type}
                onValueChange={(value) => setNewVideo(prev => ({ ...prev, video_type: value }))}
              >
                <SelectTrigger className="bg-mtrix-dark border-mtrix-gray">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="direct">Direct Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newVideo.title}
                onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Video title"
                className="bg-mtrix-dark border-mtrix-gray"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnail_url"
                value={newVideo.thumbnail_url}
                onChange={(e) => setNewVideo(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="Custom thumbnail URL"
                className="bg-mtrix-dark border-mtrix-gray"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newVideo.description}
              onChange={(e) => setNewVideo(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Video description"
              className="bg-mtrix-dark border-mtrix-gray"
              rows={3}
            />
          </div>
          
          <div className="mt-4">
            <Button
              onClick={addVideo}
              className="bg-gradient-gold text-mtrix-black hover:shadow-gold"
              disabled={!newVideo.video_url}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video, index) => (
          <Card key={video.id} className="bg-mtrix-black border-mtrix-gray">
            <CardContent className="p-4">
              <div className="relative">
                {/* Video Preview */}
                <div className="w-full h-48 bg-mtrix-gray rounded-lg overflow-hidden">
                  {video.video_type === 'direct' ? (
                    <video
                      className="w-full h-full object-cover"
                      controls
                      poster={video.thumbnail_url || undefined}
                    >
                      <source src={video.video_url} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div
                      className="w-full h-full bg-cover bg-center flex items-center justify-center"
                      style={{
                        backgroundImage: `url(${
                          video.thumbnail_url || 
                          getVideoThumbnail(video.video_url, video.video_type) ||
                          '/api/placeholder/400/300'
                        })`
                      }}
                    >
                      <div className="bg-black/50 rounded-full p-3">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                <Badge className="absolute top-2 left-2 bg-purple-500 text-white">
                  {video.video_type.toUpperCase()}
                </Badge>
              </div>
              
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={video.title || ''}
                    onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray text-sm"
                    placeholder="Video title"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={video.description || ''}
                    onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                    className="bg-mtrix-dark border-mtrix-gray text-sm"
                    rows={2}
                    placeholder="Video description"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getVideoEmbedUrl(video.video_url, video.video_type), '_blank')}
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveVideo(video.id, 'up')}
                    disabled={index === 0}
                    className="text-xs"
                  >
                    <MoveUp className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => moveVideo(video.id, 'down')}
                    disabled={index === videos.length - 1}
                    className="text-xs"
                  >
                    <MoveDown className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteVideo(video.id)}
                    className="text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <Card className="bg-mtrix-black border-mtrix-gray">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-mtrix-gray rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Videos</h3>
              <p className="text-muted-foreground">
                Add some videos to showcase this product in action.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVideoManager;