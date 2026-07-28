import Badge from '@/components/ui/Badge';
import {
  ApplicationStatus,
  Priority,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PRIORITY_LABELS,
  PRIORITY_BADGE_CLASSES,
} from '@/types';

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return <Badge className={STATUS_BADGE_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return <Badge className={PRIORITY_BADGE_CLASSES[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
