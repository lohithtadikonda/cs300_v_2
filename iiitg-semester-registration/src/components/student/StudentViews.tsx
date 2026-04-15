import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkflowStepper from '@/components/WorkflowStepper';
import { CreateRegistrationPayload } from '@/lib/api';
import { Course, PaymentCategory, Registration, RegistrationCategory } from '@/types';
import { AlertTriangle, Bell, BookOpen, CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardViewProps {
  registrations: Registration[];
}

interface RegistrationViewProps {
  courses: Course[];
  isSubmitting: boolean;
  onSubmit: (payload: CreateRegistrationPayload) => void;
}

interface CoursesViewProps {
  registrations: Registration[];
}

const fadeInProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

function formatStageLabel(stage: string) {
  return stage.replace(/_/g, ' ');
}

export function StudentDashboardView({ registrations }: DashboardViewProps) {
  return (
    <motion.div {...fadeInProps} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{registrations.length}</p>
              <p className="text-sm text-muted-foreground">Active Registrations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {registrations.filter((registration) => registration.currentStage === 'final_approved').length}
              </p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {registrations.filter((registration) => !['final_approved', 'rejected'].includes(registration.currentStage)).length}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Registration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {registrations.map((registration) => (
              <div key={registration.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      Semester {registration.formA.semester} — {registration.formA.academicYear}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Category {registration.category} • {registration.formA.totalCredits} credits
                    </p>
                  </div>
                  <Badge variant={registration.currentStage === 'final_approved' ? 'default' : 'secondary'}>
                    {formatStageLabel(registration.currentStage)}
                  </Badge>
                </div>
                <WorkflowStepper currentStage={registration.currentStage} />
                {registration.remarks.length > 0 && (
                  <div className="flex items-start gap-2 rounded bg-warning/10 p-2 text-sm text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>{registration.remarks.join(', ')}</div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export function StudentRegistrationView({ courses, isSubmitting, onSubmit }: RegistrationViewProps) {
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [category, setCategory] = useState<RegistrationCategory>(1);
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('self_financed');
  const [tuitionFee, setTuitionFee] = useState(50000);
  const [hostelFee, setHostelFee] = useState(15000);
  const [otherFees, setOtherFees] = useState(5000);
  const [lateFine, setLateFine] = useState(2000);
  const [paymentDetails, setPaymentDetails] = useState('');

  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);
  const totalFee = tuitionFee + hostelFee + otherFees + (category === 3 ? lateFine : 0);

  const toggleCourse = (course: Course) => {
    setSelectedCourses((previous) =>
      previous.find((current) => current.id === course.id)
        ? previous.filter((current) => current.id !== course.id)
        : [...previous, course],
    );
  };

  const handleSubmit = () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    onSubmit({
      category,
      formA: {
        courseIds: selectedCourses.map((course) => course.id),
        totalCredits,
        semester: selectedCourses[0]?.semester ?? courses[0]?.semester ?? 1,
        academicYear: '2024-25',
      },
      formB:
        category === 1
          ? undefined
          : {
              paymentCategory,
              tuitionFee,
              hostelFee,
              otherFees,
              lateFine: category === 3 ? lateFine : 0,
              totalFee,
              paymentDetails,
            },
    });
  };

  return (
    <motion.div {...fadeInProps} className="space-y-6">
      <Tabs defaultValue="formA">
        <TabsList>
          <TabsTrigger value="formA">Form A — Course Registration</TabsTrigger>
          {category !== 1 && <TabsTrigger value="formB">Form B — Fee Details</TabsTrigger>}
        </TabsList>

        <TabsContent value="formA" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Select Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={String(category)} onValueChange={(value) => setCategory(Number(value) as RegistrationCategory)}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Category 1 — Form A Only</SelectItem>
                  <SelectItem value="2">Category 2 — Form A + Form B</SelectItem>
                  <SelectItem value="3">Category 3 — Form A + Form B + Late Fine</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Course Selection</CardTitle>
              <CardDescription>
                Total Credits: <span className="font-semibold text-accent">{totalCredits}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground">No active courses available from the backend yet.</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <Checkbox
                        checked={selectedCourses.some((selected) => selected.id === course.id)}
                        onCheckedChange={() => toggleCourse(course)}
                      />
                      <div className="flex-1">
                        <span className="mr-2 font-mono text-sm text-accent">{course.code}</span>
                        <span className="font-medium">{course.name}</span>
                      </div>
                      <Badge variant="secondary">{course.credits} cr</Badge>
                      <span className="text-xs text-muted-foreground">{course.department}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {category !== 1 && (
          <TabsContent value="formB" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Fee Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={paymentCategory} onValueChange={(value) => setPaymentCategory(value as PaymentCategory)}>
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loan">Education Loan</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="self_financed">Self Financed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tuition Fee (₹)</Label>
                    <Input type="number" value={tuitionFee} onChange={(event) => setTuitionFee(Number(event.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hostel Fee (₹)</Label>
                    <Input type="number" value={hostelFee} onChange={(event) => setHostelFee(Number(event.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Other Fees (₹)</Label>
                    <Input type="number" value={otherFees} onChange={(event) => setOtherFees(Number(event.target.value) || 0)} />
                  </div>
                  {category === 3 && (
                    <div className="space-y-2">
                      <Label>Late Fine (₹)</Label>
                      <Input type="number" value={lateFine} onChange={(event) => setLateFine(Number(event.target.value) || 0)} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Payment Details</Label>
                  <Input
                    placeholder="e.g., Bank Transfer - SBI / Scholarship ID"
                    value={paymentDetails}
                    onChange={(event) => setPaymentDetails(event.target.value)}
                  />
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Workflow: {paymentCategory === 'loan' && 'Academic Affairs Section →'}
                    {paymentCategory === 'scholarship' && 'Student Affairs Section →'}
                    {paymentCategory === 'self_financed' && 'Finance Section →'} Academic Advisor → Final Submit → Academic Affairs
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">Total Fee: ₹{totalFee.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg" disabled={isSubmitting || courses.length === 0}>
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </div>
    </motion.div>
  );
}

export function StudentCoursesView({ registrations }: CoursesViewProps) {
  const courses = registrations.flatMap((registration) => registration.formA.courses);

  return (
    <motion.div {...fadeInProps}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Enrolled Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No courses enrolled yet.</p>
          ) : (
            <div className="space-y-2">
              {courses.map((course) => (
                <div key={`${course.id}-${course.code}`} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="mr-2 font-mono text-accent">{course.code}</span>
                    <span className="font-medium">{course.name}</span>
                  </div>
                  <Badge variant="secondary">{course.credits} credits</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StudentNotificationsView({ registrations }: CoursesViewProps) {
  const notifications = registrations
    .slice()
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .map((registration) => ({
      id: registration.id,
      title: `Registration moved to ${formatStageLabel(registration.currentStage)}`,
      timestamp: new Date(registration.updatedAt).toLocaleString(),
      highlight: registration.currentStage !== 'final_approved',
    }));

  return (
    <motion.div {...fadeInProps}>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p>No notifications yet. Submit a registration to start the workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-3 ${notification.highlight ? 'bg-accent/5' : 'bg-card'}`}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{notification.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}