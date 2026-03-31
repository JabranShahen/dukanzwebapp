export type EventLifecycleStatus = 'draft' | 'scheduled' | 'live' | 'closed';

export interface EventRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
}

export interface EventMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
}

export const EDITABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled'];
export const DISPLAYABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled', 'live', 'closed'];
