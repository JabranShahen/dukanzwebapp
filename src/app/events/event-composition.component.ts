import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { EventCategoryMutation, EventCategoryRecord } from '../models/event-category.model';
import { EventProductMutation, EventProductRecord } from '../models/event-product.model';
import { CLOSEABLE_EVENT_LIFECYCLE_STATUSES, EventMutation, EventRecord, LAUNCHABLE_EVENT_LIFECYCLE_STATUSES, REVERTABLE_TO_DRAFT_EVENT_LIFECYCLE_STATUSES } from '../models/event.model';
import { ProductCategory } from '../models/product-category.model';
import { Product } from '../models/product.model';
import { EventCategoryService } from '../services/event-category.service';
import { EventProductService } from '../services/event-product.service';
import { EventService } from '../services/event.service';
import { BlobStorageService } from '../services/blob-storage.service';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductService } from '../services/product.service';

interface EventCategoryDisplayRecord extends EventCategoryRecord {}

interface EventProductDisplayRecord extends EventProductRecord {}

@Component({
  selector: 'app-event-composition',
  templateUrl: './event-composition.component.html',
  styleUrls: ['./event-composition.component.scss']
})
export class EventCompositionComponent implements OnInit, OnDestroy {
  rootLoading = true;
  rootError = '';
  categoriesLoading = false;
  categoriesError = '';
  productsLoading = false;
  productsError = '';
  categoryMutationPending = false;
  productMutationPending = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  eventMutationPending = false;
  addEventModalOpen = false;
  editEventModalOpen = false;
  selectedEventForEdit: EventRecord | null = null;
  deleteEventDialogOpen = false;
  pendingDeleteEvent: EventRecord | null = null;
  launchEventDialogOpen = false;
  pendingLaunchEvent: EventRecord | null = null;
  closeEventDialogOpen = false;
  pendingCloseEvent: EventRecord | null = null;
  revertToDraftDialogOpen = false;
  pendingRevertEvent: EventRecord | null = null;
  statusFilter: 'all' | 'draft' | 'scheduled' | 'live' | 'closed' = 'all';
  eventImageUrls: Record<string, string> = {};
  masterCategoryImageUrls: Record<string, string> = {};
  eventCategoryImageUrls: Record<string, string> = {};
  masterProductImageUrls: Record<string, string> = {};
  eventProductImageUrls: Record<string, string> = {};

  categoryModalOpen = false;
  categoryModalMode: 'add' | 'edit' = 'add';
  selectedCategoryAssignment: EventCategoryRecord | null = null;
  deleteCategoryDialogOpen = false;
  pendingDeleteCategory: EventCategoryDisplayRecord | null = null;

  productModalOpen = false;
  productModalMode: 'add' | 'edit' = 'add';
  selectedProductAssignment: EventProductRecord | null = null;
  deleteProductDialogOpen = false;
  pendingDeleteProduct: EventProductDisplayRecord | null = null;

  events: EventRecord[] = [];
  masterCategories: ProductCategory[] = [];
  masterProducts: Product[] = [];
  eventCategories: EventCategoryDisplayRecord[] = [];
  eventProducts: EventProductDisplayRecord[] = [];

  selectedEvent: EventRecord | null = null;
  selectedCategory: EventCategoryDisplayRecord | null = null;

