import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, MapPin, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  name: string;
  mobile_no: string;
  created_at: string;
  updated_at: string;
}

interface Address {
  id: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  pincode: string;
  state?: string;
  district?: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

interface LoginHistory {
  id: string;
  login_method: string;
  ip_address?: string;
  user_agent?: string;
  login_time: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    name: '',
    mobile_no: ''
  });

  // Address form state
  const [addressData, setAddressData] = useState<{
    address_line_1: string;
    address_line_2: string;
    city: string;
    pincode: string;
    state: string;
    district: string;
    address_type: 'home' | 'work' | 'other';
    is_default: boolean;
  }>({
    address_line_1: '',
    address_line_2: '',
    city: '',
    pincode: '',
    state: '',
    district: '',
    address_type: 'home',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
      fetchLoginHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        name: data.name || '',
        mobile_no: data.mobile_no || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses((data || []).map(addr => ({
        ...addr,
        address_type: addr.address_type as 'home' | 'work' | 'other'
      })));
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('login_time', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLoginHistory(data || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPincodeDetails = async (pincode: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_pincode_details', { pincode_input: pincode });

      if (error) throw error;

      if (data && data.length > 0) {
        const pincodeData = data[0];
        setAddressData(prev => ({
          ...prev,
          state: pincodeData.state || '',
          district: pincodeData.district || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const addressPayload = {
        ...addressData,
        user_id: user?.id
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressPayload)
          .eq('id', editingAddress.id);
        
        if (error) throw error;
        toast.success('Address updated successfully');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert(addressPayload);
        
        if (error) throw error;
        toast.success('Address added successfully');
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const resetAddressForm = () => {
    setAddressData({
      address_line_1: '',
      address_line_2: '',
      city: '',
      pincode: '',
      state: '',
      district: '',
      address_type: 'home',
      is_default: false
    });
  };

  const startEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressData({
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      pincode: address.pincode,
      state: address.state || '',
      district: address.district || '',
      address_type: address.address_type,
      is_default: address.is_default
    });
    setShowAddressForm(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile?.name || 'User Profile'}</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        value={profileData.mobile_no}
                        onChange={(e) => setProfileData({ ...profileData, mobile_no: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email || ''} disabled />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Saved Addresses</CardTitle>
                      <CardDescription>
                        Manage your delivery addresses
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowAddressForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Address Form */}
                  {showAddressForm && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddressSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="addressLine1">Address Line 1</Label>
                            <Input
                              id="addressLine1"
                              value={addressData.address_line_1}
                              onChange={(e) => setAddressData({ ...addressData, address_line_1: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                            <Input
                              id="addressLine2"
                              value={addressData.address_line_2}
                              onChange={(e) => setAddressData({ ...addressData, address_line_2: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={addressData.city}
                                onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pincode">Pincode</Label>
                              <Input
                                id="pincode"
                                value={addressData.pincode}
                                onChange={(e) => {
                                  setAddressData({ ...addressData, pincode: e.target.value });
                                  if (e.target.value.length === 6) {
                                    fetchPincodeDetails(e.target.value);
                                  }
                                }}
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="state">State</Label>
                              <Input
                                id="state"
                                value={addressData.state}
                                onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="district">District</Label>
                              <Input
                                id="district"
                                value={addressData.district}
                                onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="addressType">Address Type</Label>
                            <Select
                              value={addressData.address_type}
                              onValueChange={(value: 'home' | 'work' | 'other') => 
                                setAddressData({ ...addressData, address_type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="home">Home</SelectItem>
                                <SelectItem value="work">Work</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isDefault"
                              checked={addressData.is_default}
                              onChange={(e) => setAddressData({ ...addressData, is_default: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="isDefault">Set as default address</Label>
                          </div>

                          <div className="flex gap-2">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                resetAddressForm();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {/* Address List */}
                  <div className="grid gap-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className="relative">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={address.is_default ? "default" : "secondary"}>
                                  {address.address_type}
                                </Badge>
                                {address.is_default && (
                                  <Badge variant="outline">Default</Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium">{address.address_line_1}</p>
                                {address.address_line_2 && <p>{address.address_line_2}</p>}
                                <p>{address.city}, {address.district}, {address.state}</p>
                                <p>Pincode: {address.pincode}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditAddress(address)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {addresses.length === 0 && !showAddressForm && (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first address to get started
                      </p>
                      <Button onClick={() => setShowAddressForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Login Activity</CardTitle>
                  <CardDescription>
                    Recent login activity and security information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loginHistory.map((login) => (
                      <div key={login.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              Signed in via {login.login_method}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(login.login_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {login.login_method}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {loginHistory.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No login history</h3>
                      <p className="text-muted-foreground">
                        Your login activity will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;