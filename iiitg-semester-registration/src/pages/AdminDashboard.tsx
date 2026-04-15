import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminApi, coursesApi, registrationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutDashboard, Users, BookOpen, Settings, Activity } from 'lucide-react';
import WorkflowStepper from '@/components/WorkflowStepper';

const navItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Courses', url: '/admin/courses', icon: BookOpen },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
  { title: 'Monitor', url: '/admin/monitor', icon: Activity },
];

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const location = window.location.pathname;
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [currentSemester, setCurrentSemester] = useState('5');

  const { data: registrations = [], isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registrations', 'all', 'admin'],
    queryFn: registrationsApi.getAll,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.list,
  });

  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
  });

  const regEnabled = Boolean(settings?.registration_enabled?.enabled);

  const toggleRegistrationMutation = useMutation({
    mutationFn: (enabled: boolean) => adminApi.updateSetting('registration_enabled', { enabled }),
    onSuccess: (_, enabled) => {
      toast.success(enabled ? 'Registration enabled' : 'Registration disabled');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to update registration status');
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        adminApi.updateSetting('academic_year', { value: academicYear }),
        adminApi.updateSetting('current_semester', { value: currentSemester }),
      ]);
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to save settings');
    },
  });

  const showUsers = location.includes('/users');
  const showCourses = location.includes('/courses');
  const showSettings = location.includes('/settings');
  const showMonitor = location.includes('/monitor');
  const showDashboard = !showUsers && !showCourses && !showSettings && !showMonitor;

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {showDashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-heading font-bold">{registrations.length}</p>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-heading font-bold">{courses.length}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-heading font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-center gap-3">
                    <Switch checked={regEnabled} onCheckedChange={(checked) => toggleRegistrationMutation.mutate(checked)} />
                  <span className="text-sm font-medium">{regEnabled ? 'Open' : 'Closed'}</span>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="font-heading">All Registrations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isLoadingRegistrations ? (
                  <p className="py-8 text-center text-muted-foreground">Loading workflow data from your backend...</p>
                ) : registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{reg.studentName} ({reg.rollNo})</p>
                      <p className="text-sm text-muted-foreground">Cat {reg.category} • {reg.department}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <WorkflowStepper currentStage={reg.currentStage} compact />
                      <Badge variant={reg.currentStage === 'final_approved' ? 'default' : 'secondary'}>
                        {reg.currentStage.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {showUsers && (
          <Card>
            <CardHeader><CardTitle className="font-heading">User Management</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.email} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary">{u.role.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showCourses && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading">Course Management</CardTitle>
                <Button size="sm" onClick={() => toast.info('Add course form coming soon!')}>Add Course</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {courses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-mono text-accent mr-2">{c.code}</span>
                      <span className="font-medium">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{c.credits} cr</Badge>
                      <Badge variant="outline">{c.department}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showSettings && (
          <Card>
            <CardHeader><CardTitle className="font-heading">System Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Registration Status</p>
                  <p className="text-sm text-muted-foreground">Enable or disable semester registration</p>
                </div>
                <Switch checked={regEnabled} onCheckedChange={(checked) => toggleRegistrationMutation.mutate(checked)} />
              </div>
              <div className="space-y-2">
                <Label>Current Academic Year</Label>
                <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Current Semester</Label>
                <Input value={currentSemester} onChange={(event) => setCurrentSemester(event.target.value)} type="number" />
              </div>
              <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>Save Settings</Button>
            </CardContent>
          </Card>
        )}

        {showMonitor && (
          <Card>
            <CardHeader><CardTitle className="font-heading">Workflow Monitor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{reg.studentName} ({reg.rollNo})</p>
                    <Badge>{reg.currentStage.replace('_', ' ')}</Badge>
                  </div>
                  <WorkflowStepper currentStage={reg.currentStage} />
                  <div className="text-xs text-muted-foreground space-y-1">
                    {reg.approvals.map((a, i) => (
                      <p key={i}>✓ {a.stage.replace('_', ' ')} — {a.approvedBy} at {new Date(a.approvedAt).toLocaleString()}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
