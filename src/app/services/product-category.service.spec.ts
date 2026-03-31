import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProductCategoryService } from './product-category.service';
import { environment } from '../environments/environment';

describe('ProductCategoryService', () => {
  let service: ProductCategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ProductCategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps null category lists to an empty array', () => {
    let resultLength = -1;

    service.getAll().subscribe((categories) => {
      resultLength = categories.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/ProductCategory`);
    request.flush(null);

    expect(resultLength).toBe(0);
  });

  it('creates a category with normalized payload and falls back to the returned id', () => {
    let result: unknown;

    service.create({
      productCategoryName: '  Drinks  ',
      productCategoryImageURL: '  https://img.test/drinks.png  ',
      visible: true
    }).subscribe((category) => {
      result = category;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/ProductCategory`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.productCategoryName).toBe('Drinks');
    expect(request.request.body.productCategoryImageURL).toBe('https://img.test/drinks.png');
    expect(request.request.body.visible).toBeTrue();
    expect(request.request.body.order).toBeUndefined();
    expect(typeof request.request.body.id).toBe('string');
    expect(request.request.body.PartitionKey).toBe(request.request.body.id);
    expect(request.request.body.partitionKey).toBe(request.request.body.id);

    request.flush({ id: 'generated-id' });

    expect(result).toEqual({
      id: 'generated-id',
      partitionKey: 'generated-id',
      PartitionKey: 'generated-id',
      productCategoryName: 'Drinks',
      productCategoryImageURL: 'https://img.test/drinks.png',
      visible: true
    });
  });

  it('returns false when the delete endpoint reports that the category was not deleted', () => {
    let deleted: boolean | undefined;

    service.delete('category-1').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/ProductCategory/category-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ deleted: false, reason: 'Category is still in use.' });

    expect(deleted).toBeFalse();
  });
});
