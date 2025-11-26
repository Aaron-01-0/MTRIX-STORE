import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SiteSettingsManager = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>({
        support_email: '',
        support_phone: '',
        support_address: '',
        privacy_policy: '',
        terms_of_service: '',
        cookie_policy: ''
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
                description: "Site settings updated successfully"
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

    const handleChange = (field: string, value: string) => {
        setSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Site Settings</h2>
                <p className="text-muted-foreground">Manage global site configuration and legal content.</p>
            </div>

            <Card className="bg-mtrix-dark border-mtrix-gray">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-mtrix-gray pb-2">Shipping Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Standard Shipping Cost (₹)</Label>
                                    <Input
                                        type="number"
                                        value={settings.shipping_cost || ''}
                                        onChange={(e) => handleChange('shipping_cost', e.target.value)}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Free Shipping Threshold (₹)</Label>
                                    <Input
                                        type="number"
                                        value={settings.free_shipping_threshold || ''}
                                        onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                    <p className="text-xs text-muted-foreground">Orders above this amount get free shipping.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-mtrix-gray pb-2">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Support Email</Label>
                                    <Input
                                        type="email"
                                        value={settings.support_email || ''}
                                        onChange={(e) => handleChange('support_email', e.target.value)}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Support Phone</Label>
                                    <Input
                                        type="tel"
                                        value={settings.support_phone || ''}
                                        onChange={(e) => handleChange('support_phone', e.target.value)}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Physical Address</Label>
                                <Textarea
                                    value={settings.support_address || ''}
                                    onChange={(e) => handleChange('support_address', e.target.value)}
                                    className="bg-mtrix-black border-mtrix-gray"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-mtrix-gray pb-2">Legal Pages Content</h3>

                            <div className="space-y-2">
                                <Label>Privacy Policy</Label>
                                <Textarea
                                    value={settings.privacy_policy || ''}
                                    onChange={(e) => handleChange('privacy_policy', e.target.value)}
                                    className="bg-mtrix-black border-mtrix-gray font-mono text-sm"
                                    rows={6}
                                    placeholder="Markdown or HTML content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Terms of Service</Label>
                                <Textarea
                                    value={settings.terms_of_service || ''}
                                    onChange={(e) => handleChange('terms_of_service', e.target.value)}
                                    className="bg-mtrix-black border-mtrix-gray font-mono text-sm"
                                    rows={6}
                                    placeholder="Markdown or HTML content..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Cookie Policy</Label>
                                <Textarea
                                    value={settings.cookie_policy || ''}
                                    onChange={(e) => handleChange('cookie_policy', e.target.value)}
                                    className="bg-mtrix-black border-mtrix-gray font-mono text-sm"
                                    rows={6}
                                    placeholder="Markdown or HTML content..."
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto bg-gradient-gold text-mtrix-black hover:shadow-gold"
                        >
                            {loading ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SiteSettingsManager;
