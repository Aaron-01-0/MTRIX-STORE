import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Heart, TrendingUp, Award, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStorageUpload } from '@/hooks/useStorageUpload';

const FlexDesign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading } = useStorageUpload();
  
  const [designs, setDesigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category_id: '',
    design_file: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [designsRes, categoriesRes] = await Promise.all([
        supabase
          .from('design_submissions')
          .select(`
            *,
            categories(name),
            profiles(name)
          `)
          .eq('status', 'approved')
          .order('votes_count', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true)
      ]);

      setDesigns(designsRes.data || []);
      setProducts(categoriesRes.data || []);

      if (user) {
        const { data: votes } = await supabase
          .from('design_votes')
          .select('design_id')
          .eq('user_id', user.id);
        
        setUserVotes(new Set(votes?.map(v => v.design_id) || []));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (designId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on designs",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      if (userVotes.has(designId)) {
        await supabase
          .from('design_votes')
          .delete()
          .eq('design_id', designId)
          .eq('user_id', user.id);
        
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(designId);
          return newSet;
        });
      } else {
        await supabase
          .from('design_votes')
          .insert({ design_id: designId, user_id: user.id });
        
        setUserVotes(prev => new Set(prev).add(designId));
      }
      
      fetchData();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to vote",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload designs",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!uploadForm.design_file) {
      toast({
        title: "Error",
        description: "Please select a design file",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileUrl = await uploadFile(uploadForm.design_file, {
        bucket: 'design-submissions',
        folder: user.id
      });

      if (!fileUrl) throw new Error('Failed to upload file');

      const { error } = await supabase
        .from('design_submissions')
        .insert({
          user_id: user.id,
          category_id: uploadForm.category_id,
          design_url: fileUrl,
          title: uploadForm.title,
          description: uploadForm.description
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Design submitted successfully! It will be reviewed by our team."
      });

      setShowUploadDialog(false);
      setUploadForm({
        title: '',
        description: '',
        category_id: '',
        design_file: null
      });
      fetchData();
    } catch (error: any) {
      console.error('Error uploading design:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload design",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-16 px-6 bg-gradient-dark">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl font-orbitron font-bold text-gradient-gold mb-4">
              Flex Your Design
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Show off your creativity! Upload your custom designs for MTRIX products, 
              get votes from the community, and turn your ideas into reality.
            </p>
            
            {user && (
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Design
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="max-w-2xl bg-mtrix-dark border-mtrix-gray">
                  <DialogHeader>
                    <DialogTitle className="text-gradient-gold">Upload Your Design</DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleUpload} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Design Title</Label>
                      <Input
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Give your design a catchy name"
                        className="bg-mtrix-black border-mtrix-gray"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={uploadForm.category_id}
                        onValueChange={(value) => setUploadForm(prev => ({ ...prev, category_id: value }))}
                        required
                      >
                        <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your design inspiration"
                        className="bg-mtrix-black border-mtrix-gray"
                        rows={4}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Design File</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUploadForm(prev => ({ ...prev, design_file: e.target.files?.[0] || null }))}
                        className="bg-mtrix-black border-mtrix-gray"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload high-quality images (PNG, JPG, or SVG)
                      </p>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Submit Design'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </section>

        {/* Designs Gallery */}
        <section className="py-16 px-6">
          <div className="container mx-auto">
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
                <TabsTrigger value="trending">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="featured">
                  <Award className="w-4 h-4 mr-2" />
                  Featured
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trending">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {loading ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">Loading designs...</p>
                    </div>
                  ) : designs.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No designs yet. Be the first to upload!</p>
                    </div>
                  ) : (
                    designs.map((design) => (
                      <Card key={design.id} className="bg-mtrix-dark border-mtrix-gray overflow-hidden group">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={design.design_url}
                            alt={design.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {design.is_featured && (
                            <Badge className="absolute top-3 right-3 bg-primary text-mtrix-black">
                              <Award className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {design.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {design.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>by {design.profiles?.name || 'Anonymous'}</span>
                            <span>{design.categories?.name}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-mtrix-gray">
                            <div className="flex items-center gap-2">
                              <Button
                                variant={userVotes.has(design.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVote(design.id)}
                                className={userVotes.has(design.id) ? "bg-gradient-gold text-mtrix-black" : ""}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${userVotes.has(design.id) ? 'fill-current' : ''}`} />
                                {design.votes_count}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="featured">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {designs
                    .filter(d => d.is_featured)
                    .map((design) => (
                      <Card key={design.id} className="bg-mtrix-dark border-primary overflow-hidden group">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={design.design_url}
                            alt={design.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                              {design.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {design.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>by {design.profiles?.name || 'Anonymous'}</span>
                            <span>{design.categories?.name}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t border-mtrix-gray">
                            <div className="flex items-center gap-2">
                              <Button
                                variant={userVotes.has(design.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleVote(design.id)}
                                className={userVotes.has(design.id) ? "bg-gradient-gold text-mtrix-black" : ""}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${userVotes.has(design.id) ? 'fill-current' : ''}`} />
                                {design.votes_count}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FlexDesign;
