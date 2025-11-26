import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, Star, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStorageUpload } from '@/hooks/useStorageUpload';

const DesignManager = () => {
  const { toast } = useToast();
  const { uploadFile } = useStorageUpload();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    final_design_file: null as File | null,
    price: ''
  });

  useEffect(() => {
    fetchDesigns();
  }, [filterStatus]);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('design_submissions')
        .select(`
          *,
          products(name, sku)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
      toast({
        title: "Error",
        description: "Failed to load designs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (designId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('design_submissions')
        .update({ status })
        .eq('id', designId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Design ${status} successfully`
      });

      fetchDesigns();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (designId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('design_submissions')
        .update({ is_featured: !currentFeatured })
        .eq('id', designId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Design ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`
      });

      fetchDesigns();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle featured",
        variant: "destructive"
      });
    }
  };

  const deleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const { error } = await supabase
        .from('design_submissions')
        .delete()
        .eq('id', designId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Design deleted successfully"
      });

      fetchDesigns();
    } catch (error: any) {
      console.error('Error deleting design:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete design",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: "Error",
        description: "Failed to download design",
        variant: "destructive"
      });
    }
  };

  const handleCompleteDesign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDesign || !completeForm.final_design_file) {
      toast({
        title: "Error",
        description: "Please upload the final design file",
        variant: "destructive"
      });
      return;
    }

    try {
      const fileUrl = await uploadFile(completeForm.final_design_file, {
        bucket: 'design-submissions',
        folder: `completed/${selectedDesign.user_id}`
      });

      if (!fileUrl) throw new Error('Failed to upload file');

      const { error: customProductError } = await supabase
        .from('custom_products')
        .insert({
          design_submission_id: selectedDesign.id,
          user_id: selectedDesign.user_id,
          product_id: selectedDesign.product_id || null,
          final_design_url: fileUrl,
          price: parseFloat(completeForm.price)
        });

      if (customProductError) throw customProductError;

      const { error: statusError } = await supabase
        .from('design_submissions')
        .update({ status: 'completed' })
        .eq('id', selectedDesign.id);

      if (statusError) throw statusError;

      toast({
        title: "Success",
        description: "Custom product created successfully! User can now order it."
      });

      setShowCompleteDialog(false);
      setSelectedDesign(null);
      setCompleteForm({ final_design_file: null, price: '' });
      fetchDesigns();
    } catch (error: any) {
      console.error('Error completing design:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete design",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Design Submissions</h2>
          <p className="text-muted-foreground">Manage user-submitted designs and custom products.</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-mtrix-dark border-mtrix-gray">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Designs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Designs Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading designs...</p>
        </div>
      ) : designs.length === 0 ? (
        <Card className="bg-mtrix-dark border-mtrix-gray">
          <CardContent className="py-12 text-center text-muted-foreground">
            No designs found matching your filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => (
            <Card key={design.id} className="bg-mtrix-dark border-mtrix-gray overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={design.design_url}
                  alt={design.title}
                  className="w-full h-full object-cover"
                />
                {design.is_featured && (
                  <Badge className="absolute top-3 right-3 bg-primary text-mtrix-black">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge className={`absolute top-3 left-3 ${design.status === 'approved' ? 'bg-green-500' :
                  design.status === 'rejected' ? 'bg-red-500' :
                    design.status === 'completed' ? 'bg-blue-500' :
                      'bg-yellow-500'
                  } text-white`}>
                  {design.status}
                </Badge>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-white">{design.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {design.description}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Product: {design.products?.name || 'N/A'}</div>
                  <div>SKU: {design.products?.sku || 'N/A'}</div>
                  <div>Votes: {design.votes_count || 0}</div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-mtrix-gray">
                  {design.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(design.id, 'approved')}
                        className="flex-1 border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(design.id, 'rejected')}
                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {design.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDesign(design);
                        setShowCompleteDialog(true);
                      }}
                      className="flex-1 border-blue-500/50 text-blue-500 hover:bg-blue-500 hover:text-white"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(design.id, design.is_featured)}
                    className="border-mtrix-gray text-muted-foreground hover:text-white hover:bg-mtrix-gray"
                  >
                    <Star className={`w-3 h-3 ${design.is_featured ? 'fill-current text-yellow-500' : ''}`} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(design.design_url, design.title)}
                    className="border-mtrix-gray text-muted-foreground hover:text-white hover:bg-mtrix-gray"
                  >
                    <Download className="w-3 h-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDesign(design.id)}
                    className="border-mtrix-gray text-muted-foreground hover:text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Design Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-mtrix-dark border-mtrix-gray">
          <DialogHeader>
            <DialogTitle className="text-gradient-gold">Complete Design</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCompleteDesign} className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Final Design</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCompleteForm(prev => ({
                  ...prev,
                  final_design_file: e.target.files?.[0] || null
                }))}
                className="bg-mtrix-black border-mtrix-gray"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                step="0.01"
                value={completeForm.price}
                onChange={(e) => setCompleteForm(prev => ({ ...prev, price: e.target.value }))}
                className="bg-mtrix-black border-mtrix-gray"
                placeholder="Enter product price"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold"
            >
              Create Custom Product
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesignManager;
