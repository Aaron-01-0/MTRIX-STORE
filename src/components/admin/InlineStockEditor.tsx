import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InlineStockEditorProps {
  productId: string;
  currentStock: number;
  onUpdate: () => void;
}

export const InlineStockEditor = ({ productId, currentStock, onUpdate }: InlineStockEditorProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [stock, setStock] = useState(currentStock.toString());
  const [reason, setReason] = useState<string>("adjustment");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (parseInt(stock) === currentStock) {
      setIsEditing(false);
      return;
    }

    if (parseInt(stock) < 0) {
      toast({
        title: "Error",
        description: "Stock quantity cannot be negative",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: parseInt(stock) })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Stock updated successfully (${reason})`
      });

      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive"
      });
      setStock(currentStock.toString());
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStock(currentStock.toString());
    setIsEditing(false);
  };

  if (!isEditing) {
    const isLowStock = currentStock <= 5;
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isLowStock ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          Stock: {currentStock}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6"
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="h-8 w-20 bg-mtrix-black border-mtrix-gray"
        disabled={saving}
        min="0"
      />
      <Select value={reason} onValueChange={setReason}>
        <SelectTrigger className="h-8 w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="adjustment">Adjustment</SelectItem>
          <SelectItem value="restock">Restock</SelectItem>
          <SelectItem value="return">Return</SelectItem>
          <SelectItem value="sale">Sale</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleSave}
        disabled={saving}
        className="h-6 w-6 text-green-500 hover:text-green-600"
      >
        <Check className="w-3 h-3" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleCancel}
        disabled={saving}
        className="h-6 w-6 text-red-500 hover:text-red-600"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
