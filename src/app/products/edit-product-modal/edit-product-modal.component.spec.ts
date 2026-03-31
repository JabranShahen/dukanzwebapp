import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { EditProductModalComponent } from './edit-product-modal.component';

describe('EditProductModalComponent', () => {
  let component: EditProductModalComponent;
  let fixture: ComponentFixture<EditProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditProductModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditProductModalComponent);
    component = fixture.componentInstance;
    component.product = {
      id: 'product-1',
      productName: 'Coffee Beans',
      productDescription: 'Roasted weekly',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: 'bag',
      imageURL: 'https://img.test/coffee.png',
      visible: false,
      productCategory: {
        id: 'category-1',
        productCategoryName: 'Drinks',
        productCategoryImageURL: '',
        visible: true,
        order: 1
      },
      order: 3
    };
    component.ngOnChanges({
      product: new SimpleChange(null, component.product, true)
    });
    fixture.detectChanges();
  });

  it('rejects whitespace-only names during edit', () => {
    component.productForm.patchValue({
      productName: '   '
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master product name is required.');
  });

  it('emits the edited product with the selected compatibility category', () => {
    spyOn(component.saved, 'emit');
    component.productForm.patchValue({
      productName: '  Coffee Grounds  '
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'product-1',
      productName: 'Coffee Grounds',
      productCategory: jasmine.objectContaining({
        id: 'category-1',
        productCategoryName: 'Drinks'
      })
    }));
  });
});
