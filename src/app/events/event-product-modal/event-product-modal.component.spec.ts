import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { EventProductModalComponent } from './event-product-modal.component';
import { BlobStorageService } from '../../services/blob-storage.service';
import { ProductService } from '../../services/product.service';

describe('EventProductModalComponent', () => {
  let component: EventProductModalComponent;
  let fixture: ComponentFixture<EventProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EventProductModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: BlobStorageService,
          useValue: {
            getDownloadUrl: () => of('https://img.test/product.png')
          }
        },
        {
          provide: ProductService,
          useValue: {
            create: () => of({})
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EventProductModalComponent);
    component = fixture.componentInstance;
    component.assignment = {
      id: 'assignment-1',
      eventId: 'event-1',
      eventCategoryId: 'event-category-1',
      productId: 'product-1',
      productName: 'Coffee Beans',
      overrideImageURL: 'dukanz/event-products/coffee.png',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: 'bag',
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
      productName: 'Coffee Beans',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: 'bag',
      visible: true
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
      productName: 'Espresso',
      orignalPrice: 8,
      currentPrice: 6.5,
      currentCost: 3.2,
      unitName: ' cup ',
      visible: false
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      productId: 'product-2',
      productName: 'Espresso',
      productDescription: '',
      imageURL: '',
      imageFile: null,
      clearImage: false,
      displayPercentage: 0,
      displayUnitName: '',
      orignalPrice: 8,
      currentPrice: 6.5,
      currentCost: 3.2,
      unitName: 'cup',
      visible: false,
      order: 0
    });
  });

  it('copies price and unit defaults from the selected master product in add mode', () => {
    component.mode = 'add';
    component.assignment = null;
    component.ngOnChanges({
      mode: new SimpleChange('edit', 'add', false),
      assignment: new SimpleChange({ id: 'assignment-1' }, null, false)
    });
    component.assignmentForm.patchValue({
      productId: 'product-1'
    });

    component.onProductSelectionChange();

    expect(component.assignmentForm.getRawValue().orignalPrice).toBe(12.5);
    expect(component.assignmentForm.getRawValue().currentPrice).toBe(10);
    expect(component.assignmentForm.getRawValue().currentCost).toBe(7.25);
    expect(component.assignmentForm.getRawValue().unitName).toBe('bag');
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
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: 'bag',
      visible: true
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
    expect(component.assignmentForm.getRawValue().orignalPrice).toBe(12.5);
    expect(component.assignmentForm.getRawValue().visible).toBeTrue();
  });
});
