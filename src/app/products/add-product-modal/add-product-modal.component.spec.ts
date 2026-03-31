import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { AddProductModalComponent } from './add-product-modal.component';

describe('AddProductModalComponent', () => {
  let component: AddProductModalComponent;
  let fixture: ComponentFixture<AddProductModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddProductModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AddProductModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects whitespace-only names', () => {
    component.productForm.patchValue({
      productName: '   ',
      orignalPrice: 12,
      currentPrice: 10,
      currentCost: 8,
      unitName: 'bag'
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master product name is required.');
  });

  it('rejects negative numeric values', () => {
    spyOn(component.saved, 'emit');
    component.productForm.patchValue({
      productName: 'Coffee',
      orignalPrice: -1,
      currentPrice: 10,
      currentCost: 8,
      unitName: 'bag'
    });

    component.onSubmit();

    expect(component.saved.emit).not.toHaveBeenCalled();
  });

  it('emits a trimmed payload with an optional compatibility category', () => {
    spyOn(component.saved, 'emit');
    component.productForm.patchValue({
      productName: '  Coffee Beans  ',
      productDescription: '  Roasted weekly  ',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: '  bag  ',
      imageURL: '  https://img.test/coffee.png  '
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      productName: 'Coffee Beans',
      productDescription: 'Roasted weekly',
      unitName: 'bag',
      imageURL: 'https://img.test/coffee.png',
      visible: true,
      productCategory: jasmine.objectContaining({
        id: '',
        productCategoryName: ''
      })
    }));
  });
});
