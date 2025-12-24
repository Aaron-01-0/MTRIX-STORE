import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Plus, Trash2, Check, ChevronsUpDown, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useProducts } from '@/hooks/useProducts';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  allowed_emails?: string[];
  restricted_products?: string[];
  restricted_categories?: string[];
}

interface Category {
  id: string;
  name: string;
}

const CouponManager = () => {
  const { toast } = useToast();
  const { products } = useProducts();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Combobox states
  const [openProducts, setOpenProducts] = useState(false);
  const [openCategories, setOpenCategories] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discount_value: 0,
    min_order_value: 0,
    max_discount_amount: undefined as number | undefined,
    usage_limit: undefined as number | undefined,
    valid_until: '',
    allowed_emails: '',
    restricted_products: [] as string[],
    restricted_categories: [] as string[],
  });

  useEffect(() => {
    fetchCoupons();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data as any[]) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch coupons',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const emailList = formData.allowed_emails
        ? formData.allowed_emails.split(',').map(e => e.trim()).filter(e => e)
        : null;

      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        min_order_value: formData.min_order_value,
        max_discount_amount: formData.max_discount_amount,
        usage_limit: formData.usage_limit,
        valid_until: formData.valid_until || null,
        allowed_emails: emailList,
        restricted_products: formData.restricted_products.length > 0 ? formData.restricted_products : null,
        restricted_categories: formData.restricted_categories.length > 0 ? formData.restricted_categories : null,
      };

      const { error } = await supabase.from('coupons').insert(payload);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon created successfully'
      });

      setOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: 0,
      max_discount_amount: undefined,
      usage_limit: undefined,
      valid_until: '',
      allowed_emails: '',
      restricted_products: [],
      restricted_categories: [],
    });
  };

  const toggleCouponStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Coupon ${isActive ? 'activated' : 'deactivated'}`
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update coupon',
        variant: 'destructive'
      });
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Coupon deleted'
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete coupon',
        variant: 'destructive'
      });
    }
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => {
      const exists = prev.restricted_products.includes(productId);
      return {
        ...prev,
        restricted_products: exists
          ? prev.restricted_products.filter(id => id !== productId)
          : [...prev.restricted_products, productId]
      };
    });
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => {
      const exists = prev.restricted_categories.includes(categoryId);
      return {
        ...prev,
        restricted_categories: exists
          ? prev.restricted_categories.filter(id => id !== categoryId)
          : [...prev.restricted_categories, categoryId]
      };
    });
  };

  return (
    <Card className="bg-mtrix-dark border-mtrix-gray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Coupon Management
          </CardTitle>
          <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-mtrix-black">
                <Plus className="w-4 h-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-mtrix-dark border-mtrix-gray max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="SAVE20"
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="20% off on all products"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'percentage' | 'fixed' | 'free_shipping') => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.discount_type !== 'free_shipping' && (
                    <div>
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Order Value</Label>
                    <Input
                      type="number"
                      value={formData.min_order_value}
                      onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Discount Amount</Label>
                    <Input
                      type="number"
                      value={formData.max_discount_amount || ''}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Usage Limit</Label>
                    <Input
                      type="number"
                      value={formData.usage_limit || ''}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label>Valid Until</Label>
                    <Input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>
                </div>

                {/* Smart Restrictions */}
                <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Smart Restrictions</h4>

                  <div>
                    <Label>Allowed Emails (Comma separated)</Label>
                    <Textarea
                      value={formData.allowed_emails}
                      onChange={(e) => setFormData({ ...formData, allowed_emails: e.target.value })}
                      placeholder="user1@example.com, user2@example.com"
                      className="h-20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Restriction */}
                    <div className="flex flex-col gap-2">
                      <Label>Restricted Products</Label>
                      <Popover open={openProducts} onOpenChange={setOpenProducts}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={openProducts} className="justify-between w-full">
                            {formData.restricted_products.length > 0
                              ? `${formData.restricted_products.length} selected`
                              : "Select products..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search products..." />
                            <CommandList>
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name} // use name for search
                                    onSelect={() => toggleProduct(product.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.restricted_products.includes(product.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {product.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {formData.restricted_products.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.restricted_products.map(id => {
                            const p = products.find(prod => prod.id === id);
                            return p ? (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {p.name}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                                  onClick={() => toggleProduct(id)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Category Restriction */}
                    <div className="flex flex-col gap-2">
                      <Label>Restricted Categories</Label>
                      <Popover open={openCategories} onOpenChange={setOpenCategories}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={openCategories} className="justify-between w-full">
                            {formData.restricted_categories.length > 0
                              ? `${formData.restricted_categories.length} selected`
                              : "Select categories..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search categories..." />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup>
                                {categories.map((cat) => (
                                  <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => toggleCategory(cat.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.restricted_categories.includes(cat.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {cat.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {formData.restricted_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.restricted_categories.map(id => {
                            const c = categories.find(cat => cat.id === id);
                            return c ? (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {c.name}
                                <X
                                  className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                                  onClick={() => toggleCategory(id)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-gold text-mtrix-black">
                  Create Coupon
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Restrictions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-bold">{coupon.code}</TableCell>
                <TableCell>{coupon.discount_type}</TableCell>
                <TableCell>
                  {coupon.discount_type === 'free_shipping'
                    ? <span className="text-gold">Free Shipping</span>
                    : coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `₹${coupon.discount_value}`
                  }
                </TableCell>
                <TableCell>
                  {coupon.used_count}{coupon.usage_limit && `/${coupon.usage_limit}`}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {[
                    coupon.allowed_emails && coupon.allowed_emails.length > 0 ? `${coupon.allowed_emails.length} Emails` : null,
                    coupon.restricted_products && coupon.restricted_products.length > 0 ? `${coupon.restricted_products.length} Products` : null,
                    coupon.restricted_categories && coupon.restricted_categories.length > 0 ? `${coupon.restricted_categories.length} Categories` : null
                  ].filter(Boolean).join(', ') || 'None'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={(checked) => toggleCouponStatus(coupon.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCoupon(coupon.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CouponManager;
