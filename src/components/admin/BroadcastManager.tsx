import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Megaphone, History, Eye, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { generateEmailHtml, EmailTemplateType, EmailTemplateData } from '@/lib/EmailTemplates';

type Announcement = Tables<'announcements'>;
type Broadcast = Tables<'broadcasts'>;

const BroadcastManager = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Announcement State
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [isActive, setIsActive] = useState(false);

    // Broadcast State
    const [subject, setSubject] = useState('');
    const [broadcastHistory, setBroadcastHistory] = useState<Broadcast[]>([]);

    // Template State
    const [templateType, setTemplateType] = useState<EmailTemplateType>('minimal');
    const [templateData, setTemplateData] = useState<EmailTemplateData>({
        title: '',
        body: '',
        ctaText: 'Shop Now',
        ctaLink: 'https://mtrix.store',
        heroImage: ''
    });
    const [customHtml, setCustomHtml] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');

    useEffect(() => {
        fetchAnnouncement();
        fetchHistory();
    }, []);

    useEffect(() => {
        updatePreview();
    }, [templateType, templateData, customHtml]);

    const updatePreview = () => {
        if (templateType === 'custom') {
            setPreviewHtml(customHtml);
        } else {
            setPreviewHtml(generateEmailHtml(templateType, templateData));
        }
    };

    const fetchAnnouncement = async () => {
        // 1. Try to find the currently active announcement
        const { data: activeData } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (activeData) {
            setAnnouncement(activeData);
            setMessage(activeData.message);
            setLink(activeData.link || '');
            setIsActive(true);
            return;
        }

        // 2. If no active one, get the latest inactive one (draft/history)
        const { data } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data) {
            setAnnouncement(data);
            setMessage(data.message);
            setLink(data.link || '');
            setIsActive(data.is_active || false);
        }
    };

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('broadcasts')
            .select('*')
            .order('sent_at', { ascending: false });

        if (data) setBroadcastHistory(data);
    };

    const saveAnnouncement = async () => {
        setLoading(true);
        try {
            // Deactivate all others first if activating this one
            if (isActive) {
                await supabase.from('announcements').update({ is_active: false }).neq('id', announcement?.id || 'placeholder');
            }

            const payload = {
                message,
                link,
                is_active: isActive,
                type: 'info'
            };

            let error;
            if (announcement?.id) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('announcements')
                    .update(payload)
                    .eq('id', announcement.id);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('announcements')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast({ title: "Success", description: "Announcement updated" });
            fetchAnnouncement();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const deleteAnnouncement = async () => {
        if (!announcement?.id) return;
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcement.id);

            if (error) throw error;

            toast({ title: "Success", description: "Announcement deleted" });
            setAnnouncement(null);
            setMessage('');
            setLink('');
            setIsActive(false);
            // Optionally fetch previous one? For now, just clear.
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const sendBroadcast = async () => {
        if (!confirm("Are you sure you want to send this email to ALL subscribers?")) return;

        setLoading(true);
        try {
            const finalContent = templateType === 'custom' ? customHtml : generateEmailHtml(templateType, templateData);

            const { data, error } = await supabase.functions.invoke('send-broadcast', {
                body: { subject, content: finalContent }
            });

            if (error) throw error;

            toast({ title: "Success", description: "Broadcast sent successfully" });
            setSubject('');
            // Reset form
            setTemplateData({ title: '', body: '', ctaText: 'Shop Now', ctaLink: 'https://mtrix.store', heroImage: '' });
            setCustomHtml('');
            fetchHistory();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gradient-gold">Broadcast System</h2>
                <p className="text-muted-foreground">Manage site announcements and email blasts.</p>
            </div>

            <Tabs defaultValue="announcement" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="announcement">Site Banner</TabsTrigger>
                    <TabsTrigger value="email">Email Broadcast</TabsTrigger>
                </TabsList>

                <TabsContent value="announcement">
                    <Card className="bg-mtrix-dark border-mtrix-gray">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-primary" />
                                Global Announcement Bar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g. FLASH SALE: 50% OFF EVERYTHING"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Link (Optional)</Label>
                                <Input
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    placeholder="/promotions"
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    id="active-mode"
                                />
                                <Label htmlFor="active-mode">Active (Visible on Site)</Label>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <Button onClick={saveAnnouncement} disabled={loading} className="flex-1 bg-primary text-black hover:bg-white">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <SaveIcon className="w-4 h-4 mr-2" />}
                                        Update Banner
                                    </Button>
                                    {announcement?.id && (
                                        <Button onClick={deleteAnnouncement} disabled={loading} variant="destructive" className="px-3">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (!confirm("This will delete ALL active announcements from the database. Are you sure?")) return;
                                        setLoading(true);
                                        try {
                                            const { error } = await supabase.from('announcements').delete().eq('is_active', true);
                                            if (error) throw error;
                                            toast({ title: "Success", description: "All active announcements deleted" });
                                            setAnnouncement(null);
                                            setMessage('');
                                            setLink('');
                                            setIsActive(false);
                                        } catch (e: any) {
                                            toast({ title: "Error", description: e.message, variant: "destructive" });
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    variant="outline"
                                    className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                                >
                                    Force Delete All Active
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <Card className="bg-mtrix-dark border-mtrix-gray">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Send className="w-5 h-5 text-primary" />
                                        Compose Email
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Subject Line</Label>
                                        <Input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Subject..."
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Template</Label>
                                        <Select defaultValue="minimal" onValueChange={(v) => setTemplateType(v as EmailTemplateType)}>
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue placeholder="Select template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="minimal">Minimal (Text Focus)</SelectItem>
                                                <SelectItem value="showcase">Product Showcase (Image Focus)</SelectItem>
                                                <SelectItem value="newsletter">Newsletter (Structured)</SelectItem>
                                                <SelectItem value="custom">Custom HTML</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {templateType === 'custom' ? (
                                        <div className="space-y-2">
                                            <Label>HTML Content</Label>
                                            <Textarea
                                                value={customHtml}
                                                onChange={(e) => setCustomHtml(e.target.value)}
                                                placeholder="<h1>Hello World</h1>"
                                                className="min-h-[300px] font-mono text-sm bg-black/20 border-white/10"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4 border-t border-white/10 pt-4">
                                            <div className="space-y-2">
                                                <Label>Title / Heading</Label>
                                                <Input
                                                    value={templateData.title}
                                                    onChange={(e) => setTemplateData({ ...templateData, title: e.target.value })}
                                                    className="bg-black/20 border-white/10"
                                                />
                                            </div>

                                            {(templateType === 'showcase' || templateType === 'newsletter') && (
                                                <div className="space-y-2">
                                                    <Label>Hero Image URL</Label>
                                                    <Input
                                                        value={templateData.heroImage}
                                                        onChange={(e) => setTemplateData({ ...templateData, heroImage: e.target.value })}
                                                        className="bg-black/20 border-white/10"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Body Text</Label>
                                                <Textarea
                                                    value={templateData.body}
                                                    onChange={(e) => setTemplateData({ ...templateData, body: e.target.value })}
                                                    className="min-h-[100px] bg-black/20 border-white/10"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>CTA Text</Label>
                                                    <Input
                                                        value={templateData.ctaText}
                                                        onChange={(e) => setTemplateData({ ...templateData, ctaText: e.target.value })}
                                                        className="bg-black/20 border-white/10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>CTA Link</Label>
                                                    <Input
                                                        value={templateData.ctaLink}
                                                        onChange={(e) => setTemplateData({ ...templateData, ctaLink: e.target.value })}
                                                        className="bg-black/20 border-white/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <Button onClick={sendBroadcast} disabled={loading || !subject} className="w-full bg-primary text-black hover:bg-white mt-4">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                        Send Broadcast
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-mtrix-dark border-mtrix-gray">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="w-5 h-5 text-primary" />
                                        History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                        {broadcastHistory.map((item) => (
                                            <div key={item.id} className="p-4 rounded-lg border border-white/10 bg-black/20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-white">{item.subject}</h4>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(item.sent_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>Sent to: {item.recipient_count}</span>
                                                    <span className={item.status === 'sent' ? 'text-green-500' : 'text-red-500'}>
                                                        {item.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {broadcastHistory.length === 0 && (
                                            <p className="text-center text-muted-foreground py-8">No broadcasts sent yet.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Live Preview */}
                        <div className="space-y-6">
                            <Card className="bg-mtrix-dark border-mtrix-gray h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-primary" />
                                        Live Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 bg-white/5 p-4 rounded-b-xl overflow-hidden">
                                    <div className="bg-white rounded-md h-full w-full overflow-auto p-4 min-h-[600px]">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
                                            className="preview-content"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

function SaveIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    )
}

export default BroadcastManager;
