import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  reorder_point: number;
  reorder_quantity: number | null;
  category_name: string | null;
  brand_name: string | null;
}

interface LowStockVariant {
  id: string;
  product_id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  sku: string | null;
  stock_quantity: number;
}

export const LowStockAlerts = () => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<LowStockVariant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);

      // Fetch low stock products
      const { data: products, error: productsError } = await supabase
        .rpc('get_low_stock_products');

      if (productsError) throw productsError;

      // Fetch low stock variants
      const { data: variants, error: variantsError } = await supabase
        .rpc('get_low_stock_variants');

      if (variantsError) throw variantsError;

      setLowStockProducts(products || []);
      setLowStockVariants(variants || []);
    } catch (error: any) {
      console.error("Error fetching low stock items:", error);
      toast.error("Failed to fetch low stock items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  if (loading) {
    return <div>Loading low stock alerts...</div>;
  }

  const totalLowStockItems = lowStockProducts.length + lowStockVariants.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Low Stock Alerts</CardTitle>
          </div>
          <CardDescription>
            {totalLowStockItems} item(s) need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalLowStockItems === 0 ? (
            <p className="text-muted-foreground">No low stock items at the moment</p>
          ) : (
            <div className="space-y-6">
              {lowStockProducts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Products ({lowStockProducts.length})</h3>
                  <div className="space-y-2">
                    {lowStockProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku}
                            {product.category_name && ` • ${product.category_name}`}
                            {product.brand_name && ` • ${product.brand_name}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">
                            {product.stock_quantity} in stock
                          </Badge>
                          {product.reorder_quantity && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reorder: {product.reorder_quantity} units
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lowStockVariants.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Variants ({lowStockVariants.length})</h3>
                  <div className="space-y-2">
                    {lowStockVariants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{variant.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {variant.color && `Color: ${variant.color}`}
                            {variant.color && variant.size && " • "}
                            {variant.size && `Size: ${variant.size}`}
                            {variant.sku && ` • SKU: ${variant.sku}`}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {variant.stock_quantity} in stock
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
