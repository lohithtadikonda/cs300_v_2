import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { LayoutDashboard, FileText, BookOpen, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateRegistrationPayload, coursesApi, registrationsApi } from '@/lib/api';
import {
  StudentCoursesView,
  StudentDashboardView,
  StudentNotificationsView,
  StudentRegistrationView,
} from '@/components/student/StudentViews';
import { toast } from 'sonner';

const navItems = [
  { title: 'Dashboard', url: '/student', icon: LayoutDashboard },
  { title: 'Registration', url: '/student/register', icon: FileText },
  { title: 'My Courses', url: '/student/courses', icon: BookOpen },
  { title: 'Notifications', url: '/student/notifications', icon: Bell },
];

function DashboardView() {
  return null;
}

function RegistrationView() {
  return null;
}

function CoursesView() {
  return null;
}

function NotificationsView() {
  return null;
}

function LoadingState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">{message}</CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registrations', 'my'],
    queryFn: registrationsApi.getMy,
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.list,
  });

  const createRegistrationMutation = useMutation({
    mutationFn: (payload: CreateRegistrationPayload) => registrationsApi.create(payload),
    onSuccess: () => {
      toast.success('Registration submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['registrations', 'my'] });
      navigate('/student');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to submit registration');
    },
  });

  const content = useMemo(() => {
    if (location.pathname === '/student/register') {
      if (isLoadingCourses) return <LoadingState message="Loading courses from your backend..." />;
      return (
        <StudentRegistrationView
          courses={courses}
          isSubmitting={createRegistrationMutation.isPending}
          onSubmit={(payload) => createRegistrationMutation.mutate(payload)}
        />
      );
    }

    if (isLoadingRegistrations) {
      return <LoadingState message="Loading your registration data..." />;
    }

    if (location.pathname === '/student/courses') {
      return <StudentCoursesView registrations={registrations} />;
    }

    if (location.pathname === '/student/notifications') {
      return <StudentNotificationsView registrations={registrations} />;
    }

    return <StudentDashboardView registrations={registrations} />;
  }, [
    courses,
    createRegistrationMutation,
    isLoadingCourses,
    isLoadingRegistrations,
    location.pathname,
    registrations,
  ]);

  void DashboardView;
  void RegistrationView;
  void CoursesView;
  void NotificationsView;

  return (
    <DashboardLayout navItems={navItems} title="Student Portal">
      {content}
    </DashboardLayout>
  );
}
