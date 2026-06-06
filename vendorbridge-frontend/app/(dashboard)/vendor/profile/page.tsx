'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { vendorApi } from '@/lib/api/vendor.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Settings, User, Building2, Calendar, FileText, CheckCircle } from 'lucide-react';

export default function VendorProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [category, setCategory] = useState('');

  const loadProfile = async () => {
    if (!user?.vendor_id) return;
    setIsLoading(true);
    try {
      const data = await vendorApi.getById(user.vendor_id);
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setGstNumber(data.gst_number || '');
      setDob(data.dob || '');
      setAddress(data.address || '');
      setCity(data.city || '');
      setState(data.state || '');
      setPincode(data.pincode || '');
      setCategory(data.category || '');
    } catch (err) {
      console.error('Error loading vendor profile:', err);
      toast.error('Failed to load profile settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.vendor_id) {
      loadProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.vendor_id) return;

    setIsSaving(true);
    try {
      const updated = await vendorApi.update(user.vendor_id, {
        name,
        phone,
        gst_number: gstNumber,
        dob: dob || null,
        address,
        city,
        state,
        pincode,
        category
      });
      setProfile(updated);
      toast.success('Profile settings updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-xs text-gray-500 font-medium">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="text-blue-600 dark:text-blue-400" size={24} />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
          <p className="text-xs text-gray-500">Manage your business profile, address, and compliance info.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Summary & status */}
        <div className="space-y-6">
          <Card className="border border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 size={32} />
              </div>
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                {profile?.name || 'Company Profile'}
              </CardTitle>
              <CardDescription className="text-xs">{profile?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  profile?.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300'
                }`}>
                  {profile?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{profile?.category || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{profile?.rating || '0.00'} / 5.00</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Form: Main inputs */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Business Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="flex items-center gap-1"><User size={13} /> Legal Business Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Business Category</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. IT Equipment, Construction, Logistics" />
                  </div>
                </div>

                {/* GST & DOB */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gstNumber" className="flex items-center gap-1"><FileText size={13} /> GST Number</Label>
                    <Input id="gstNumber" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 29AAAAA1111A1Z1" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="flex items-center gap-1"><Calendar size={13} /> Date of Birth / Incorporation</Label>
                    <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Contact Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address (Read-only)</Label>
                    <Input id="email" value={profile?.email || ''} readOnly className="bg-gray-50 dark:bg-gray-850 cursor-not-allowed" />
                  </div>
                </div>

                {/* Address Details */}
                <div className="space-y-4 border-t border-gray-100 dark:border-gray-850 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Address Information</h3>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Street Address</Label>
                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[80px]" placeholder="Flat/House no, Street name, Area" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <Button type="submit" disabled={isSaving} className="w-full gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving Profile Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Save Profile Settings</span>
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
