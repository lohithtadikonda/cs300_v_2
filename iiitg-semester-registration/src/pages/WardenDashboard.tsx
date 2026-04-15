import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { registrationsApi } from '@/lib/api';
import { Registration } from '@/types';
import { toast } from 'sonner';
import { LayoutDashboard, Users, CheckSquare } from 'lucide-react';
import WorkflowStepper from '@/components/WorkflowStepper';

const navItems = [
  { title: 'Dashboard', url: '/warden', icon: LayoutDashboard },
  { title: 'Students', url: '/warden/students', icon: Users },
  { title: 'Approvals', url: '/warden/approvals', icon: CheckSquare },
];

function ApprovalCard({
  reg,
  isSubmitting,
  onDecision,
}: {
  reg: Registration;
  isSubmitting: boolean;
  onDecision: (status: 'approved' | 'rejected', remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading font-semibold">{reg.studentName}</p>
          <p className="text-sm text-muted-foreground">{reg.rollNo} • {reg.department} • Cat {reg.category}</p>
        </div>
        <Badge variant="secondary">{reg.currentStage.replace('_', ' ')}</Badge>
      </div>
      <WorkflowStepper currentStage={reg.currentStage} compact />
      <div className="text-sm">
        <p className="text-muted-foreground">Courses: {reg.formA.courses.map(c => c.code).join(', ')}</p>
        <p className="text-muted-foreground">Credits: {reg.formA.totalCredits}</p>
      </div>
      <Textarea placeholder="Add remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
      <div className="flex gap-2">
        <Button size="sm" disabled={isSubmitting} onClick={() => onDecision('approved', remarks)}>Approve</Button>
        <Button size="sm" variant="destructive" disabled={isSubmitting} onClick={() => onDecision('rejected', remarks)}>Reject</Button>
      </div>
    </div>
  );
}

export default function WardenDashboard() {
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', 'all', 'warden'],
    queryFn: registrationsApi.getAll,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: 'approved' | 'rejected'; remarks: string }) =>
      registrationsApi.approve(id, status, remarks),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'Registration approved' : 'Registration rejected');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    },
  });

  const approvedCount = registrations.filter((registration) => registration.currentStage !== 'section_review').length;

  const content = (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-heading font-bold">{registrations.length}</p>
            <p className="text-sm text-muted-foreground">Total Registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-heading font-bold text-warning">{registrations.filter((registration) => registration.currentStage === 'section_review').length}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-heading font-bold text-success">{approvedCount}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading registrations from your backend...</p>
          ) : registrations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No registrations are waiting for warden review.</p>
          ) : (
            registrations.map((reg) => (
              <ApprovalCard
                key={reg.id}
                reg={reg}
                isSubmitting={approvalMutation.isPending}
                onDecision={(status, remarks) => approvalMutation.mutate({ id: reg.id, status, remarks })}
              />
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout navItems={navItems} title="Warden Portal">
      {content}
    </DashboardLayout>
  );
}
