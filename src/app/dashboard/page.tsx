'use client';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatsCard } from '@/components/StatsCard';
import { Users, Activity, Home, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, DashboardStats, Activity as ActivityType } from '@/lib/api';
import { useApi } from '@/lib/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleApiCall } = useApi();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    await Promise.all([
      handleApiCall(
        () => api.getDashboardStats().then(res => res.data.data),
        {
          onSuccess: setStats,
          showError: false
        }
      ),
      handleApiCall(
        () => api.getRecentActivity().then(res => res.data.activities || []),
        {
          onSuccess: setActivities,
          showError: false
        }
      )
    ]);

    setLoading(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your health programs.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Patients"
              value={stats?.total_patients || 0}
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Total Visits"
              value={stats?.total_visits || 0}
              icon={Activity}
              variant="success"
            />
            <StatsCard
              title="Households"
              value={stats?.total_households || 0}
              icon={Home}
              variant="warning"
            />
            <StatsCard
              title="High Risk"
              value={stats?.risk_distribution?.High || 0}
              icon={TrendingUp}
              variant="destructive"
            />
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Risk Distribution */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Patient risk levels overview</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.risk_distribution && Object.entries(stats.risk_distribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${
                          level === 'High' ? 'bg-red-500' :
                          level === 'Medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <span className="font-medium">{level} Risk</span>
                      </div>
                      <span className={`text-lg font-bold ${getRiskColor(level)}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {activity.user_name} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">Activities will appear here as they occur</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}