import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const submissionSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    category: z.string().min(1, "Please select a category"),
    tags: z.string().optional(), // Comma separated
});

type SubmissionForm = z.infer<typeof submissionSchema>;

const ArenaSubmit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [mainImage, setMainImage] = useState<File | null>(null);
    const [mockupImage, setMockupImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<SubmissionForm>({
        resolver: zodResolver(submissionSchema)
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'mockup') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max file size is 5MB", variant: "destructive" });
            return;
        }

        if (type === 'main') {
            setMainImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setMockupImage(file);
        }
    };

    const uploadFile = async (file: File, path: string) => {
        const { data, error } = await supabase.storage
            .from('arena-designs')
            .upload(path, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('arena-designs')
            .getPublicUrl(path);

        return publicUrl;
    };

    const onSubmit = async (data: SubmissionForm) => {
        if (!user) {
            toast({ title: "Authentication Required", description: "Please login to submit a design", variant: "destructive" });
            return;
        }
        if (!mainImage) {
            toast({ title: "Image Required", description: "Please upload your main design image", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            const timestamp = Date.now();
            const mainPath = `${user.id}/${timestamp}_main_${mainImage.name}`;
            const mainUrl = await uploadFile(mainImage, mainPath);

            let mockupUrl = null;
            if (mockupImage) {
                const mockupPath = `${user.id}/${timestamp}_mockup_${mockupImage.name}`;
                mockupUrl = await uploadFile(mockupImage, mockupPath);
            }

            const { error } = await supabase.from('arena_designs').insert({
                user_id: user.id,
                title: data.title,
                description: data.description,
                category: data.category,
                tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
                image_url: mainUrl,
                mockup_url: mockupUrl,
                status: 'submitted' // Needs moderation
            });

            if (error) throw error;

            toast({
                title: "Design Submitted!",
                description: "Your design is under review. Good luck!",
            });
            navigate('/arena/lobby');

        } catch (error: any) {
            console.error('Submission error:', error);
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white font-inter">
            <Navbar />

            <div className="container mx-auto px-4 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto"
                >
                    <h1 className="text-4xl font-orbitron font-bold mb-2">Submit Your Design</h1>
                    <p className="text-gray-400 mb-8">Enter the arena and compete for glory.</p>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Image Upload */}
                        <div className="space-y-4">
                            <Label>Design Asset (Required)</Label>
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(e, 'main')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {previewUrl ? (
                                    <div className="relative aspect-video max-h-64 mx-auto overflow-hidden rounded-lg">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-white font-medium">Click to change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Upload className="w-8 h-8" />
                                        <p>Drag & drop or click to upload</p>
                                        <p className="text-xs">PNG, JPG up to 5MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Cyber Samurai"
                                    className="bg-white/5 border-white/10"
                                    {...register('title')}
                                />
                                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select onValueChange={(val) => register('category').onChange({ target: { value: val, name: 'category' } })}>
                                    <SelectTrigger className="bg-white/5 border-white/10">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                                        <SelectItem value="Hoodie">Hoodie</SelectItem>
                                        <SelectItem value="Accessory">Accessory</SelectItem>
                                        <SelectItem value="Digital Art">Digital Art</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Tell us about your design..."
                                    className="bg-white/5 border-white/10 min-h-[100px]"
                                    {...register('description')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags (Comma separated)</Label>
                                <Input
                                    id="tags"
                                    placeholder="cyberpunk, neon, anime"
                                    className="bg-white/5 border-white/10"
                                    {...register('tags')}
                                />
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
                                <input
                                    type="checkbox"
                                    required
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label className="text-sm text-gray-400">
                                    I agree to the <Link to="/arena/rules" target="_blank" className="text-purple-400 hover:text-purple-300 underline">Arena Terms & Conditions</Link>.
                                    I confirm this is my original work and does not violate any content policies.
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={uploading}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 font-bold tracking-wide text-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    UPLOADING...
                                </>
                            ) : (
                                'SUBMIT TO ARENA'
                            )}
                        </Button>
                    </form>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default ArenaSubmit;
