import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  display_order: number;
  is_active: boolean;
}

interface SupportSettings {
  id: string;
  support_email: string;
  support_phone: string;
  support_address?: string;
  privacy_policy?: string;
  terms_of_service?: string;
  cookie_policy?: string;
}

const SupportManager = () => {
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [settings, setSettings] = useState<SupportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaqDialog, setOpenFaqDialog] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: '',
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqsRes, settingsRes] = await Promise.all([
        supabase.from('faqs').select('*').order('display_order'),
        supabase.from('support_settings').select('*').single()
      ]);

      if (faqsRes.error) throw faqsRes.error;
      if (settingsRes.error && settingsRes.error.code !== 'PGRST116') throw settingsRes.error;

      setFaqs(faqsRes.data || []);
      setSettings(settingsRes.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('faqs').insert(faqForm);
      if (error) throw error;

      toast({ title: 'Success', description: 'FAQ created' });
      setOpenFaqDialog(false);
      setFaqForm({ question: '', answer: '', category: '', display_order: 0 });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const toggleFaq = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('faqs').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'FAQ updated' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update FAQ',
        variant: 'destructive'
      });
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'FAQ deleted' });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete FAQ',
        variant: 'destructive'
      });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('support_settings')
        .upsert(settings);

      if (error) throw error;
      toast({ title: 'Success', description: 'Settings saved' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Support & Legal</h2>
        <p className="text-muted-foreground">Manage FAQs, contact info, and legal policies.</p>
      </div>

      <Card className="bg-mtrix-dark border-mtrix-gray">
        <CardContent className="p-6">
          <Tabs defaultValue="contact">
            <TabsList className="bg-mtrix-black border border-mtrix-gray mb-6">
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
              <TabsTrigger value="policies">Policies</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-4">
              {settings && (
                <>
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      className="bg-mtrix-black border-mtrix-gray"
                    />
                  </div>
                  <div>
                    <Label>Support Phone</Label>
                    <Input
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                      className="bg-mtrix-black border-mtrix-gray"
                    />
                  </div>
                  <div>
                    <Label>Support Address</Label>
                    <Textarea
                      value={settings.support_address || ''}
                      onChange={(e) => setSettings({ ...settings, support_address: e.target.value })}
                      className="bg-mtrix-black border-mtrix-gray"
                    />
                  </div>
                  <Button onClick={saveSettings} className="bg-gradient-gold text-mtrix-black">
                    <Save className="w-4 h-4 mr-2" />
                    Save Contact Info
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="faqs">
              <div className="mb-4">
                <Dialog open={openFaqDialog} onOpenChange={setOpenFaqDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-gold text-mtrix-black">
                      <Plus className="w-4 h-4 mr-2" />
                      Add FAQ
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-mtrix-dark border-mtrix-gray">
                    <DialogHeader>
                      <DialogTitle className="text-gradient-gold">Create FAQ</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateFaq} className="space-y-4">
                      <div>
                        <Label>Question</Label>
                        <Input
                          value={faqForm.question}
                          onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                          required
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                      </div>
                      <div>
                        <Label>Answer</Label>
                        <Textarea
                          value={faqForm.answer}
                          onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                          required
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input
                          value={faqForm.category}
                          onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                          className="bg-mtrix-black border-mtrix-gray"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-gold text-mtrix-black">
                        Create FAQ
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="rounded-md border border-mtrix-gray">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell>{faq.question}</TableCell>
                        <TableCell>{faq.category || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={(checked) => toggleFaq(faq.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => deleteFaq(faq.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6">
              {settings && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Privacy Policy</Label>
                      <span className="text-xs text-muted-foreground">
                        {settings.privacy_policy?.length || 0} characters
                      </span>
                    </div>
                    <Textarea
                      value={settings.privacy_policy || ''}
                      onChange={(e) => setSettings({ ...settings, privacy_policy: e.target.value })}
                      rows={12}
                      placeholder="Enter your complete Privacy Policy here..."
                      className="font-mono text-sm bg-mtrix-black border-mtrix-gray"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Terms of Service</Label>
                      <span className="text-xs text-muted-foreground">
                        {settings.terms_of_service?.length || 0} characters
                      </span>
                    </div>
                    <Textarea
                      value={settings.terms_of_service || ''}
                      onChange={(e) => setSettings({ ...settings, terms_of_service: e.target.value })}
                      rows={12}
                      placeholder="Enter your Terms of Service here..."
                      className="font-mono text-sm bg-mtrix-black border-mtrix-gray"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Cookie Policy</Label>
                      <span className="text-xs text-muted-foreground">
                        {settings.cookie_policy?.length || 0} characters
                      </span>
                    </div>
                    <Textarea
                      value={settings.cookie_policy || ''}
                      onChange={(e) => setSettings({ ...settings, cookie_policy: e.target.value })}
                      rows={12}
                      placeholder="Enter your Cookie Policy here..."
                      className="font-mono text-sm bg-mtrix-black border-mtrix-gray"
                    />
                  </div>

                  <Button onClick={saveSettings} size="lg" className="bg-gradient-gold text-mtrix-black hover:opacity-90 w-full md:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    Save All Policies
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportManager;
