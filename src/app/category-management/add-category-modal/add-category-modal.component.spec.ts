import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { AddCategoryModalComponent } from './add-category-modal.component';

describe('AddCategoryModalComponent', () => {
  let component: AddCategoryModalComponent;
  let fixture: ComponentFixture<AddCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddCategoryModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AddCategoryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects whitespace-only names', () => {
    component.categoryForm.setValue({
      productCategoryName: '   ',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master category name is required.');
  });

  it('rejects duplicate names regardless of casing or spacing', () => {
    component.existingNames = ['Fresh Produce'];
    component.categoryForm.setValue({
      productCategoryName: ' fresh produce ',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master category name must be unique.');
  });

  it('emits a trimmed payload for valid categories', () => {
    spyOn(component.saved, 'emit');
    component.categoryForm.setValue({
      productCategoryName: '  Pantry  ',
      visible: false
    });

    const file = new File(['img'], 'pantry.png', { type: 'image/png' });
    component.selectedImageFile = file;

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      productCategoryName: 'Pantry',
      productCategoryImageURL: '',
      imageFile: file,
      visible: false
    });
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
});
