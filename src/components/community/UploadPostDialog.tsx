import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';

interface UploadPostDialogProps {
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

const UploadPostDialog = ({ onSuccess, trigger }: UploadPostDialogProps) => {
    const [open, setOpen] = useState(false);
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { uploadFile, uploading } = useStorageUpload();
    const { user } = useAuth();
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to post.",
                variant: "destructive"
            });
            return;
        }

        if (!file) {
            toast({
                title: "Error",
                description: "Please select an image to upload.",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);
        try {
            console.log('Starting upload for user:', user.id);

            // 1. Upload Image
            const imageUrl = await uploadFile(file, {
                bucket: 'community-content',
                folder: user.id
            });

            if (!imageUrl) {
                throw new Error('Failed to upload image. Please check your internet connection or try a smaller file.');
            }

            console.log('Image uploaded successfully:', imageUrl);

            // 2. Create Post
            const { error } = await supabase
                .from('community_posts')
                .insert({
                    user_id: user.id,
                    image_url: imageUrl,
                    caption: caption.trim() || null,
                    status: 'pending'
                });

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            toast({
                title: "Post Submitted!",
                description: "Your post is pending approval. It will appear in the feed once reviewed.",
            });

            setOpen(false);
            setCaption('');
            setFile(null);
            setPreviewUrl(null);
            onSuccess?.();

        } catch (error: any) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create post. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                        <Upload className="w-4 h-4" />
                        Share Your Look
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-black/90 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Join the Movement
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            {previewUrl ? (
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setFile(null);
                                                setPreviewUrl(null);
                                            }}
                                        >
                                            Change Image
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Label
                                    htmlFor="image-upload"
                                    className="w-full aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white">Click to upload</p>
                                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                                    </div>
                                </Label>
                            )}
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="caption">Caption (Optional)</Label>
                            <Textarea
                                id="caption"
                                placeholder="Tell us about your fit..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="bg-white/5 border-white/10 min-h-[100px] resize-none focus:border-primary/50"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-black font-bold"
                        disabled={!file || submitting || uploading}
                    >
                        {(submitting || uploading) ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Post to Community'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UploadPostDialog;
