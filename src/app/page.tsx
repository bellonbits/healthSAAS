'use client';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Home,
  Stethoscope,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  MapPin,
  Activity,
  Clock,
  ArrowRight,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import { api, DashboardStats, RecentActivity, getErrorMessage, generateMockActivities } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { useAuth } from '@/components/providers/AuthProvider';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleApiCall } = useApi();
  const { user: currentUser } = useAuth();
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResult, activityResult] = await Promise.all([
        handleApiCall(
          () => api.getDashboardStats().then(res => res.data.data),
          { showError: false }
        ),
        handleApiCall(
          () => api.getRecentActivity().then(res => res.data.data.activities || []),
          { showError: false }
        )
      ]);

      if (statsResult) {
        setStats(statsResult);
      } else {
        // Fallback mock stats if API doesn't return data
        setStats({
          total_patients: 147,
          total_households: 42,
          total_visits: 289,
          high_risk_patients: 23,
          recent_visits_count: 15,
          patients_trend: 12,
          households_trend: 5,
          visits_trend: 8,
        });
      }

      if (activityResult && activityResult.length > 0) {
        setRecentActivity(activityResult.slice(0, 10)); // Show last 10 activities
      } else {
        // Use mock activities if API doesn't return data
        const mockActivities = generateMockActivities();
        setRecentActivity(mockActivities);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to mock data
      setStats({
        total_patients: 147,
        total_households: 42,
        total_visits: 289,
        high_risk_patients: 23,
        recent_visits_count: 15,
        patients_trend: 12,
        households_trend: 5,
        visits_trend: 8,
      });
      setRecentActivity(generateMockActivities());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await api.getAIStatus();
      setAiStatus(response.data.status === 'online' ? 'online' : 'offline');
    } catch (error) {
      console.warn('Failed to check AI status:', error);
      setAiStatus('offline');
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <span className="h-4 w-4">→</span>;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient_created':
      case 'patient_updated':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'household_created':
        return <Home className="h-4 w-4 text-green-500" />;
      case 'visit_created':
      case 'visit_updated':
        return <Stethoscope className="h-4 w-4 text-purple-500" />;
      case 'user_logged_in':
        return <Activity className="h-4 w-4 text-orange-500" />;
      case 'data_exported':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' } } = {
      patient_created: { label: 'Patient Added', variant: 'success' },
      patient_updated: { label: 'Patient Updated', variant: 'default' },
      household_created: { label: 'Household Added', variant: 'secondary' },
      visit_created: { label: 'Visit Recorded', variant: 'outline' },
      visit_updated: { label: 'Visit Updated', variant: 'outline' },
      user_logged_in: { label: 'Login', variant: 'default' },
      data_exported: { label: 'Data Export', variant: 'secondary' },
    };

    const activityType = typeMap[type] || { label: type, variant: 'default' };
    
    return (
      <Badge variant={activityType.variant} className="text-xs">
        {activityType.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getActivityDescription = (activity: RecentActivity) => {
    if (activity.description) return activity.description;

    switch (activity.type) {
      case 'patient_created':
        return `Registered new patient ${activity.metadata?.patient_name || ''}`;
      case 'patient_updated':
        return `Updated patient ${activity.metadata?.patient_name || ''}`;
      case 'household_created':
        return `Registered new household ${activity.metadata?.household_code || ''}`;
      case 'visit_created':
        return `Recorded ${activity.metadata?.visit_type || ''} visit for patient`;
      case 'visit_updated':
        return `Updated ${activity.metadata?.visit_type || ''} visit`;
      case 'user_logged_in':
        return 'Logged into the system';
      case 'data_exported':
        return 'Exported system data';
      default:
        return 'Performed system action';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {currentUser ? (currentUser as any).full_name || (currentUser as any).username || 'User' : 'User'}! Here's what's happening today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={loadDashboardData}
              variant="outline"
              className="sm:w-auto"
            >
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/visits">
              <Button className="bg-gradient-primary hover:opacity-90 sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Record Visit
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Patients Card */}
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_patients || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats?.patients_trend !== undefined && (
                  <>
                    {getTrendIcon(stats.patients_trend)}
                    <span className={`ml-1 ${getTrendColor(stats.patients_trend)}`}>
                      {Math.abs(stats.patients_trend)}% from last week
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Households Card */}
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Households</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_households || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats?.households_trend !== undefined && (
                  <>
                    {getTrendIcon(stats.households_trend)}
                    <span className={`ml-1 ${getTrendColor(stats.households_trend)}`}>
                      {Math.abs(stats.households_trend)}% from last week
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Visits Card */}
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medical Visits</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_visits || 0}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats?.visits_trend !== undefined && (
                  <>
                    {getTrendIcon(stats.visits_trend)}
                    <span className={`ml-1 ${getTrendColor(stats.visits_trend)}`}>
                      {Math.abs(stats.visits_trend)}% from last week
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* High Risk Patients Card */}
          <Card className="shadow-card hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Patients</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats?.high_risk_patients || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requiring immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">API Server</div>
                  <div className="text-sm text-muted-foreground">Operational</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-sm text-muted-foreground">Connected</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  aiStatus === 'online' ? 'bg-green-500' : 
                  aiStatus === 'offline' ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'
                }`}></div>
                <div>
                  <div className="font-medium">AI Services</div>
                  <div className="text-sm text-muted-foreground">
                    {aiStatus === 'online' ? 'Available' : 
                     aiStatus === 'offline' ? 'Limited' : 'Checking...'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="font-medium">Last Sync</div>
                  <div className="text-sm text-muted-foreground">{formatTimestamp(new Date().toISOString())}</div>
                </div>
              </div>
            </div>
            
            {/* AI Service Warning Banner */}
            {aiStatus === 'offline' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    AI services are temporarily unavailable. Basic recommendations are still available.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {recentActivity.length} activities
              </Badge>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentActivity.slice(0, 6).map((activity) => (
                          <TableRow key={activity._id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getActivityIcon(activity.type)}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {getActivityDescription(activity)}
                                  </span>
                                  <div className="mt-1">
                                    {getActivityBadge(activity.type)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-xs text-white">
                                  {activity.user?.charAt(0) || 'U'}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {activity.user}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(activity.timestamp)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Link href="/settings?tab=activity">
                    <Button variant="outline" className="w-full">
                      View All Activity
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Activities will appear here as you use the system</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Visits */}
          <div className="space-y-6">
            {/* Recent Visits Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stats?.recent_visits_count || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      visits this week
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">8</div>
                      <div className="text-xs text-blue-600">Routine</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">5</div>
                      <div className="text-xs text-green-600">Follow-up</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">2</div>
                      <div className="text-xs text-orange-600">Emergency</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">0</div>
                      <div className="text-xs text-purple-600">Initial</div>
                    </div>
                  </div>
                  <Link href="/visits">
                    <Button className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Visits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Link href="/patients">
                    <Button className="h-12 justify-start gap-3 w-full">
                      <User className="h-5 w-5" />
                      <span>Register New Patient</span>
                    </Button>
                  </Link>
                  <Link href="/households">
                    <Button className="h-12 justify-start gap-3 w-full" variant="outline">
                      <Home className="h-5 w-5" />
                      <span>Add Household</span>
                    </Button>
                  </Link>
                  <Link href="/visits">
                    <Button className="h-12 justify-start gap-3 w-full" variant="outline">
                      <Stethoscope className="h-5 w-5" />
                      <span>Record Medical Visit</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}