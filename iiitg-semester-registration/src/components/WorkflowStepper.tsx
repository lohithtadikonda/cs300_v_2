import { ApprovalStage } from '@/types';
import { Check, Clock, X, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES: { key: ApprovalStage; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'section_review', label: 'Section Review' },
  { key: 'advisor_review', label: 'Advisor Review' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'final_approved', label: 'Final Approved' },
];

interface WorkflowStepperProps {
  currentStage: ApprovalStage;
  compact?: boolean;
}

export default function WorkflowStepper({ currentStage, compact }: WorkflowStepperProps) {
  const currentIndex = currentStage === 'rejected'
    ? -1
    : STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-2")}>
      {STAGES.map((stage, i) => {
        const isCompleted = currentIndex > i;
        const isCurrent = currentIndex === i;
        const isRejected = currentStage === 'rejected';

        return (
          <div key={stage.key} className="flex items-center gap-1">
            <div className={cn(
              "flex items-center justify-center rounded-full",
              compact ? "w-6 h-6" : "w-8 h-8",
              isCompleted && "bg-success text-success-foreground",
              isCurrent && !isRejected && "bg-accent text-accent-foreground",
              isRejected && isCurrent && "bg-destructive text-destructive-foreground",
              !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
            )}>
              {isCompleted ? <Check className="w-3 h-3" /> :
               isRejected ? <X className="w-3 h-3" /> :
               isCurrent ? <Clock className="w-3 h-3" /> :
               <Circle className="w-3 h-3" />}
            </div>
            {!compact && <span className={cn(
              "text-xs",
              isCompleted && "text-success",
              isCurrent && "text-accent font-medium",
              !isCompleted && !isCurrent && "text-muted-foreground"
            )}>{stage.label}</span>}
            {i < STAGES.length - 1 && (
              <div className={cn(
                "h-0.5",
                compact ? "w-4" : "w-8",
                isCompleted ? "bg-success" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