  private requestedEventId = '';
  private requestedCategoryId = '';
  private rootContextLoaded = false;
  private readonly subscription = new Subscription();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly eventCategoryService: EventCategoryService,
    private readonly eventProductService: EventProductService,
    private readonly blobStorageService: BlobStorageService,
    private readonly productCategoryService: ProductCategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.route.queryParamMap.subscribe((params) => {
        this.requestedEventId = this.normalizeText(params.get('event'));
        this.requestedCategoryId = this.normalizeText(params.get('category'));
        this.applyQuerySelection();
      })
    );

    this.reload();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  reload(): void {
    this.rootLoading = true;
    this.rootError = '';

    forkJoin({
      events: this.eventService.getAll(),
      masterCategories: this.productCategoryService.getAll(),
      masterProducts: this.productService.getAll()
    }).subscribe({
      next: ({ events, masterCategories, masterProducts }) => {
        this.events = [...events].sort((left, right) => this.compareEvents(left, right));
        this.masterCategories = [...masterCategories].sort((left, right) =>
          (left.productCategoryName || '').localeCompare(right.productCategoryName || '', undefined, { sensitivity: 'base' })
        );
        this.masterProducts = [...masterProducts].sort((left, right) =>
          (left.productName || '').localeCompare(right.productName || '', undefined, { sensitivity: 'base' })
        );
        this.eventImageUrls = {};
        this.masterCategoryImageUrls = {};
        this.masterProductImageUrls = {};
        this.hydrateEventImages(this.events);
        this.hydrateMasterCategoryImages(this.masterCategories);
        this.hydrateMasterProductImages(this.masterProducts);
        this.rootContextLoaded = true;
        this.rootLoading = false;
        this.applyQuerySelection();
      },
      error: () => {
        this.rootContextLoaded = false;
        this.rootLoading = false;
        this.rootError = 'Failed to load event-composition context.';
        this.clearEventSelection();
      }
    });
  }

  goToCategories(): void {
    this.router.navigate(['/dashboard/categories']);
  }

  goToProducts(): void {
    this.router.navigate(['/dashboard/products']);
  }

  openAddEventModal(): void {
    this.addEventModalOpen = true;
    this.setFeedback('', undefined);
  }

  closeAddEventModal(): void {
    if (!this.eventMutationPending) {
      this.addEventModalOpen = false;
    }
  }

  openEditEventModal(eventRecord: EventRecord): void {
    this.selectedEventForEdit = { ...eventRecord };
    this.editEventModalOpen = true;
    this.setFeedback('', undefined);
  }

  closeEditEventModal(): void {
    if (!this.eventMutationPending) {
      this.editEventModalOpen = false;
      this.selectedEventForEdit = null;
    }
  }

  onEditEvent(payload: EventMutation): void {
    this.eventMutationPending = true;
    const existingOrder = this.events.find((e) => e.id === payload.id)?.order ?? 0;
    this.resolveEventImagePath(payload).pipe(
      switchMap((imageURL) => this.eventService.update({ ...payload, imageURL, order: existingOrder }))
    ).subscribe({
      next: (updatedEvent) => {
        this.eventMutationPending = false;
        this.editEventModalOpen = false;
        this.selectedEventForEdit = null;
        this.setFeedback('Event container updated.', 'success');
        this.reloadAfterEventMutation(updatedEvent?.id || (payload.id || ''));
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to update event container.', 'error');
      }
    });
  }

  openDeleteEventDialog(eventRecord: EventRecord): void {
    if (this.eventMutationPending) {
      return;
    }

    this.pendingDeleteEvent = eventRecord;
    this.deleteEventDialogOpen = true;
    this.setFeedback('', undefined);
  }

  closeDeleteEventDialog(): void {
    if (!this.eventMutationPending) {
      this.deleteEventDialogOpen = false;
      this.pendingDeleteEvent = null;
    }
  }

  confirmDeleteEvent(): void {
    if (!this.pendingDeleteEvent) {
      return;
    }

    const deletedId = this.pendingDeleteEvent.id;
    this.eventMutationPending = true;
    this.eventService.delete(deletedId).subscribe({
      next: (deleted) => {
        this.eventMutationPending = false;
        this.deleteEventDialogOpen = false;
        this.pendingDeleteEvent = null;

        if (!deleted) {
          this.setFeedback('Event could not be deleted.', 'error');
          return;
        }

        if (this.selectedEvent?.id === deletedId) {
          this.clearEventSelection();
          this.syncQueryState('', '', true);
        }

        this.setFeedback('Event deleted.', 'success');
        this.reload();
      },
      error: (err: Error) => {
        this.eventMutationPending = false;
        this.deleteEventDialogOpen = false;
        this.pendingDeleteEvent = null;
        this.setFeedback(err?.message || 'Failed to delete event.', 'error');
      }
    });
  }

  canLaunch(eventRecord: EventRecord): boolean {
    const status = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    return LAUNCHABLE_EVENT_LIFECYCLE_STATUSES.includes(status as never);
  }

  canClose(eventRecord: EventRecord): boolean {
    const status = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    return CLOSEABLE_EVENT_LIFECYCLE_STATUSES.includes(status as never);
  }

  launchEvent(eventRecord: EventRecord): void {
    this.pendingLaunchEvent = eventRecord;
    this.launchEventDialogOpen = true;
    this.setFeedback('', undefined);
  }

  confirmLaunchEvent(): void {
    if (!this.pendingLaunchEvent) {
      return;
    }

    const eventRecord = this.pendingLaunchEvent;
    this.launchEventDialogOpen = false;
    this.pendingLaunchEvent = null;
    this.eventMutationPending = true;
    this.setFeedback('', undefined);

    this.eventService.launch(eventRecord.id).subscribe({
      next: () => {
        this.eventMutationPending = false;
        this.setFeedback('Event is now live.', 'success');
        this.reloadAfterEventMutation(eventRecord.id);
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to set event live — make sure at least one category with products is assigned.', 'error');
      }
    });
  }

  closeLaunchEventDialog(): void {
    if (!this.eventMutationPending) {
      this.launchEventDialogOpen = false;
      this.pendingLaunchEvent = null;
    }
  }

  closeEvent(eventRecord: EventRecord): void {
    this.pendingCloseEvent = eventRecord;
    this.closeEventDialogOpen = true;
    this.setFeedback('', undefined);
  }

  confirmCloseEvent(): void {
    if (!this.pendingCloseEvent) {
      return;
    }

    const eventRecord = this.pendingCloseEvent;
    this.closeEventDialogOpen = false;
    this.pendingCloseEvent = null;
    this.eventMutationPending = true;
    this.setFeedback('', undefined);

    this.eventService.close(eventRecord.id).subscribe({
      next: () => {
        this.eventMutationPending = false;
        this.setFeedback('Event set to closed.', 'success');
        this.reloadAfterEventMutation(eventRecord.id);
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to close event.', 'error');
      }
    });
  }

  closeCloseEventDialog(): void {
    if (!this.eventMutationPending) {
      this.closeEventDialogOpen = false;
      this.pendingCloseEvent = null;
    }
  }

  canRevertToDraft(eventRecord: EventRecord): boolean {
    const status = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    return REVERTABLE_TO_DRAFT_EVENT_LIFECYCLE_STATUSES.includes(status as never);
  }

  revertEventToDraft(eventRecord: EventRecord): void {
    this.pendingRevertEvent = eventRecord;
    this.revertToDraftDialogOpen = true;
    this.setFeedback('', undefined);
  }

  confirmRevertToDraft(): void {
    if (!this.pendingRevertEvent) {
      return;
    }

    const eventRecord = this.pendingRevertEvent;
    this.revertToDraftDialogOpen = false;
    this.pendingRevertEvent = null;
    this.eventMutationPending = true;
    this.setFeedback('', undefined);

    this.eventService.revertToDraft(eventRecord.id).subscribe({
      next: () => {
        this.eventMutationPending = false;
        this.setFeedback('Event reverted to draft.', 'success');
        this.reloadAfterEventMutation(eventRecord.id);
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to revert event to draft.', 'error');
      }
    });
  }

  closeRevertToDraftDialog(): void {
    if (!this.eventMutationPending) {
      this.revertToDraftDialogOpen = false;
      this.pendingRevertEvent = null;
    }
  }

  setStatusFilter(status: 'all' | 'draft' | 'scheduled' | 'live' | 'closed'): void {
    this.statusFilter = status;
  }

  filteredEvents(): EventRecord[] {
    if (this.statusFilter === 'all') {
      return this.events;
    }

    return this.events.filter((e) =>
      (e.lifecycleStatus || '').trim().toLowerCase() === this.statusFilter
    );
  }

  deleteEventMessage(): string {
    if (!this.pendingDeleteEvent) {
      return 'This will permanently delete the event container.';
    }

    return `Delete "${this.pendingDeleteEvent.eventName}"? This removes the event container and cannot be undone.`;
  }

  onAddEvent(payload: EventMutation): void {
    this.eventMutationPending = true;
    const nextOrder = this.events.length === 0 ? 0 : Math.max(...this.events.map((e) => e.order ?? 0)) + 1;
    this.resolveEventImagePath(payload).pipe(
      switchMap((imageURL) => this.eventService.create({
        ...payload,
        imageURL,
        order: nextOrder
      }))
    ).subscribe({
      next: (createdEvent) => {
        this.eventMutationPending = false;
        this.addEventModalOpen = false;
        this.setFeedback('Event container created.', 'success');
        this.reloadAfterEventMutation(createdEvent?.id || '');
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to create event container.', 'error');
      }
    });
  }

  selectEvent(eventRecord: EventRecord): void {
    this.setFeedback('', undefined);
    this.syncQueryState(eventRecord.id, '');
  }

  selectCategory(category: EventCategoryDisplayRecord): void {
    if (!this.selectedEvent) {
      return;
    }

    this.setFeedback('', undefined);
    this.syncQueryState(this.selectedEvent.id, category.id);
  }

  onMasterCategoryCreated(category: ProductCategory): void {
    this.masterCategories = [...this.masterCategories, category].sort((left, right) =>
      (left.productCategoryName || '').localeCompare(right.productCategoryName || '', undefined, { sensitivity: 'base' })
    );

    const imagePath = (category.productCategoryImageURL || '').trim();
    if (imagePath) {
      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => { this.masterCategoryImageUrls[category.id] = imageUrl || ''; },
        error: () => { this.masterCategoryImageUrls[category.id] = ''; }
      });
    }
  }

  onMasterProductCreated(product: Product): void {
    this.masterProducts = [...this.masterProducts, product].sort((left, right) =>
      (left.productName || '').localeCompare(right.productName || '', undefined, { sensitivity: 'base' })
    );

    const imagePath = (product.imageURL || '').trim();
    if (imagePath) {
      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => { this.masterProductImageUrls[product.id] = imageUrl || ''; },
        error: () => { this.masterProductImageUrls[product.id] = ''; }
      });
    }
  }

  openAddCategoryModal(): void {
    this.categoryModalMode = 'add';
    this.selectedCategoryAssignment = null;
    this.categoryModalOpen = true;
    this.setFeedback('', undefined);
  }

  openEditCategoryModal(assignment: EventCategoryDisplayRecord): void {
    this.categoryModalMode = 'edit';
    this.selectedCategoryAssignment = {
      id: assignment.id,
      PartitionKey: assignment.PartitionKey,
      partitionKey: assignment.partitionKey,
      eventId: assignment.eventId,
      productCategoryId: assignment.productCategoryId,
      categoryName: assignment.categoryName,
      imageURL: assignment.imageURL,
      visible: assignment.visible,
      order: assignment.order
    };
    this.categoryModalOpen = true;
    this.setFeedback('', undefined);
  }

  closeCategoryModal(): void {
    if (!this.categoryMutationPending) {
      this.categoryModalOpen = false;
      this.selectedCategoryAssignment = null;
    }
  }

  onSaveCategoryAssignment(payload: EventCategoryMutation): void {
    if (!this.selectedEvent) {
      return;
    }

    const assignmentOrder =
      this.categoryModalMode === 'edit' && this.selectedCategoryAssignment
        ? this.selectedCategoryAssignment.order
        : this.nextCategoryOrder();

    this.categoryMutationPending = true;
    const request = this.resolveEventCategoryImagePath(payload).pipe(
      switchMap((imageURL) => this.categoryModalMode === 'edit' && this.selectedCategoryAssignment
        ? this.eventCategoryService.update({
            id: this.selectedCategoryAssignment.id,
            eventId: this.selectedEvent.id,
            productCategoryId: this.selectedCategoryAssignment.productCategoryId,
            categoryName: payload.categoryName,
            imageURL,
            visible: payload.visible,
            order: assignmentOrder
          })
        : this.eventCategoryService.create({
            eventId: this.selectedEvent.id,
            productCategoryId: payload.productCategoryId,
            categoryName: payload.categoryName,
            imageURL,
            visible: payload.visible,
            order: assignmentOrder
          }))
    );

    request.subscribe({
      next: (savedAssignment) => {
        const mode = this.categoryModalMode;
        const savedDisplayRecord = this.upsertEventCategory(savedAssignment);
        this.categoryMutationPending = false;
        this.categoryModalOpen = false;
        this.selectedCategoryAssignment = null;
        this.setFeedback(
          mode === 'edit' ? 'Event-category settings updated.' : 'Master category assigned to the selected event.',
          'success'
        );
        if (mode === 'add' && !this.selectedCategory) {
          this.selectedCategory = savedDisplayRecord;
          this.clearProductSelection();
          this.syncQueryState(this.selectedEvent!.id, savedDisplayRecord.id, true);
        }
      },
      error: () => {
        const mode = this.categoryModalMode;
        this.categoryMutationPending = false;
        this.setFeedback(
          mode === 'edit'
            ? 'Failed to update the event-category assignment.'
            : 'Failed to assign the master category to the selected event.',
          'error'
        );
      }
    });
  }

  openDeleteCategoryDialog(assignment: EventCategoryDisplayRecord): void {
    if (this.categoryMutationPending) {
      return;
    }

    this.pendingDeleteCategory = assignment;
    this.deleteCategoryDialogOpen = true;
    this.setFeedback('', undefined);
  }

  closeDeleteCategoryDialog(): void {
    if (!this.categoryMutationPending) {
      this.deleteCategoryDialogOpen = false;
      this.pendingDeleteCategory = null;
    }
  }

  confirmDeleteCategory(): void {
    if (!this.pendingDeleteCategory || !this.selectedEvent) {
      return;
    }

    this.categoryMutationPending = true;
    this.eventCategoryService.delete(this.pendingDeleteCategory.id).subscribe({
      next: (deleted) => {
        const deletedCategoryId = this.pendingDeleteCategory?.id || '';
        this.categoryMutationPending = false;
        this.deleteCategoryDialogOpen = false;
        this.pendingDeleteCategory = null;

        if (!deleted) {
          this.setFeedback('Category could not be removed from the event.', 'error');
          return;
        }

        this.setFeedback('Category removed from the selected event.', 'success');
        this.removeEventCategory(deletedCategoryId);
        if (this.selectedCategory?.id === deletedCategoryId) {
          this.clearCategorySelection();
          this.syncQueryState(this.selectedEvent.id, '');
          return;
        }
      },
      error: () => {
        this.categoryMutationPending = false;
        this.deleteCategoryDialogOpen = false;
        this.pendingDeleteCategory = null;
        this.setFeedback('Failed to remove the category from the selected event.', 'error');
      }
    });
  }

  openAddProductModal(): void {
    this.productModalMode = 'add';
    this.selectedProductAssignment = null;
    this.productModalOpen = true;
    this.setFeedback('', undefined);
  }

  openEditProductModal(assignment: EventProductDisplayRecord): void {
    this.productModalMode = 'edit';
    this.selectedProductAssignment = {
      id: assignment.id,
      PartitionKey: assignment.PartitionKey,
      partitionKey: assignment.partitionKey,
      eventId: assignment.eventId,
      eventCategoryId: assignment.eventCategoryId,
      productId: assignment.productId,
      productName: assignment.productName,
      productDescription: assignment.productDescription,
      imageURL: assignment.imageURL,
      displayPercentage: assignment.displayPercentage,
      displayUnitName: assignment.displayUnitName,
      orignalPrice: assignment.orignalPrice,
      currentPrice: assignment.currentPrice,
      currentCost: assignment.currentCost,
      unitName: assignment.unitName,
      visible: assignment.visible,
      order: assignment.order
    };
    this.productModalOpen = true;
    this.setFeedback('', undefined);
  }

  closeProductModal(): void {
    if (!this.productMutationPending) {
      this.productModalOpen = false;
      this.selectedProductAssignment = null;
    }
  }

  onSaveProductAssignment(payload: EventProductMutation): void {
    if (!this.selectedEvent || !this.selectedCategory) {
      return;
    }

    const assignmentOrder =
      this.productModalMode === 'edit' && this.selectedProductAssignment
        ? this.selectedProductAssignment.order
        : this.nextProductOrder();

    this.productMutationPending = true;
    const request = this.resolveEventProductImagePath(payload).pipe(
      switchMap((imageURL) => this.productModalMode === 'edit' && this.selectedProductAssignment
        ? this.eventProductService.update({
            id: this.selectedProductAssignment.id,
            eventId: this.selectedEvent.id,
            eventCategoryId: this.selectedCategory.id,
            productId: this.selectedProductAssignment.productId,
            productName: payload.productName,
            productDescription: payload.productDescription,
            imageURL,
            displayPercentage: payload.displayPercentage,
            displayUnitName: payload.displayUnitName,
            orignalPrice: payload.orignalPrice,
            currentPrice: payload.currentPrice,
            currentCost: payload.currentCost,
            unitName: payload.unitName,
            visible: payload.visible,
            order: assignmentOrder
          })
        : this.eventProductService.create({
            eventId: this.selectedEvent.id,
            eventCategoryId: this.selectedCategory.id,
            productId: payload.productId,
            productName: payload.productName,
            productDescription: payload.productDescription,
            imageURL,
            displayPercentage: payload.displayPercentage,
            displayUnitName: payload.displayUnitName,
            orignalPrice: payload.orignalPrice,
            currentPrice: payload.currentPrice,
            currentCost: payload.currentCost,
            unitName: payload.unitName,
            visible: payload.visible,
            order: assignmentOrder
          }))
    );

    request.subscribe({
      next: (savedAssignment) => {
        const mode = this.productModalMode;
        this.upsertEventProduct(savedAssignment);
        this.productMutationPending = false;
        this.productModalOpen = false;
        this.selectedProductAssignment = null;
        this.setFeedback(
          mode === 'edit' ? 'Event-product settings updated.' : 'Master product assigned to the selected event category.',
          'success'
        );
      },
      error: () => {
        const mode = this.productModalMode;
        this.productMutationPending = false;
        this.setFeedback(
          mode === 'edit'
            ? 'Failed to update the event-product assignment.'
            : 'Failed to assign the master product to the selected event category.',
          'error'
        );
      }
    });
  }

  openDeleteProductDialog(assignment: EventProductDisplayRecord): void {
    if (this.productMutationPending) {
      return;
    }

    this.pendingDeleteProduct = assignment;
    this.deleteProductDialogOpen = true;
    this.setFeedback('', undefined);
  }

  closeDeleteProductDialog(): void {
    if (!this.productMutationPending) {
      this.deleteProductDialogOpen = false;
      this.pendingDeleteProduct = null;
    }
  }

  confirmDeleteProduct(): void {
    if (!this.pendingDeleteProduct || !this.selectedCategory) {
      return;
    }

    this.productMutationPending = true;
    const deletedProductId = this.pendingDeleteProduct.id;
    this.eventProductService.delete(this.pendingDeleteProduct.id).subscribe({
      next: (deleted) => {
        this.productMutationPending = false;
        this.deleteProductDialogOpen = false;
        this.pendingDeleteProduct = null;

        if (!deleted) {
          this.setFeedback('Product assignment could not be removed.', 'error');
          return;
        }

        this.setFeedback('Product removed from the selected event category.', 'success');
        this.removeEventProduct(deletedProductId);
      },
      error: () => {
        this.productMutationPending = false;
        this.deleteProductDialogOpen = false;
        this.pendingDeleteProduct = null;
        this.setFeedback('Failed to remove the product assignment.', 'error');
      }
    });
  }

  onEventDrop(event: CdkDragDrop<EventRecord[]>): void {
    if (this.eventMutationPending || event.previousIndex === event.currentIndex) {
      return;
    }

    const reordered = [...this.events];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const updates = reordered.map((eventRecord, index) => ({
      ...eventRecord,
      order: index
    }));

    this.eventMutationPending = true;
    this.events = updates;

    forkJoin(updates.map((payload) => this.resolveEventImagePath(payload).pipe(
      switchMap((imageURL) => this.eventService.update({ ...payload, imageURL }))
    ))).subscribe({
      next: (saved) => {
        this.eventMutationPending = false;
        this.events = [...saved].sort((a, b) => this.compareEvents(a, b));
        this.hydrateEventImages(this.events);
        this.setFeedback('Events reordered.', 'success');
      },
      error: () => {
        this.eventMutationPending = false;
        this.setFeedback('Failed to reorder events.', 'error');
        this.reload();
      }
    });
  }
  onCategoryDrop(event: CdkDragDrop<EventCategoryDisplayRecord[]>): void {
    if (!this.selectedEvent || this.categoryMutationPending || event.previousIndex === event.currentIndex) {
      return;
    }

    const reordered = [...this.eventCategories];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const updates = reordered.map((assignment, index) => ({
      ...assignment,
      order: index
    }));

    this.categoryMutationPending = true;
    this.eventCategories = this.buildAssignedCategories(updates, this.masterCategories);

    forkJoin(updates.map((payload) => this.eventCategoryService.update(payload))).subscribe({
      next: (savedAssignments) => {
        this.categoryMutationPending = false;
        this.eventCategories = this.buildAssignedCategories(savedAssignments, this.masterCategories);
        this.hydrateEventCategoryImages(this.eventCategories);
        this.selectedCategory = this.eventCategories.find((assignment) => assignment.id === this.selectedCategory?.id) || null;
        this.setFeedback('Event categories reordered.', 'success');
      },
      error: () => {
        this.categoryMutationPending = false;
        this.setFeedback('Failed to reorder event categories.', 'error');
        this.loadEventCategories(this.selectedEvent!.id);
      }
    });
  }

  onProductDrop(event: CdkDragDrop<EventProductDisplayRecord[]>): void {
    if (!this.selectedCategory || this.productMutationPending || event.previousIndex === event.currentIndex) {
      return;
    }

    const reordered = [...this.eventProducts];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);

    const updates = reordered.map((assignment, index) => ({
      ...assignment,
      order: index
    }));

    this.productMutationPending = true;
    this.eventProducts = this.buildAssignedProducts(updates, this.masterProducts);

    forkJoin(updates.map((payload) => this.eventProductService.update(payload))).subscribe({
      next: (savedAssignments) => {
        this.productMutationPending = false;
        this.eventProducts = this.buildAssignedProducts(savedAssignments, this.masterProducts);
        this.hydrateEventProductImages(this.eventProducts);
        this.setFeedback('Event products reordered.', 'success');
      },
      error: () => {
        this.productMutationPending = false;
        this.setFeedback('Failed to reorder event products.', 'error');
        this.loadEventProducts(this.selectedCategory!);
      }
    });
  }

  eventCountLabel(): string {
    const count = this.events.length;
    return `${count} ${count === 1 ? 'event' : 'events'}`;
  }

  assignedCategoryCountLabel(): string {
    const count = this.eventCategories.length;
    return `${count} assigned ${count === 1 ? 'category' : 'categories'}`;
  }

  availableCategoryCountLabel(): string {
    const count = this.availableCategories().length;
    return `${count} available ${count === 1 ? 'master category' : 'master categories'}`;
  }

  assignedProductCountLabel(): string {
    const count = this.eventProducts.length;
    return `${count} assigned ${count === 1 ? 'product' : 'products'}`;
  }

  availableProductCountLabel(): string {
    const count = this.availableProducts().length;
    return `${count} available ${count === 1 ? 'master product' : 'master products'}`;
  }

  availableCategories(): ProductCategory[] {
    const assignedIds = new Set(this.eventCategories.map((assignment) => assignment.productCategoryId.toLowerCase()));

    return this.masterCategories
      .filter((category) => !assignedIds.has((category.id || '').trim().toLowerCase()))
      .sort((left, right) =>
        (left.productCategoryName || '').localeCompare(right.productCategoryName || '', undefined, { sensitivity: 'base' })
      );
  }

  availableProducts(): Product[] {
    const assignedIds = new Set(this.eventProducts.map((assignment) => assignment.productId.toLowerCase()));

    return this.masterProducts
      .filter((product) => !assignedIds.has((product.id || '').trim().toLowerCase()))
      .sort((left, right) =>
        (left.productName || '').localeCompare(right.productName || '', undefined, { sensitivity: 'base' })
      );
  }

  availableCategoriesForModal(): ProductCategory[] {
    if (this.categoryModalMode !== 'edit' || !this.selectedCategoryAssignment) {
      return this.availableCategories();
    }

    const assignedMasterCategoryId = this.eventCategories.find(
      (assignment) => assignment.id === this.selectedCategoryAssignment?.id
    )?.productCategoryId;
    const selectedMasterCategory = this.masterCategories.find((c) => c.id === assignedMasterCategoryId);

    return selectedMasterCategory ? [...this.availableCategories(), selectedMasterCategory] : this.availableCategories();
  }

  availableProductsForModal(): Product[] {
    if (this.productModalMode !== 'edit' || !this.selectedProductAssignment) {
      return this.availableProducts();
    }

    const assignedMasterProductId = this.eventProducts.find(
      (assignment) => assignment.id === this.selectedProductAssignment?.id
    )?.productId;
    const selectedMasterProduct = this.masterProducts.find((p) => p.id === assignedMasterProductId);

    return selectedMasterProduct ? [...this.availableProducts(), selectedMasterProduct] : this.availableProducts();
  }

  existingAssignedCategoryIds(): string[] {
    return this.eventCategories.map((assignment) => assignment.productCategoryId.toLowerCase());
  }

  existingAssignedProductIds(): string[] {
    return this.eventProducts.map((assignment) => assignment.productId.toLowerCase());
  }

  eventLifecycleLabel(eventRecord: EventRecord): string {
    const value = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    if (!value) {
      return 'Draft';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  eventLifecycleTone(eventRecord: EventRecord): 'success' | 'muted' {
    const value = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    return value === 'scheduled' || value === 'live' ? 'success' : 'muted';
  }

  eventScheduleSummary(eventRecord: EventRecord): string {
    const start = this.formatUtcDate(eventRecord.startDateUtc);
    const end = this.formatUtcDate(eventRecord.endDateUtc);

    if (start && end) {
      return `${start} to ${end}`;
    }

    if (start) {
      return `Starts ${start}`;
    }

    if (end) {
      return `Ends ${end}`;
    }

    return 'No schedule window set';
  }

  categoryName(assignment: EventCategoryDisplayRecord): string {
    return (assignment.categoryName || '').trim() || 'Unnamed category';
  }

  categoryDetail(assignment: EventCategoryDisplayRecord): string {
    return assignment.visible ? 'Visible in this event.' : 'Hidden in this event.';
  }

  assignmentVisibilityLabel(value: boolean, scope: 'category' | 'product'): string {
    if (scope === 'category') {
      return value ? 'Visible in event' : 'Hidden in event';
    }

    return value ? 'Visible in category' : 'Hidden in category';
  }

  assignmentVisibilityTone(value: boolean): 'success' | 'muted' {
    return value ? 'success' : 'muted';
  }

  productName(assignment: EventProductDisplayRecord): string {
    return (assignment.productName || '').trim() || 'Unnamed product';
  }

  productDetail(assignment: EventProductDisplayRecord): string {
    return this.productPriceSummary(assignment);
  }

  productPriceSummary(assignment: EventProductDisplayRecord): string {
    const currentPrice = Number.isFinite(assignment.currentPrice) ? assignment.currentPrice.toFixed(2) : '0.00';
    const originalPrice = Number.isFinite(assignment.orignalPrice) ? assignment.orignalPrice.toFixed(2) : '0.00';
    const currentCost = Number.isFinite(assignment.currentCost) ? assignment.currentCost.toFixed(2) : '0.00';
    const unit = (assignment.unitName || '').trim();
    const unitSuffix = unit ? ` per ${unit}` : '';
    return `Event price ${currentPrice}${unitSuffix}. Original ${originalPrice}. Cost ${currentCost}.`;
  }



  eventImageUrl(eventRecord: EventRecord): string {
    return this.eventImageUrls[eventRecord.id] || '';
  }

  categoryImageUrl(assignment: EventCategoryDisplayRecord): string {
    return this.eventCategoryImageUrls[assignment.id] || '';
  }

  productImageUrl(assignment: EventProductDisplayRecord): string {
    return this.eventProductImageUrls[assignment.id] || '';
  }

  deleteCategoryMessage(): string {
    if (!this.pendingDeleteCategory) {
      return 'This removes the selected category from the event only.';
    }

    return `This removes "${this.categoryName(this.pendingDeleteCategory)}" from the selected event only. The master category record remains unchanged.`;
  }

  deleteProductMessage(): string {
    if (!this.pendingDeleteProduct) {
      return 'This removes the selected product from the event category only.';
    }

    return `This removes "${this.productName(this.pendingDeleteProduct)}" from the selected event category only. The master product record remains unchanged.`;
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }

  private applyQuerySelection(): void {
    if (!this.rootContextLoaded || this.rootLoading) {
      return;
    }

    const nextEvent = this.events.find((eventRecord) => eventRecord.id === this.requestedEventId) || null;

    if (this.requestedEventId && !nextEvent) {
      this.clearEventSelection();
      this.setFeedback('The requested event could not be found.', 'error');
      this.syncQueryState('', '', true);
      return;
    }

    const currentEventId = this.selectedEvent?.id || '';
    const nextEventId = nextEvent?.id || '';

    if (!nextEvent) {
      this.clearEventSelection();
      return;
    }

    this.selectedEvent = nextEvent;
    if (currentEventId !== nextEventId || this.eventCategories.length === 0) {
      this.clearEventCategoryState();
      this.loadEventCategories(nextEventId);
      return;
    }

    this.applyCategorySelection();
  }

  private loadEventCategories(eventId: string): void {
    this.categoriesLoading = true;
    this.categoriesError = '';

    this.eventCategoryService.getByEvent(eventId).subscribe({
      next: (assignments) => {
        this.categoriesLoading = false;
        this.eventCategories = this.buildAssignedCategories(assignments, this.masterCategories);
        this.hydrateEventCategoryImages(this.eventCategories);
        this.applyCategorySelection();
      },
      error: () => {
        this.categoriesLoading = false;
        this.categoriesError = 'Failed to load categories for the selected event.';
        this.clearCategorySelection();
      }
    });
  }

  private applyCategorySelection(): void {
    if (!this.selectedEvent) {
      return;
    }

    const nextCategory = this.eventCategories.find((assignment) => assignment.id === this.requestedCategoryId) || null;

    if (this.requestedCategoryId && !nextCategory) {
      this.clearCategorySelection();
      this.setFeedback('The requested event category is not available for the selected event.', 'error');
      this.syncQueryState(this.selectedEvent.id, '', true);
      return;
    }

    const currentCategoryId = this.selectedCategory?.id || '';
    const nextCategoryId = nextCategory?.id || '';

    if (!nextCategory) {
      this.clearCategorySelection();
      return;
    }

    this.selectedCategory = nextCategory;
    if (currentCategoryId !== nextCategoryId || this.eventProducts.length === 0) {
      this.clearProductSelection();
      this.loadEventProducts(nextCategory);
    }
  }

  private loadEventProducts(category: EventCategoryDisplayRecord): void {
    this.productsLoading = true;
    this.productsError = '';

    this.eventProductService.getByEventCategory(category.id).subscribe({
      next: (assignments) => {
        this.productsLoading = false;
        this.eventProducts = this.buildAssignedProducts(assignments, this.masterProducts);
        this.hydrateEventProductImages(this.eventProducts);
      },
      error: () => {
        this.productsLoading = false;
        this.productsError = 'Failed to load products for the selected event category.';
        this.eventProducts = [];
      }
    });
  }

  private buildAssignedCategories(
    assignments: Array<EventCategoryRecord | EventCategoryMutation>,
    _masterCategories: ProductCategory[]
  ): EventCategoryDisplayRecord[] {
    return [...assignments]
      .sort((left, right) => {
        const leftOrder = left.order ?? 0;
        const rightOrder = right.order ?? 0;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return (left.productCategoryId || '').localeCompare(right.productCategoryId || '', undefined, { sensitivity: 'base' });
      })
      .map((assignment) => ({
        id: (assignment.id || '').trim(),
        PartitionKey: assignment.PartitionKey,
        partitionKey: assignment.partitionKey,
        eventId: (assignment.eventId || '').trim(),
        productCategoryId: (assignment.productCategoryId || '').trim(),
        categoryName: (assignment.categoryName || '').trim(),
        imageURL: (assignment.imageURL || '').trim(),
        visible: !!assignment.visible,
        order: this.normalizeOrder(assignment.order)
      }));
  }

  private buildAssignedProducts(
    assignments: Array<EventProductRecord | EventProductMutation>,
    _masterProducts: Product[]
  ): EventProductDisplayRecord[] {
    return [...assignments]
      .sort((left, right) => {
        const leftOrder = left.order ?? 0;
        const rightOrder = right.order ?? 0;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return (left.productId || '').localeCompare(right.productId || '', undefined, { sensitivity: 'base' });
      })
      .map((assignment) => ({
        id: (assignment.id || '').trim(),
        PartitionKey: assignment.PartitionKey,
        partitionKey: assignment.partitionKey,
        eventId: (assignment.eventId || '').trim(),
        eventCategoryId: (assignment.eventCategoryId || '').trim(),
        productId: (assignment.productId || '').trim(),
        productName: (assignment.productName || '').trim(),
        productDescription: (assignment.productDescription || '').trim(),
        imageURL: (assignment.imageURL || '').trim(),
        displayPercentage: this.normalizeMoney(assignment.displayPercentage),
        displayUnitName: (assignment.displayUnitName || '').trim(),
        orignalPrice: this.normalizeMoney(assignment.orignalPrice),
        currentPrice: this.normalizeMoney(assignment.currentPrice),
        currentCost: this.normalizeMoney(assignment.currentCost),
        unitName: (assignment.unitName || '').trim(),
        visible: !!assignment.visible,
        order: this.normalizeOrder(assignment.order)
      }));
  }

  private clearEventSelection(): void {
    this.selectedEvent = null;
    this.clearEventCategoryState();
    this.categoriesLoading = false;
    this.categoriesError = '';
  }

  private clearEventCategoryState(): void {
    this.eventCategories = [];
    this.eventCategoryImageUrls = {};
    this.clearCategorySelection();
  }

  private clearCategorySelection(): void {
    this.selectedCategory = null;
    this.clearProductSelection();
  }

  private clearProductSelection(): void {
    this.eventProducts = [];
    this.eventProductImageUrls = {};
    this.productsLoading = false;
    this.productsError = '';
  }

  private nextCategoryOrder(): number {
    if (this.eventCategories.length === 0) {
      return 0;
    }

    return Math.max(...this.eventCategories.map((assignment) => this.normalizeOrder(assignment.order))) + 1;
  }

  private nextProductOrder(): number {
    if (this.eventProducts.length === 0) {
      return 0;
    }

    return Math.max(...this.eventProducts.map((assignment) => this.normalizeOrder(assignment.order))) + 1;
  }

  private upsertEventCategory(savedAssignment: EventCategoryRecord): EventCategoryDisplayRecord {
    this.eventCategories = this.buildAssignedCategories(
      [...this.eventCategories.filter((assignment) => assignment.id !== savedAssignment.id), savedAssignment],
      this.masterCategories
    );
    this.hydrateEventCategoryImage(this.eventCategories.find((assignment) => assignment.id === savedAssignment.id) || null);

    if (this.selectedCategory?.id === savedAssignment.id) {
      this.selectedCategory = this.eventCategories.find((assignment) => assignment.id === savedAssignment.id) || null;
    }

    return this.eventCategories.find((assignment) => assignment.id === savedAssignment.id)!;
  }

  private removeEventCategory(eventCategoryId: string): void {
    this.eventCategories = this.eventCategories.filter((assignment) => assignment.id !== eventCategoryId);
    delete this.eventCategoryImageUrls[eventCategoryId];
  }

  private upsertEventProduct(savedAssignment: EventProductRecord): EventProductDisplayRecord {
    this.eventProducts = this.buildAssignedProducts(
      [...this.eventProducts.filter((assignment) => assignment.id !== savedAssignment.id), savedAssignment],
      this.masterProducts
    );
    this.hydrateEventProductImage(this.eventProducts.find((assignment) => assignment.id === savedAssignment.id) || null);

    return this.eventProducts.find((assignment) => assignment.id === savedAssignment.id)!;
  }

  private removeEventProduct(eventProductId: string): void {
    this.eventProducts = this.eventProducts.filter((assignment) => assignment.id !== eventProductId);
    delete this.eventProductImageUrls[eventProductId];
  }

  private reloadAfterEventMutation(preferredEventId: string): void {
    if (preferredEventId) {
      this.requestedEventId = preferredEventId;
      this.requestedCategoryId = '';
      this.syncQueryState(preferredEventId, '', true);
      this.reload();
      return;
    }

    this.reload();
  }

  private compareEvents(left: EventRecord, right: EventRecord): number {
    const leftOrder = typeof left.order === 'number' ? left.order : 0;
    const rightOrder = typeof right.order === 'number' ? right.order : 0;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return (left.eventName || '').localeCompare(right.eventName || '', undefined, { sensitivity: 'base' });
  }

  private syncQueryState(eventId: string, categoryId: string, replaceUrl = false): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        event: eventId || null,
        category: categoryId || null
      },
      replaceUrl
    });
  }

  setFeedback(message: string, tone: 'success' | 'error' | undefined): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone || 'success';
  }

  private hydrateEventImages(events: EventRecord[]): void {
    for (const eventRecord of events) {
      const imagePath = (eventRecord.imageURL || '').trim();
      if (!imagePath) {
        this.eventImageUrls[eventRecord.id] = '';
        continue;
      }

      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => {
          this.eventImageUrls[eventRecord.id] = imageUrl || '';
        },
        error: () => {
          this.eventImageUrls[eventRecord.id] = '';
        }
      });
    }
  }

  private hydrateMasterCategoryImages(categories: ProductCategory[]): void {
    for (const category of categories) {
      const imagePath = (category.productCategoryImageURL || '').trim();
      if (!imagePath) {
        this.masterCategoryImageUrls[category.id] = '';
        continue;
      }

      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => {
          this.masterCategoryImageUrls[category.id] = imageUrl || '';
        },
        error: () => {
          this.masterCategoryImageUrls[category.id] = '';
        }
      });
    }
  }

  private hydrateMasterProductImages(products: Product[]): void {
    for (const product of products) {
      const imagePath = (product.imageURL || '').trim();
      if (!imagePath) {
        this.masterProductImageUrls[product.id] = '';
        continue;
      }

      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => {
          this.masterProductImageUrls[product.id] = imageUrl || '';
        },
        error: () => {
          this.masterProductImageUrls[product.id] = '';
        }
      });
    }
  }

  private hydrateEventCategoryImages(assignments: EventCategoryDisplayRecord[]): void {
    for (const assignment of assignments) {
      this.hydrateEventCategoryImage(assignment);
    }
  }

  private hydrateEventCategoryImage(assignment: EventCategoryDisplayRecord | null): void {
    if (!assignment) {
      return;
    }

    const imagePath = (assignment.imageURL || '').trim();
    if (!imagePath) {
      this.eventCategoryImageUrls[assignment.id] = '';
      return;
    }

    this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => {
        this.eventCategoryImageUrls[assignment.id] = imageUrl || '';
      },
      error: () => {
        this.eventCategoryImageUrls[assignment.id] = '';
      }
    });
  }

  private hydrateEventProductImages(assignments: EventProductDisplayRecord[]): void {
    for (const assignment of assignments) {
      this.hydrateEventProductImage(assignment);
    }
  }

  private hydrateEventProductImage(assignment: EventProductDisplayRecord | null): void {
    if (!assignment) {
      return;
    }

    const imagePath = (assignment.imageURL || '').trim();
    if (!imagePath) {
      this.eventProductImageUrls[assignment.id] = '';
      return;
    }

    this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => {
        this.eventProductImageUrls[assignment.id] = imageUrl || '';
      },
      error: () => {
        this.eventProductImageUrls[assignment.id] = '';
      }
    });
  }

  private resolveEventImagePath(payload: EventMutation): Observable<string> {
    if (payload.clearImage) {
      return of('');
    }

    if (payload.imageFile) {
      return this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/events');
    }

    return of((payload.imageURL || '').trim());
  }

  private resolveEventCategoryImagePath(payload: EventCategoryMutation): Observable<string> {
    if (payload.clearImage) {
      return of('');
    }

    if (payload.imageFile) {
      return this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/event-categories');
    }

    return of((payload.imageURL || '').trim());
  }

  private resolveEventProductImagePath(payload: EventProductMutation): Observable<string> {
    if (payload.clearImage) {
      return of('');
    }

    if (payload.imageFile) {
      return this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/event-products');
    }

    return of((payload.imageURL || '').trim());
  }

  private normalizeText(value: string | null | undefined): string {
    return (value || '').trim();
  }

  private normalizeOrder(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.trunc(value));
  }

  private normalizeMoney(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
  }

  private formatUtcDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  }
}
