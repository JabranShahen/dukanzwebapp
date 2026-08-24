import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { EditProductModalComponent } from './edit-product-modal.component';
import { BlobStorageService } from '../../services/blob-storage.service';

describe('EditProductModalComponent', () => {
  let component: EditProductModalComponent;
  let fixture: ComponentFixture<EditProductModalComponent>;
  let blobStorageService: jasmine.SpyObj<BlobStorageService>;

  beforeEach(async () => {
    blobStorageService = jasmine.createSpyObj<BlobStorageService>('BlobStorageService', ['getDownloadUrl']);
    blobStorageService.getDownloadUrl.and.returnValue(of('https://img.test/coffee.png'));

    await TestBed.configureTestingModule({
      declarations: [EditProductModalComponent],
      imports: [FormsModule, ReactiveFormsModule],
      providers: [
        { provide: BlobStorageService, useValue: blobStorageService }
      ],
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

  it('loads a preview url for the current stored image', () => {
    expect(blobStorageService.getDownloadUrl).toHaveBeenCalledWith('https://img.test/coffee.png');
    expect(component.currentImagePreviewUrl).toBe('https://img.test/coffee.png');
  });

  it('can mark the current image for removal', () => {
    spyOn(component.saved, 'emit');
    component.product = {
      id: 'product-1',
      productName: 'Coffee Beans',
      productDescription: 'Roasted weekly',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: 'bag',
      imageURL: 'dukanz/products/coffee.png',
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
    component.removeCurrentImage = true;

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      imageURL: '',
      clearImage: true
    }));
  });

  it('creates a local preview for a newly selected image', () => {
    const createObjectUrlSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:new-preview');
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['img'], 'coffee-new.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onImageSelected({ target: input } as unknown as Event);

    expect(createObjectUrlSpy).toHaveBeenCalledWith(file);
    expect(component.selectedImagePreviewUrl).toBe('blob:new-preview');
  });
});
