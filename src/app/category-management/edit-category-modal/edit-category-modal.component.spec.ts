import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { EditCategoryModalComponent } from './edit-category-modal.component';

describe('EditCategoryModalComponent', () => {
  let component: EditCategoryModalComponent;
  let fixture: ComponentFixture<EditCategoryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditCategoryModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditCategoryModalComponent);
    component = fixture.componentInstance;
    component.category = {
      id: 'category-1',
      productCategoryName: 'Fruit',
      productCategoryImageURL: '',
      visible: true,
      order: 1
    };
    component.ngOnChanges({
      category: new SimpleChange(null, component.category, true)
    });
    fixture.detectChanges();
  });

  it('allows the current category name to be saved again without a duplicate error', () => {
    spyOn(component.saved, 'emit');
    component.existingNames = ['Fruit', 'Vegetables'];
    component.categoryForm.setValue({
      productCategoryName: ' fruit ',
      productCategoryImageURL: '',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('');
    expect(component.saved.emit).toHaveBeenCalled();
  });

  it('rejects whitespace-only names during edit', () => {
    component.categoryForm.setValue({
      productCategoryName: '   ',
      productCategoryImageURL: '',
      visible: true
    });

    component.onSubmit();

    expect(component.nameError).toBe('Master category name is required.');
  });
});
