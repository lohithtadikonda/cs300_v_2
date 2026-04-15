import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registrationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutDashboard, Award, CheckSquare } from 'lucide-react';
import WorkflowStepper from '@/components/WorkflowStepper';

const navItems = [
  { title: 'Dashboard', url: '/student-affairs', icon: LayoutDashboard },
  { title: 'Scholarships', url: '/student-affairs/scholarships', icon: Award },
  { title: 'Approvals', url: '/student-affairs/approvals', icon: CheckSquare },
];

export default function StudentAffairsDashboard() {
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', 'all', 'student-affairs'],
    queryFn: registrationsApi.getAll,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => registrationsApi.approve(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'Scholarship verified & approved' : 'Registration rejected');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    },
  });

  const scholarshipStudents = registrations.filter((registration) => registration.formB?.paymentCategory === 'scholarship');

  return (
    <DashboardLayout navItems={navItems} title="Student Affairs Section">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-heading font-bold">{scholarshipStudents.length}</p>
              <p className="text-sm text-muted-foreground">Scholarship Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-heading font-bold text-warning">{scholarshipStudents.filter(r => r.currentStage === 'section_review').length}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Scholarship Student Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading scholarship queue from your backend...</p>
            ) : scholarshipStudents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending forms.</p>
            ) : (
              scholarshipStudents.map((reg) => (
                <div key={reg.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-semibold">{reg.studentName}</p>
                      <p className="text-sm text-muted-foreground">{reg.rollNo} • {reg.department}</p>
                    </div>
                    <Badge variant="secondary">Scholarship</Badge>
                  </div>
                  <WorkflowStepper currentStage={reg.currentStage} compact />
                  <p className="text-sm text-muted-foreground">{reg.formB?.paymentDetails}</p>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approvalMutation.isPending} onClick={() => approvalMutation.mutate({ id: reg.id, status: 'approved' })}>Approve</Button>
                    <Button size="sm" variant="destructive" disabled={approvalMutation.isPending} onClick={() => approvalMutation.mutate({ id: reg.id, status: 'rejected' })}>Reject</Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
