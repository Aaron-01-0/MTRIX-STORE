import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const SocialMediaManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({
    instagram_url: '',
    twitter_url: '',
    facebook_url: '',
    youtube_url: '',
    support_email: '',
    support_phone: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('support_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('support_settings')
        .update(settings)
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Social media links updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-mtrix-dark border-mtrix-gray">
      <CardHeader>
        <CardTitle className="text-gradient-gold">Social Media & Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Instagram URL</Label>
            <Input
              type="url"
              placeholder="https://instagram.com/mtrix"
              value={settings.instagram_url || ''}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <div>
            <Label>Twitter/X URL</Label>
            <Input
              type="url"
              placeholder="https://twitter.com/mtrix"
              value={settings.twitter_url || ''}
              onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <div>
            <Label>Facebook URL</Label>
            <Input
              type="url"
              placeholder="https://facebook.com/mtrix"
              value={settings.facebook_url || ''}
              onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <div>
            <Label>YouTube URL</Label>
            <Input
              type="url"
              placeholder="https://youtube.com/@mtrix"
              value={settings.youtube_url || ''}
              onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <div>
            <Label>Support Email</Label>
            <Input
              type="email"
              placeholder="support@mtrix.com"
              value={settings.support_email || ''}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <div>
            <Label>Support Phone</Label>
            <Input
              type="tel"
              placeholder="+91 1234567890"
              value={settings.support_phone || ''}
              onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
              className="bg-mtrix-black border-mtrix-gray"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-mtrix-black hover:shadow-gold"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SocialMediaManager;