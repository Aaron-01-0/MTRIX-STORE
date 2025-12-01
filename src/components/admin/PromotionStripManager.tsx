import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, MoveUp, MoveDown, Megaphone, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromotionStrip {
  id: string;
  text: string;
  display_order: number;
  is_active: boolean;
}

const PromotionStripManager = () => {
  const { toast } = useToast();
  const [strips, setStrips] = useState<PromotionStrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [globalEnabled, setGlobalEnabled] = useState(true);

  useEffect(() => {
    fetchStrips();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('brand_settings')
      .select('show_announcement_bar')
      .single();

    if (data) {
      setGlobalEnabled((data as any).show_announcement_bar ?? true);
    }
  };

  const toggleGlobal = async (checked: boolean) => {
    setGlobalEnabled(checked);
    try {
      // Check if settings exist first
      const { data: existing } = await supabase.from('brand_settings').select('id').single();

      if (existing) {
        await supabase
          .from('brand_settings')
          .update({ show_announcement_bar: checked } as any)
          .eq('id', existing.id);
      } else {
        // Create if doesn't exist (shouldn't happen usually but good fallback)
        await supabase
          .from('brand_settings')
          .insert({ show_announcement_bar: checked } as any);
      }

      toast({ title: 'Success', description: 'Global setting updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update setting', variant: 'destructive' });
      setGlobalEnabled(!checked); // Revert on error
    }
  };

  const fetchStrips = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_strips')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setStrips(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load promotion strips',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addStrip = async () => {
    if (!newText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter text',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('promotion_strips')
        .insert({
          text: newText,
          display_order: strips.length,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotion strip added'
      });
      setNewText('');
      fetchStrips();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deleteStrip = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const { error } = await supabase
        .from('promotion_strips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Promotion strip deleted'
      });
      fetchStrips();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete',
        variant: 'destructive'
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promotion_strips')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      fetchStrips();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update',
        variant: 'destructive'
      });
    }
  };

  const moveStrip = async (id: string, direction: 'up' | 'down') => {
    const currentStrip = strips.find(s => s.id === id);
    if (!currentStrip) return;

    const targetOrder = direction === 'up'
      ? currentStrip.display_order - 1
      : currentStrip.display_order + 1;

    const targetStrip = strips.find(s => s.display_order === targetOrder);
    if (!targetStrip) return;

    try {
      await Promise.all([
        supabase
          .from('promotion_strips')
          .update({ display_order: targetOrder })
          .eq('id', id),
        supabase
          .from('promotion_strips')
          .update({ display_order: currentStrip.display_order })
          .eq('id', targetStrip.id)
      ]);

      fetchStrips();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reorder',
        variant: 'destructive'
      });
    }
  };

  if (loading) return <div className="text-center py-8 animate-pulse text-muted-foreground">Loading promotions...</div>;

  return (
    <Card className="bg-mtrix-black border-mtrix-gray">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient-gold">
          <Megaphone className="w-5 h-5 text-primary" />
          Promotion Strip Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Toggle */}
        <div className="flex items-center justify-between p-4 bg-mtrix-dark rounded-lg border border-mtrix-gray">
          <div className="space-y-0.5">
            <Label className="text-base text-white">Show Announcement Bar</Label>
            <p className="text-sm text-muted-foreground">Globally show or hide the announcement bar on the site.</p>
          </div>
          <Switch
            checked={globalEnabled}
            onCheckedChange={toggleGlobal}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Add New Section */}
        <div className="flex gap-3 p-4 bg-mtrix-dark rounded-lg border border-mtrix-gray">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter new promotion text (e.g., 'SUMMER SALE: 50% OFF')"
            className="bg-black border-mtrix-gray focus:border-primary"
            maxLength={100}
          />
          <Button
            onClick={addStrip}
            className="bg-primary text-black hover:bg-white min-w-[100px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* List Section */}
        <div className="space-y-3">
          {strips.map((strip, index) => (
            <div
              key={strip.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-all duration-200",
                strip.is_active
                  ? "bg-mtrix-dark border-mtrix-gray hover:border-primary/30"
                  : "bg-black/40 border-mtrix-gray/50 opacity-60"
              )}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-white"
                    onClick={() => moveStrip(strip.id, 'up')}
                    disabled={index === 0}
                  >
                    <MoveUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-white"
                    onClick={() => moveStrip(strip.id, 'down')}
                    disabled={index === strips.length - 1}
                  >
                    <MoveDown className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white">{strip.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Order: {strip.display_order + 1}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${strip.id}`} className="text-xs text-muted-foreground">
                    {strip.is_active ? 'Active' : 'Hidden'}
                  </Label>
                  <Switch
                    id={`active-${strip.id}`}
                    checked={strip.is_active}
                    onCheckedChange={(checked) => toggleActive(strip.id, checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => deleteStrip(strip.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {strips.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-mtrix-gray rounded-lg">
              <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No active promotions. Add one above!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromotionStripManager;
