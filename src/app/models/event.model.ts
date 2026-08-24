import { EventCategoryRecord, EventCategoryMutation } from './event-category.model';
import { EventProductRecord, EventProductMutation } from './event-product.model';

export type EventLifecycleStatus = 'draft' | 'scheduled' | 'live' | 'closed';

export interface EventProductAggregateRecord extends EventProductRecord {}

export interface EventProductAggregateMutation extends EventProductMutation {}

export interface EventCategoryAggregateRecord extends EventCategoryRecord {
  products: EventProductAggregateRecord[];
}

export interface EventCategoryAggregateMutation extends EventCategoryMutation {
  products?: EventProductAggregateMutation[];
}

export interface EventRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  imageURL?: string;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
  order?: number;
  categories?: EventCategoryAggregateRecord[];
}

export interface EventMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  imageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
  order?: number;
  categories?: EventCategoryAggregateMutation[];
}

export const EDITABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled'];
export const DISPLAYABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled', 'live', 'closed'];
export const LAUNCHABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled'];
export const CLOSEABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['live'];
export const REVERTABLE_TO_DRAFT_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['live', 'closed'];
