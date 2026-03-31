import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { EventProductModalComponent } from './event-product-modal.component';

describe('EventProductModalComponent', () => {
  let component: EventProductModalComponent;
  let fixture: ComponentFixture<EventProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventProductModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EventProductModalComponent);
    component = fixture.componentInstance;
    component.assignment = {
      id: 'assignment-1',
      eventId: 'event-1',
      eventCategoryId: 'event-category-1',
      productId: 'product-1',
      visible: true,
      order: 2
    };
    component.availableProducts = [
      {
        id: 'product-1',
        productName: 'Coffee Beans',
        productDescription: 'Roasted weekly',
        orignalPrice: 12.5,
        currentPrice: 10,
        currentCost: 7.25,
        unitName: 'bag',
        imageURL: 'https://img.test/coffee.png',
        visible: true,
        productCategory: {
          id: 'category-1',
          productCategoryName: 'Drinks',
          productCategoryImageURL: '',
          visible: true,
          order: 1
        },
        order: 3
      }
    ];
    component.ngOnChanges({
      assignment: new SimpleChange(null, component.assignment, true)
    });
    fixture.detectChanges();
  });

  it('rejects duplicate products during add mode', () => {
    component.mode = 'add';
    component.assignment = null;
    component.existingProductIds = ['product-1'];
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false),
      assignment: new SimpleChange({
        id: 'assignment-1'
      }, null, false)
    });
    component.assignmentForm.patchValue({
      productId: 'product-1',
      visible: true,
      order: 0
    });

    component.onSubmit();

    expect(component.productError).toBe('This master product is already assigned to the selected event category.');
  });

  it('emits the edited assignment with a trimmed product id', () => {
    spyOn(component.saved, 'emit');
    component.mode = 'add';
    component.assignment = null;
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false),
      assignment: new SimpleChange({
        id: 'assignment-1'
      }, null, false)
    });
    component.assignmentForm.patchValue({
      productId: '  product-2  ',
      visible: false,
      order: 4
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      productId: 'product-2',
      visible: false,
      order: 4
    });
  });

  it('keeps the selected master product when available products input changes', () => {
    component.mode = 'add';
    component.assignment = null;
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false),
      assignment: new SimpleChange({
        id: 'assignment-1'
      }, null, false)
    });
    component.assignmentForm.patchValue({
      productId: 'product-1',
      visible: true,
      order: 2
    });

    component.availableProducts = [
      ...component.availableProducts,
      {
        id: 'product-2',
        productName: 'Tea',
        productDescription: 'Brewed daily',
        orignalPrice: 7,
        currentPrice: 6,
        currentCost: 2.5,
        unitName: 'cup',
        imageURL: '',
        visible: true,
        productCategory: {
          id: 'category-2',
          productCategoryName: 'Tea',
          productCategoryImageURL: '',
          visible: true,
          order: 2
        },
        order: 1
      }
    ];
    component.ngOnChanges({
      availableProducts: new SimpleChange(
        [
          {
            id: 'product-1',
            productName: 'Coffee Beans',
            productDescription: 'Roasted weekly',
            orignalPrice: 12.5,
            currentPrice: 10,
            currentCost: 7.25,
            unitName: 'bag',
            imageURL: 'https://img.test/coffee.png',
            visible: true,
            productCategory: {
              id: 'category-1',
              productCategoryName: 'Drinks',
              productCategoryImageURL: '',
              visible: true,
              order: 1
            },
            order: 3
          }
        ],
        component.availableProducts,
        false
      )
    });

    expect(component.assignmentForm.getRawValue().productId).toBe('product-1');
    expect(component.assignmentForm.getRawValue().order).toBe(2);
  });
});
