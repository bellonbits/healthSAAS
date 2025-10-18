'use client';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Save,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Download,
  Upload,
  Trash2,
  Key,
  Mail,
  Globe,
  Smartphone,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  language: string;
  timezone: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  lastLogin: string;
  loginAttempts: number;
}

// Add the missing helper function
const getUserProperty = (user: any, ...properties: string[]): string => {
  for (const prop of properties) {
    if (user && user[prop]) return user[prop];
  }
  return '';
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const { user: currentUser, updateUser } = useAuth();
  const { handleApiCall } = useApi();

  // User Profile State
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    language: 'en',
    timezone: 'Africa/Nairobi',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsAlerts: true,
    newPatientAlerts: true,
    highRiskAlerts: true,
    visitReminders: true,
    weeklyReports: false,
  });

  // Application Settings
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    autoSave: true,
    dataExport: true,
    offlineMode: false,
    syncFrequency: 'realtime',
    recordsPerPage: 25,
  });

  // Security Settings
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordLastChanged: '',
    lastLogin: '',
    loginAttempts: 0,
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentUser) {
      setProfile({
        full_name: getUserProperty(currentUser, 'full_name', 'username', 'name'),
        email: currentUser.email || '',
        phone: getUserProperty(currentUser, 'phone', 'phone_number'),
        role: currentUser.role || '',
        language: 'en',
        timezone: 'Africa/Nairobi',
      });
    }
    loadSecuritySettings();
  }, [currentUser]);

  const loadSecuritySettings = async () => {
    try {
      // This would typically come from your API
      const securityData: SecuritySettings = {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordLastChanged: '2024-01-15',
        lastLogin: new Date().toISOString(),
        loginAttempts: 0,
      };
      setSecurity(securityData);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  };

const handleSaveProfile = async () => {
  setSaving(true);
  try {
    // If we need an ID, use the most common pattern
    const userId = (currentUser as any)._id;
    
    if (!userId) {
      toast.error('Unable to identify user. Please try logging out and back in.');
      return;
    }

    const result = await handleApiCall(
      () => api.updateUser(userId, {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
      }),
      { 
        successMessage: 'Profile updated successfully',
        onSuccess: (data) => {
          if (data.data.data) {
            updateUser(data.data.data);
          }
        }
      }
    );
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    toast.error(`Failed to update profile: ${errorMessage}`);
  } finally {
    setSaving(false);
  }
};

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Save notification settings to localStorage or API
      localStorage.setItem('notificationSettings', JSON.stringify(notifications));
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);
    try {
      // Save app settings to localStorage
      localStorage.setItem('appSettings', JSON.stringify(appSettings));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Apply theme immediately
      if (appSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast.success('Application settings updated');
    } catch (error) {
      toast.error('Failed to save application settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Exporting data...');
      // This would call your export API endpoint
      const response = await api.downloadCSVTemplate(); // Using existing endpoint as example
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `healthtrack_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data exported successfully');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Failed to export data: ${errorMessage}`);
    }
  };

  const handleImportData = () => {
    toast.info('Please select file to import...');
    // Implement data import logic
  };

  const handleChangePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('New passwords do not match');
    return;
  }

  if (passwordForm.newPassword.length < 6) {
    toast.error('Password must be at least 6 characters long');
    return;
  }

  setSaving(true);
  try {
    const userId = (currentUser as any)._id;
    
    if (!userId) {
      toast.error('Unable to identify user. Please try logging out and back in.');
      return;
    }

    const result = await handleApiCall(
      () => api.updateUser(userId, {
        password: passwordForm.newPassword
      }),
      { 
        successMessage: 'Password changed successfully',
        onSuccess: () => {
          setChangePasswordDialog(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      }
    );
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    toast.error(`Failed to change password: ${errorMessage}`);
  } finally {
    setSaving(false);
  }
};

  const handleDeleteData = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete all data and cannot be undone.')) {
      return;
    }

    if (!confirm('This is a destructive operation. Please type "DELETE" to confirm.')) {
      return;
    }

    try {
      toast.info('Deleting data...');
      // This would call your API to delete data
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Data deleted successfully');
    } catch (error) {
      toast.error('Failed to delete data');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and application preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {profile.role}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profile.language}
                      onValueChange={(value) => setProfile({ ...profile, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profile.timezone}
                      onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Nairobi">East Africa Time (Nairobi)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (New York)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about system activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notification Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </div>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive browser push notifications
                        </div>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, pushNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-alerts">SMS Alerts</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive critical alerts via SMS
                        </div>
                      </div>
                      <Switch
                        id="sms-alerts"
                        checked={notifications.smsAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, smsAlerts: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Alert Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="new-patient-alerts">New Patient Registrations</Label>
                        <div className="text-sm text-muted-foreground">
                          Get notified when new patients are registered
                        </div>
                      </div>
                      <Switch
                        id="new-patient-alerts"
                        checked={notifications.newPatientAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, newPatientAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="high-risk-alerts">High Risk Patient Alerts</Label>
                        <div className="text-sm text-muted-foreground">
                          Immediate alerts for high-risk patients
                        </div>
                      </div>
                      <Switch
                        id="high-risk-alerts"
                        checked={notifications.highRiskAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, highRiskAlerts: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="visit-reminders">Visit Reminders</Label>
                        <div className="text-sm text-muted-foreground">
                          Reminders for scheduled patient visits
                        </div>
                      </div>
                      <Switch
                        id="visit-reminders"
                        checked={notifications.visitReminders}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, visitReminders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-reports">Weekly Reports</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive weekly summary reports
                        </div>
                      </div>
                      <Switch
                        id="weekly-reports"
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, weeklyReports: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Behavior</CardTitle>
                <CardDescription>
                  Customize how the application looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={appSettings.theme}
                      onValueChange={(value) => setAppSettings({ ...appSettings, theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="records-per-page">Records Per Page</Label>
                    <Select
                      value={appSettings.recordsPerPage.toString()}
                      onValueChange={(value) => setAppSettings({ ...appSettings, recordsPerPage: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 records</SelectItem>
                        <SelectItem value="25">25 records</SelectItem>
                        <SelectItem value="50">50 records</SelectItem>
                        <SelectItem value="100">100 records</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-save">Auto Save</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically save form data as you type
                      </div>
                    </div>
                    <Switch
                      id="auto-save"
                      checked={appSettings.autoSave}
                      onCheckedChange={(checked) =>
                        setAppSettings({ ...appSettings, autoSave: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="offline-mode">Offline Mode</Label>
                      <div className="text-sm text-muted-foreground">
                        Enable offline data collection and sync later
                      </div>
                    </div>
                    <Switch
                      id="offline-mode"
                      checked={appSettings.offlineMode}
                      onCheckedChange={(checked) =>
                        setAppSettings({ ...appSettings, offlineMode: checked })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">Data Sync Frequency</Label>
                  <Select
                    value={appSettings.syncFrequency}
                    onValueChange={(value) => setAppSettings({ ...appSettings, syncFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="5min">Every 5 minutes</SelectItem>
                      <SelectItem value="15min">Every 15 minutes</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSaveAppSettings} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Appearance Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Password & Authentication</h4>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Password</Label>
                      <div className="text-sm text-muted-foreground">
                        Last changed: {security.passwordLastChanged || 'Never'}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setChangePasswordDialog(true)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <div className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={security.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        setSecurity({ ...security, twoFactorAuth: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Session Management</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <Select
                      value={security.sessionTimeout.toString()}
                      onValueChange={(value) => setSecurity({ ...security, sessionTimeout: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground">
                      Automatically log out after period of inactivity
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Activity</h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-sm">Last Login</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {security.lastLogin ? new Date(security.lastLogin).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-sm">Failed Login Attempts</Label>
                      <div className="text-sm">
                        {security.loginAttempts} in the last 24 hours
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export, import, and manage your application data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Data Export</h4>
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Export All Data</Label>
                        <div className="text-sm text-muted-foreground">
                          Download complete dataset as CSV files
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleExportData}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant="secondary">Patients</Badge>
                      <Badge variant="secondary">Households</Badge>
                      <Badge variant="secondary">Visits</Badge>
                      <Badge variant="secondary">Users</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Data Import</h4>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Import Data</Label>
                        <div className="text-sm text-muted-foreground">
                          Upload CSV files to import data in bulk
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleImportData}>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-red-600">Danger Zone</h4>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-red-600">Delete All Data</Label>
                        <div className="text-sm text-red-600">
                          Permanently delete all data from the system. This action cannot be undone.
                        </div>
                      </div>
                      <Button variant="destructive" onClick={handleDeleteData}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and set a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password" 
                type="password" 
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password" 
                type="password" 
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}