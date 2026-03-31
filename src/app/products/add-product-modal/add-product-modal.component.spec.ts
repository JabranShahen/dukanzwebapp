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
      unitName: '  bag  '
    });

    const file = new File(['img'], 'coffee.png', { type: 'image/png' });
    component.selectedImageFile = file;

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      productName: 'Coffee Beans',
      productDescription: 'Roasted weekly',
      unitName: 'bag',
      imageURL: '',
      imageFile: file,
      visible: true,
      productCategory: jasmine.objectContaining({
        id: '',
        productCategoryName: ''
      })
    }));
  });

  it('rejects non-image files', () => {
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onImageSelected({ target: input } as unknown as Event);

    expect(component.imageError).toBe('Select a valid image file.');
    expect(component.selectedImageFile).toBeNull();
  });

  it('creates a local preview for selected images', () => {
    const createObjectUrlSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:preview');
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['img'], 'coffee.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onImageSelected({ target: input } as unknown as Event);

    expect(createObjectUrlSpy).toHaveBeenCalledWith(file);
    expect(component.selectedImagePreviewUrl).toBe('blob:preview');
  });
});
