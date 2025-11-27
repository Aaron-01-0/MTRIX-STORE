import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type BrandSettings = Tables<'brand_settings'>;

const BrandKitManager = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<BrandSettings>>({
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#ffd700',
        font_heading: 'Inter',
        font_body: 'Inter',
        logo_url: '',
        favicon_url: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('brand_settings')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setSettings(data);
        } catch (error: any) {
            console.error('Error fetching brand settings:', error);
            toast({
                title: "Error",
                description: "Failed to load brand settings.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const { data: existing } = await supabase
                .from('brand_settings')
                .select('id')
                .single();

            let error;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('brand_settings')
                    .update(settings)
                    .eq('id', existing.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('brand_settings')
                    .insert([settings]);
                error = insertError;
            }

            if (error) throw error;

            toast({
                title: "Success",
                description: "Brand kit updated successfully."
            });
        } catch (error: any) {
            console.error('Error saving brand settings:', error);
            toast({
                title: "Error",
                description: "Failed to save brand settings.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-orbitron font-bold text-gradient-gold">Brand Kit</h2>
                <p className="text-muted-foreground">Manage your brand's visual identity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-mtrix-dark border-mtrix-gray">
                    <CardHeader>
                        <CardTitle className="text-white">Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={settings.primary_color}
                                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                        className="w-12 h-10 p-1 bg-transparent border-white/10"
                                    />
                                    <Input
                                        value={settings.primary_color}
                                        onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                        className="bg-black/20 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={settings.secondary_color}
                                        onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                        className="w-12 h-10 p-1 bg-transparent border-white/10"
                                    />
                                    <Input
                                        value={settings.secondary_color}
                                        onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                                        className="bg-black/20 border-white/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Accent Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={settings.accent_color}
                                        onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                                        className="w-12 h-10 p-1 bg-transparent border-white/10"
                                    />
                                    <Input
                                        value={settings.accent_color}
                                        onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                                        className="bg-black/20 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-mtrix-dark border-mtrix-gray">
                    <CardHeader>
                        <CardTitle className="text-white">Typography</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Heading Font</Label>
                            <Input
                                value={settings.font_heading}
                                onChange={(e) => setSettings({ ...settings, font_heading: e.target.value })}
                                className="bg-black/20 border-white/10"
                                placeholder="e.g. Inter, Orbitron"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Body Font</Label>
                            <Input
                                value={settings.font_body}
                                onChange={(e) => setSettings({ ...settings, font_body: e.target.value })}
                                className="bg-black/20 border-white/10"
                                placeholder="e.g. Inter, Roboto"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-mtrix-dark border-mtrix-gray md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white">Assets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={settings.logo_url || ''}
                                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                                        className="bg-black/20 border-white/10"
                                        placeholder="https://..."
                                    />
                                    <Button variant="outline" size="icon">
                                        <Upload className="w-4 h-4" />
                                    </Button>
                                </div>
                                {settings.logo_url && (
                                    <div className="mt-2 p-4 bg-white/5 rounded-lg flex items-center justify-center">
                                        <img src={settings.logo_url} alt="Logo Preview" className="max-h-12 object-contain" />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Favicon URL</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={settings.favicon_url || ''}
                                        onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                                        className="bg-black/20 border-white/10"
                                        placeholder="https://..."
                                    />
                                    <Button variant="outline" size="icon">
                                        <Upload className="w-4 h-4" />
                                    </Button>
                                </div>
                                {settings.favicon_url && (
                                    <div className="mt-2 p-4 bg-white/5 rounded-lg flex items-center justify-center">
                                        <img src={settings.favicon_url} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-mtrix-black hover:shadow-gold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {/* Live Preview */}
            <div className="mt-8 p-6 rounded-xl border border-white/10" style={{
                backgroundColor: settings.secondary_color,
                color: settings.primary_color,
                fontFamily: settings.font_body
            }}>
                <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: settings.font_heading, color: settings.primary_color }}>
                    Live Preview
                </h3>
                <p className="mb-4">
                    This is how your brand colors and fonts will look.
                </p>
                <Button style={{
                    backgroundColor: settings.accent_color,
                    color: settings.primary_color
                }}>
                    Primary Button
                </Button>
            </div>
        </div>
    );
};

export default BrandKitManager;
