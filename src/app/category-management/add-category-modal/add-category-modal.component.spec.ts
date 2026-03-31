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
      productCategoryImageURL: '',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master category name is required.');
  });

  it('rejects duplicate names regardless of casing or spacing', () => {
    component.existingNames = ['Fresh Produce'];
    component.categoryForm.setValue({
      productCategoryName: ' fresh produce ',
      productCategoryImageURL: '',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master category name must be unique.');
  });

  it('emits a trimmed payload for valid categories', () => {
    spyOn(component.saved, 'emit');
    component.categoryForm.setValue({
      productCategoryName: '  Pantry  ',
      productCategoryImageURL: '  https://img.test/pantry.png  ',
      visible: false
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      productCategoryName: 'Pantry',
      productCategoryImageURL: 'https://img.test/pantry.png',
      visible: false
    });
  });
});
