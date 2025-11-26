import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DropProductManagerProps {
    dropId: string;
}

const DropProductManager = ({ dropId }: DropProductManagerProps) => {
    const { toast } = useToast();
    const [dropProducts, setDropProducts] = useState<any[]>([]);
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newProduct, setNewProduct] = useState({
        product_id: '',
        price: '',
        stock_allocation: '',
        max_per_customer: '1',
        is_featured: false
    });

    useEffect(() => {
        loadData();
    }, [dropId]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Fetch products currently in this drop
            const { data: currentProducts, error: currentError } = await supabase
                .from('drop_products')
                .select(`
                    *,
                    products (
                        name,
                        sku,
                        base_price
                    )
                `)
                .eq('drop_id', dropId);

            if (currentError) throw currentError;
            setDropProducts(currentProducts || []);

            // Fetch all available products for selection
            const { data: allProducts, error: productsError } = await supabase
                .from('products')
                .select('id, name, sku, base_price')
                .eq('is_active', true);

            if (productsError) throw productsError;
            setAvailableProducts(allProducts || []);

        } catch (error: any) {
            console.error('Error loading drop products:', error);
            toast({
                title: "Error",
                description: "Failed to load products",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async () => {
        try {
            if (!newProduct.product_id || !newProduct.price || !newProduct.stock_allocation) {
                toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive"
                });
                return;
            }

            const { error } = await supabase
                .from('drop_products')
                .insert([{
                    drop_id: dropId,
                    product_id: newProduct.product_id,
                    price: parseFloat(newProduct.price),
                    stock_allocation: parseInt(newProduct.stock_allocation),
                    max_per_customer: parseInt(newProduct.max_per_customer),
                    is_featured: newProduct.is_featured
                }]);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Product added to drop"
            });
            setShowAddDialog(false);
            setNewProduct({
                product_id: '',
                price: '',
                stock_allocation: '',
                max_per_customer: '1',
                is_featured: false
            });
            loadData();
        } catch (error: any) {
            console.error('Error adding product to drop:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to add product",
                variant: "destructive"
            });
        }
    };

    const handleRemoveProduct = async (id: string) => {
        if (!confirm('Are you sure you want to remove this product from the drop?')) return;

        try {
            const { error } = await supabase
                .from('drop_products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Product removed from drop"
            });
            loadData();
        } catch (error: any) {
            console.error('Error removing product:', error);
            toast({
                title: "Error",
                description: "Failed to remove product",
                variant: "destructive"
            });
        }
    };

    const handleProductSelect = (productId: string) => {
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
            setNewProduct(prev => ({
                ...prev,
                product_id: productId,
                price: product.base_price.toString()
            }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gradient-gold">Drop Products</h3>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-primary text-mtrix-black">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-mtrix-dark border-mtrix-gray">
                        <DialogHeader>
                            <DialogTitle>Add Product to Drop</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Product</Label>
                                <Select
                                    value={newProduct.product_id}
                                    onValueChange={handleProductSelect}
                                >
                                    <SelectTrigger className="bg-mtrix-black border-mtrix-gray">
                                        <SelectValue placeholder="Select a product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableProducts.map(product => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} ({product.sku})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Drop Price (₹)</Label>
                                    <Input
                                        type="number"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Stock Allocation</Label>
                                    <Input
                                        type="number"
                                        value={newProduct.stock_allocation}
                                        onChange={e => setNewProduct({ ...newProduct, stock_allocation: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Per Customer</Label>
                                    <Input
                                        type="number"
                                        value={newProduct.max_per_customer}
                                        onChange={e => setNewProduct({ ...newProduct, max_per_customer: e.target.value })}
                                        className="bg-mtrix-black border-mtrix-gray"
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddProduct} className="w-full bg-primary text-mtrix-black">
                                Add to Drop
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-mtrix-gray">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Allocation</TableHead>
                            <TableHead>Reserved</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : dropProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">No products in this drop</TableCell>
                            </TableRow>
                        ) : (
                            dropProducts.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.products?.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.products?.sku}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>₹{item.price}</TableCell>
                                    <TableCell>{item.stock_allocation}</TableCell>
                                    <TableCell>{item.reserved_stock}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveProduct(item.id)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default DropProductManager;
