import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  notes: string | null;
  created_at: string;
}

export const useStockMovements = (productId: string) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchMovements();
    }
  }, [productId]);

  return { movements, loading, refetch: fetchMovements };
};
