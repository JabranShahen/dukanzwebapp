import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { EventCategoryModalComponent } from './event-category-modal.component';
import { BlobStorageService } from '../../services/blob-storage.service';
import { ProductCategoryService } from '../../services/product-category.service';

describe('EventCategoryModalComponent', () => {
  let component: EventCategoryModalComponent;
  let fixture: ComponentFixture<EventCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventCategoryModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: BlobStorageService,
          useValue: {
            getDownloadUrl: () => of('https://img.test/category.png')
          }
        },
        {
          provide: ProductCategoryService,
          useValue: {
            create: () => of({})
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCategoryModalComponent);
    component = fixture.componentInstance;
    component.availableCategories = [
      {
        id: 'category-1',
        productCategoryName: 'Coffee',
        productCategoryImageURL: '',
        visible: true,
        order: 0
      }
    ];
    fixture.detectChanges();
  });

  it('rejects duplicate assignments in add mode', () => {
    component.mode = 'add';
    component.existingProductCategoryIds = ['category-1'];
    component.assignmentForm.setValue({
      productCategoryId: 'category-1',
      categoryName: 'Coffee',
      visible: true
    });

    component.onSubmit();

    expect(component.categoryError).toBe('This master category is already assigned to the selected event.');
  });

  it('emits normalized assignment data for valid edits', () => {
    spyOn(component.saved, 'emit');
    component.mode = 'edit';
    component.assignment = {
      id: 'assignment-1',
      eventId: 'event-1',
      productCategoryId: 'category-1',
      categoryName: 'Coffee',
      imageURL: 'dukanz/event-categories/coffee.png',
      overrideImageURL: 'dukanz/event-categories/coffee.png',
      visible: false,
      order: 4
    };
    component.ngOnChanges({
      assignment: new SimpleChange(null, component.assignment, true),
      mode: new SimpleChange('add', 'edit', false)
    });
    component.assignmentForm.patchValue({
      visible: true
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      id: 'assignment-1',
      productCategoryId: 'category-1',
      categoryName: 'Coffee',
      imageURL: 'dukanz/event-categories/coffee.png',
      imageFile: null,
      clearImage: false,
      visible: true,
      order: 4
    });
  });

  it('keeps the selected master category when available categories input changes', () => {
    component.mode = 'add';
    component.assignment = null;
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false),
      assignment: new SimpleChange({
        id: 'assignment-1'
      }, null, false)
    });
    component.assignmentForm.patchValue({
      productCategoryId: 'category-1',
      visible: true
    });

    component.availableCategories = [
      ...component.availableCategories,
      {
        id: 'category-2',
        productCategoryName: 'Tea',
        productCategoryImageURL: '',
        visible: true,
        order: 1
      }
    ];
    component.ngOnChanges({
      availableCategories: new SimpleChange(
        [
          {
            id: 'category-1',
            productCategoryName: 'Coffee',
            productCategoryImageURL: '',
            visible: true,
            order: 0
          }
        ],
        component.availableCategories,
        false
      )
    });

    expect(component.assignmentForm.getRawValue().productCategoryId).toBe('category-1');
    expect(component.assignmentForm.getRawValue().visible).toBeTrue();
  });
});
