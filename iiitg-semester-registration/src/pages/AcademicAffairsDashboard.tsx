import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { registrationsApi } from '@/lib/api';
import { toast } from 'sonner';
import { LayoutDashboard, GraduationCap, CheckSquare, FileCheck, BookOpen } from 'lucide-react';
import WorkflowStepper from '@/components/WorkflowStepper';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Registration } from '@/types';

const navItems = [
  { title: 'Dashboard', url: '/academic-affairs', icon: LayoutDashboard },
  { title: 'Loan Cases', url: '/academic-affairs/loans', icon: BookOpen },
  { title: 'Final Approval', url: '/academic-affairs/final', icon: FileCheck },
  { title: 'All Registrations', url: '/academic-affairs/all', icon: CheckSquare },
];

export default function AcademicAffairsDashboard() {
  const queryClient = useQueryClient();
  const location = window.location.pathname;

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['registrations', 'all', 'academic-affairs'],
    queryFn: registrationsApi.getAll,
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: 'approved' | 'rejected'; remarks: string }) =>
      registrationsApi.approve(id, status, remarks),
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'Registration updated' : 'Registration rejected');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    },
  });

  const loanStudents = registrations.filter((registration) => registration.formB?.paymentCategory === 'loan');
  const submitted = registrations.filter((registration) => registration.currentStage === 'submitted');
  const allRegs = registrations;

  const showLoans = location.includes('/loans');
  const showFinal = location.includes('/final');
  const showAll = location.includes('/all');

  return (
    <DashboardLayout navItems={navItems} title="Academic Affairs Office">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {!showLoans && !showFinal && !showAll && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-heading font-bold">{allRegs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-heading font-bold text-accent">{loanStudents.length}</p>
                  <p className="text-sm text-muted-foreground">Loan Cases</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-heading font-bold text-warning">{submitted.length}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Final Approval</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-heading font-bold text-success">{allRegs.filter(r => r.currentStage === 'final_approved').length}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="font-heading">Awaiting Final Approval</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <p className="py-8 text-center text-muted-foreground">Loading final approval queue...</p> : submitted.map((reg) => (
                  <RegCard key={reg.id} reg={reg} showFinalApprove onDecision={(status, remarks) => approvalMutation.mutate({ id: reg.id, status, remarks })} />
                ))}
                {submitted.length === 0 && <p className="text-muted-foreground text-center py-8">No pending final approvals.</p>}
              </CardContent>
            </Card>
          </>
        )}

        {showLoans && (
          <Card>
            <CardHeader><CardTitle className="font-heading">Loan Student Forms</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="py-8 text-center text-muted-foreground">Loading loan cases...</p> : loanStudents.map((reg) => <RegCard key={reg.id} reg={reg} onDecision={(status, remarks) => approvalMutation.mutate({ id: reg.id, status, remarks })} />)}
              {loanStudents.length === 0 && <p className="text-muted-foreground text-center py-8">No loan cases.</p>}
            </CardContent>
          </Card>
        )}

        {showFinal && (
          <Card>
            <CardHeader><CardTitle className="font-heading">Final Approval Queue</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="py-8 text-center text-muted-foreground">Loading final approval queue...</p> : submitted.map((reg) => <RegCard key={reg.id} reg={reg} showFinalApprove onDecision={(status, remarks) => approvalMutation.mutate({ id: reg.id, status, remarks })} />)}
              {submitted.length === 0 && <p className="text-muted-foreground text-center py-8">No pending approvals.</p>}
            </CardContent>
          </Card>
        )}

        {showAll && (
          <Card>
            <CardHeader><CardTitle className="font-heading">All Registrations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="py-8 text-center text-muted-foreground">Loading registrations...</p> : allRegs.map((reg) => <RegCard key={reg.id} reg={reg} onDecision={(status, remarks) => approvalMutation.mutate({ id: reg.id, status, remarks })} />)}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

function RegCard({
  reg,
  showFinalApprove,
  onDecision,
}: {
  reg: Registration;
  showFinalApprove?: boolean;
  onDecision?: (status: 'approved' | 'rejected', remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading font-semibold">{reg.studentName}</p>
          <p className="text-sm text-muted-foreground">{reg.rollNo} • {reg.department} • Cat {reg.category}</p>
        </div>
        <Badge variant={reg.currentStage === 'final_approved' ? 'default' : 'secondary'}>
          {reg.currentStage.replace('_', ' ')}
        </Badge>
      </div>
      <WorkflowStepper currentStage={reg.currentStage} compact />
      <div className="text-sm text-muted-foreground">
        Courses: {reg.formA.courses.map(c => c.code).join(', ')} • {reg.formA.totalCredits} credits
      </div>
      {reg.formB && (
        <div className="text-sm text-muted-foreground">
          Payment: {reg.formB.paymentCategory} • ₹{reg.formB.totalFee.toLocaleString()}
          {reg.formB.lateFine && ` (includes ₹${reg.formB.lateFine} late fine)`}
        </div>
      )}
      {showFinalApprove && (
        <>
          <Textarea placeholder="Remarks..." value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onDecision?.('approved', remarks)}>
              Final Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDecision?.('rejected', remarks)}>Reject</Button>
          </div>
        </>
      )}
    </div>
  );
}
