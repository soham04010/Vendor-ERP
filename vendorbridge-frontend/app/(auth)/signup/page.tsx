'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  country: z.string().min(1, 'Country is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
  additionalInfo: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const passwordValue = watch('password') || '';
  const pwdLength = passwordValue.length >= 8 && passwordValue.length <= 16;
  const pwdLetter = /[a-zA-Z]/.test(passwordValue);
  const pwdNumber = /[0-9]/.test(passwordValue);
  const pwdSymbol = /[^a-zA-Z0-9]/.test(passwordValue);

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Force role to be vendor, as per requirements
      const payload = { ...data, role: 'vendor' };
      const response = await authApi.register(payload);
      
      login(response.user, response.token);
      toast.success('Registration successful!');
      router.push('/vendor');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 items-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">VB</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Vendor Registration</CardTitle>
          <CardDescription className="text-center">
            Register your company to start participating in RFQs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  maxLength={10}
                  {...register('phone')} 
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                  }}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    {...register('password')} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                
                {/* Password Requirements Checklist */}
                <div className="mt-2 text-xs space-y-1">
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Password must contain:</p>
                  <div className={`flex items-center gap-2 ${pwdLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {pwdLength ? <Check size={14} /> : <X size={14} />} Between 8 and 16 characters
                  </div>
                  <div className={`flex items-center gap-2 ${pwdLetter ? 'text-green-600' : 'text-gray-500'}`}>
                    {pwdLetter ? <Check size={14} /> : <X size={14} />} One letter
                  </div>
                  <div className={`flex items-center gap-2 ${pwdNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    {pwdNumber ? <Check size={14} /> : <X size={14} />} One number
                  </div>
                  <div className={`flex items-center gap-2 ${pwdSymbol ? 'text-green-600' : 'text-gray-500'}`}>
                    {pwdSymbol ? <Check size={14} /> : <X size={14} />} One symbol
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register('country')} />
                {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea 
                id="additionalInfo" 
                placeholder="Tell us about your services, GST details, etc."
                className="min-h-[100px]"
                {...register('additionalInfo')} 
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
