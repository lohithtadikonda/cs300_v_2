import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { registrationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutDashboard, IndianRupee, CheckSquare } from 'lucide-react';
import WorkflowStepper from '@/components/WorkflowStepper';

const navItems = [
  { title: 'Dashboard', url: '/finance', icon: LayoutDashboard },
  { title: 'Payments', url: '/finance/payments', icon: IndianRupee },
  { title: 'Approvals', url: '/finance/approvals', icon: CheckSquare },
];

export default function FinanceDashboard() {
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', 'all', 'finance'],
    queryFn: registrationsApi.getAll,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => registrationsApi.approve(id, status),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'Payment verified & approved' : 'Registration rejected');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    },
  });

  const selfFinanced = registrations.filter((registration) => registration.formB?.paymentCategory === 'self_financed');

  return (
    <DashboardLayout navItems={navItems} title="Finance Section">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-heading font-bold">{selfFinanced.length}</p>
              <p className="text-sm text-muted-foreground">Self-Financed Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-heading font-bold text-accent">
                ₹{selfFinanced.reduce((sum, r) => sum + (r.formB?.totalFee || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Fees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-heading font-bold text-warning">{selfFinanced.filter(r => r.currentStage === 'section_review').length}</p>
              <p className="text-sm text-muted-foreground">Pending Verification</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Self-Financed Student Forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading finance queue from your backend...</p>
            ) : selfFinanced.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending forms.</p>
            ) : (
              selfFinanced.map((reg) => (
                <div key={reg.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-semibold">{reg.studentName}</p>
                      <p className="text-sm text-muted-foreground">{reg.rollNo} • {reg.department}</p>
                    </div>
                    <Badge>₹{reg.formB?.totalFee.toLocaleString()}</Badge>
                  </div>
                  <WorkflowStepper currentStage={reg.currentStage} compact />
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Tuition:</span> ₹{reg.formB?.tuitionFee.toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Hostel:</span> ₹{reg.formB?.hostelFee.toLocaleString()}</div>
                    <div><span className="text-muted-foreground">Other:</span> ₹{reg.formB?.otherFees.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approvalMutation.isPending} onClick={() => approvalMutation.mutate({ id: reg.id, status: 'approved' })}>Verify & Approve</Button>
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
