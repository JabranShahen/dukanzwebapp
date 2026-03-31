import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EventCategoryMutation, EventCategoryRecord } from '../models/event-category.model';
import { EventRecord } from '../models/event.model';
import { ProductCategory } from '../models/product-category.model';
import { EventCategoryService } from '../services/event-category.service';
import { EventService } from '../services/event.service';
import { ProductCategoryService } from '../services/product-category.service';

interface EventCategoryDisplayRecord extends EventCategoryRecord {
  masterCategory: ProductCategory | null;
}

@Component({
  selector: 'app-event-category-management',
  templateUrl: './event-category-management.component.html',
  styleUrls: ['./event-category-management.component.scss']
})
export class EventCategoryManagementComponent implements OnInit {
  loading = true;
  error = '';
  mutationPending = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  assignmentModalOpen = false;
  assignmentModalMode: 'add' | 'edit' = 'add';
  deleteDialogOpen = false;
  eventId = '';
  selectedEvent: EventRecord | null = null;
  selectedAssignment: EventCategoryRecord | null = null;
  pendingDeleteAssignment: EventCategoryDisplayRecord | null = null;
  assignedCategories: EventCategoryDisplayRecord[] = [];
  availableCategories: ProductCategory[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly eventCategoryService: EventCategoryService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.eventId = (params.get('eventId') || '').trim();
      if (!this.eventId) {
        this.loading = false;
        this.error = 'An event id is required to manage event categories.';
        return;
      }

      this.reload();
    });
  }

  reload(): void {
    if (!this.eventId) {
      return;
    }

    this.loading = true;
    this.error = '';

    forkJoin({
      events: this.eventService.getAll(),
      masterCategories: this.productCategoryService.getAll(),
      assignments: this.eventCategoryService.getByEvent(this.eventId)
    }).subscribe({
      next: ({ events, masterCategories, assignments }) => {
        const selectedEvent = events.find((eventRecord) => eventRecord.id === this.eventId) || null;
        if (!selectedEvent) {
          this.loading = false;
          this.error = 'The selected event could not be found.';
          return;
        }

        this.selectedEvent = selectedEvent;
        this.assignedCategories = this.buildAssignedCategories(assignments, masterCategories);
        this.availableCategories = this.buildAvailableCategories(masterCategories, assignments);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load event-specific category data.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/events']);
  }

  openAddModal(): void {
    this.assignmentModalMode = 'add';
    this.selectedAssignment = null;
    this.assignmentModalOpen = true;
    this.feedbackMessage = '';
  }

  openEditModal(assignment: EventCategoryDisplayRecord): void {
    this.assignmentModalMode = 'edit';
    this.selectedAssignment = {
      id: assignment.id,
      PartitionKey: assignment.PartitionKey,
      partitionKey: assignment.partitionKey,
      eventId: assignment.eventId,
      productCategoryId: assignment.productCategoryId,
      visible: assignment.visible,
      order: assignment.order
    };
    this.assignmentModalOpen = true;
    this.feedbackMessage = '';
  }

  closeAssignmentModal(): void {
    if (!this.mutationPending) {
      this.assignmentModalOpen = false;
      this.selectedAssignment = null;
    }
  }

  onSaveAssignment(payload: EventCategoryMutation): void {
    this.mutationPending = true;

    const request = this.assignmentModalMode === 'edit' && this.selectedAssignment
      ? this.eventCategoryService.update({
          id: this.selectedAssignment.id,
          eventId: this.eventId,
          productCategoryId: this.selectedAssignment.productCategoryId,
          visible: payload.visible,
          order: payload.order
        })
      : this.eventCategoryService.create({
          eventId: this.eventId,
          productCategoryId: payload.productCategoryId,
          visible: payload.visible,
          order: payload.order
        });

    request.subscribe({
      next: () => {
        const mode = this.assignmentModalMode;
        this.mutationPending = false;
        this.assignmentModalOpen = false;
        this.selectedAssignment = null;
        this.setFeedback(
          'success',
          mode === 'edit'
            ? 'Event-category settings updated.'
            : 'Master category assigned to the event.'
        );
        this.reload();
      },
      error: () => {
        const mode = this.assignmentModalMode;
        this.mutationPending = false;
        this.setFeedback(
          'error',
          mode === 'edit'
            ? 'Failed to update event-category settings.'
            : 'Failed to assign the master category to the event.'
        );
      }
    });
  }

  openDeleteDialog(assignment: EventCategoryDisplayRecord): void {
    if (this.mutationPending) {
      return;
    }

    this.pendingDeleteAssignment = assignment;
    this.deleteDialogOpen = true;
    this.feedbackMessage = '';
  }

  closeDeleteDialog(): void {
    if (!this.mutationPending) {
      this.deleteDialogOpen = false;
      this.pendingDeleteAssignment = null;
    }
  }

  confirmDeleteAssignment(): void {
    if (!this.pendingDeleteAssignment) {
      return;
    }

    this.mutationPending = true;
    this.eventCategoryService.delete(this.pendingDeleteAssignment.id).subscribe({
      next: (deleted) => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteAssignment = null;

        if (deleted) {
          this.setFeedback('success', 'Category removed from the event.');
          this.reload();
          return;
        }

        this.setFeedback('error', 'Category could not be removed from the event.');
      },
      error: () => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteAssignment = null;
        this.setFeedback('error', 'Failed to remove the category from the event.');
      }
    });
  }

  assignedCountLabel(): string {
    const count = this.assignedCategories.length;
    return `${count} assigned ${count === 1 ? 'category' : 'categories'}`;
  }

  availableCountLabel(): string {
    const count = this.availableCategories.length;
    return `${count} available ${count === 1 ? 'master category' : 'master categories'}`;
  }

  existingAssignedProductCategoryIds(): string[] {
    return this.assignedCategories.map((assignment) => assignment.productCategoryId.toLowerCase());
  }

  assignmentName(assignment: EventCategoryDisplayRecord): string {
    return assignment.masterCategory?.productCategoryName || 'Unavailable master category';
  }

  assignmentDetail(assignment: EventCategoryDisplayRecord): string {
    if (!assignment.masterCategory) {
      return 'The assignment still exists, but the referenced master category could not be loaded.';
    }

    return 'Master metadata stays on the catalog record. This row only stores event visibility and order.';
  }

  masterStateLabel(assignment: EventCategoryDisplayRecord): string {
    if (!assignment.masterCategory) {
      return 'Unavailable';
    }

    return assignment.masterCategory.visible ? 'Active' : 'Retired';
  }

  masterStateTone(assignment: EventCategoryDisplayRecord): 'success' | 'muted' {
    return assignment.masterCategory?.visible ? 'success' : 'muted';
  }

  assignmentVisibilityLabel(assignment: EventCategoryDisplayRecord): string {
    return assignment.visible ? 'Visible in event' : 'Hidden in event';
  }

  assignmentVisibilityTone(assignment: EventCategoryDisplayRecord): 'success' | 'muted' {
    return assignment.visible ? 'success' : 'muted';
  }

  deleteDialogMessage(): string {
    if (!this.pendingDeleteAssignment) {
      return 'This removes the selected category from the event only.';
    }

    return `This removes "${this.assignmentName(this.pendingDeleteAssignment)}" from this event only. The master category record remains unchanged.`;
  }

  availableCategoryState(category: ProductCategory): string {
    return category.visible ? 'Active master category' : 'Retired master category';
  }

  availableCategoryTone(category: ProductCategory): 'success' | 'muted' {
    return category.visible ? 'success' : 'muted';
  }

  availableCategoriesForModal(): ProductCategory[] {
    if (this.assignmentModalMode !== 'edit' || !this.selectedAssignment) {
      return this.availableCategories;
    }

    const selectedMasterCategory = this.assignedCategories.find(
      (assignment) => assignment.id === this.selectedAssignment?.id
    )?.masterCategory;

    return selectedMasterCategory
      ? [...this.availableCategories, selectedMasterCategory]
      : this.availableCategories;
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private buildAssignedCategories(
    assignments: EventCategoryRecord[],
    masterCategories: ProductCategory[]
  ): EventCategoryDisplayRecord[] {
    const masterCategoryById = new Map(masterCategories.map((category) => [category.id, category]));

    return [...assignments]
      .sort((left, right) => {
        if (left.order !== right.order) {
          return left.order - right.order;
        }

        return left.productCategoryId.localeCompare(right.productCategoryId, undefined, { sensitivity: 'base' });
      })
      .map((assignment) => ({
        ...assignment,
        masterCategory: masterCategoryById.get(assignment.productCategoryId) || null
      }));
  }

  private buildAvailableCategories(
    masterCategories: ProductCategory[],
    assignments: EventCategoryRecord[]
  ): ProductCategory[] {
    const assignedIds = new Set(assignments.map((assignment) => assignment.productCategoryId.toLowerCase()));

    return [...masterCategories]
      .filter((category) => !assignedIds.has((category.id || '').trim().toLowerCase()))
      .sort((left, right) =>
        (left.productCategoryName || '').localeCompare(right.productCategoryName || '', undefined, { sensitivity: 'base' })
      );
  }

  private setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
  }
}
