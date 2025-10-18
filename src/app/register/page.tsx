'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';

// Enhanced API call that handles extension interference
const registerWithRetry = async (data: any, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Registration attempt ${attempt + 1}`);
      
      // Add a small delay between retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      // Try the regular API call first
      const response = await api.register(data);
      return response;
    } catch (error: any) {
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      // If it's the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // If it's a network-related error, try alternative methods
      if (error.message.includes('Network Error') || 
          error.message.includes('Failed to fetch') ||
          error.code === 'NETWORK_ERROR') {
        
        console.log('Trying alternative registration method...');
        
        // Try with XMLHttpRequest as fallback
        try {
          const xhrResponse = await registerWithXHR(data);
          return xhrResponse;
        } catch (xhrError) {
          console.log('XHR method also failed:', xhrError);
          continue; // Try next attempt
        }
      }
    }
  }
  
  throw new Error('All registration attempts failed');
};

// XMLHttpRequest fallback
const registerWithXHR = (data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    xhr.open('POST', `${apiBaseUrl}/api/users/register`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Add authorization header if token exists
    const token = localStorage.getItem('healthsaas_token');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    xhr.timeout = 10000; // 10 second timeout
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response });
        } catch (parseError) {
          resolve({ data: xhr.responseText });
        }
      } else {
        reject(new Error(`Registration failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error occurred'));
    };
    
    xhr.ontimeout = () => {
      reject(new Error('Request timeout'));
    };
    
    try {
      xhr.send(JSON.stringify(data));
    } catch (sendError) {
      reject(new Error('Failed to send request'));
    }
  });
};

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) return;
    
    // Validation
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const registerData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: 'CHW',
      };

      console.log('Starting registration process...', { 
        email: registerData.email,
        hasPassword: !!registerData.password 
      });

      // Use the enhanced API call with retry logic
      const response = await registerWithRetry(registerData);
      
      console.log('Registration response:', response);
      
      if (response?.data) {
        toast.success('Registration successful! Redirecting to login...');
        
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirm_password: '',
        });
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration process failed:', error);
      
      // User-friendly error messages
      if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('400') || error.message.includes('Validation')) {
        toast.error('Invalid registration data. Please check your information and try again.');
      } else if (error.message.includes('409') || error.message.includes('already exists')) {
        toast.error('An account with this email already exists. Please use a different email or login.');
      } else if (error.message.includes('500')) {
        toast.error('Server error. Please try again later.');
      } else {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Check if form is valid for better UX
  const isFormValid = formData.name.trim() && 
                     formData.email.trim() && 
                     formData.password.length >= 6 && 
                     formData.confirm_password === formData.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-elevated">
              <Activity className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            HealthSaaS
          </h1>
          <p className="text-muted-foreground mt-2">
            Join as a Community Health Worker
          </p>
        </div>

        {/* Register Form */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Start making a difference in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="chw@healthsaas.org"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                {formData.confirm_password && formData.password !== formData.confirm_password && (
                  <p className="text-xs text-red-500">
                    Passwords do not match
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-primary hover:underline"
                  onClick={(e) => loading && e.preventDefault()}
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* Connection Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-800 text-center mb-1">
                Having Issues?
              </p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Try disabling browser extensions temporarily</li>
                <li>• Ensure your email is valid and accessible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}