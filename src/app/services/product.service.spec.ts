import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ProductService } from './product.service';
import { environment } from '../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps null product lists to an empty array', () => {
    let resultLength = -1;

    service.getAll().subscribe((products) => {
      resultLength = products.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/DukanzProduct`);
    request.flush(null);

    expect(resultLength).toBe(0);
  });

  it('creates a product with trimmed fields and a compatibility category payload', () => {
    let result: unknown;

    service.create({
      productName: '  Coffee Beans  ',
      productDescription: '  Roasted weekly  ',
      orignalPrice: 12.5,
      currentPrice: 10,
      currentCost: 7.25,
      unitName: '  bag  ',
      displayPercentage: 20,
      displayUnitName: '  Off  ',
      imageURL: '  https://img.test/coffee.png  ',
      visible: true,
      productCategory: {
        id: 'category-1',
        productCategoryName: '  Drinks  ',
        productCategoryImageURL: '  https://img.test/drinks.png  ',
        visible: true,
        order: 3
      }
    }).subscribe((product) => {
      result = product;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/DukanzProduct`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.productName).toBe('Coffee Beans');
    expect(request.request.body.productDescription).toBe('Roasted weekly');
    expect(request.request.body.unitName).toBe('bag');
    expect(request.request.body.displayUnitName).toBe('Off');
    expect(request.request.body.imageURL).toBe('https://img.test/coffee.png');
    expect(request.request.body.productCategory.id).toBe('category-1');
    expect(request.request.body.productCategory.productCategoryName).toBe('Drinks');
    expect(request.request.body.productCategory.PartitionKey).toBe('category-1');
    expect(request.request.body.PartitionKey).toBe(request.request.body.id);

    request.flush({ id: 'product-1' });

    expect(result).toEqual(jasmine.objectContaining({
      id: 'product-1',
      productName: 'Coffee Beans',
      currentPrice: 10,
      productCategory: jasmine.objectContaining({
        id: 'category-1',
        productCategoryName: 'Drinks'
      })
    }));
  });

  it('returns false when the delete endpoint reports that the product was not deleted', () => {
    let deleted: boolean | undefined;

    service.delete('product-1').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/DukanzProduct/product-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ deleted: false, reason: 'Product is still in use.' });

    expect(deleted).toBeFalse();
  });
});
