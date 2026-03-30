import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductManagementComponent } from './product-management.component';
import { DukanzProductService } from '../services/dukanz-product.service';
import { ProductCategoryService } from '../services/product-category.service';
import { ResourceState } from '../services/resource-state';
import { Product } from '../entities/product';
import { ProductCategory } from '../entities/product-category';

class DukanzProductServiceMock {
  readonly subject = new BehaviorSubject<ResourceState<Product[]>>({
    status: 'loading',
    data: [],
  });
  readonly state$ = this.subject.asObservable();
  loadCalls = 0;

  load(): void {
    this.loadCalls += 1;
  }

  create() {
    return of({});
  }

  update() {
    return of({});
  }

  delete() {
    return of({});
  }

  getSnapshot(): ResourceState<Product[]> {
    return this.subject.value;
  }
}

class ProductCategoryServiceMock {
  readonly subject = new BehaviorSubject<ResourceState<ProductCategory[]>>({
    status: 'ready',
    data: [
      {
        id: 'coffee',
        productCategoryName: 'Coffee',
        visible: true,
        order: 1,
      },
    ],
  });
  readonly state$ = this.subject.asObservable();
  loadCalls = 0;

  load(): void {
    this.loadCalls += 1;
  }
}

describe('ProductManagementComponent', () => {
  let fixture: ComponentFixture<ProductManagementComponent>;
  let component: ProductManagementComponent;
  let productService: DukanzProductServiceMock;

  beforeEach(async () => {
    productService = new DukanzProductServiceMock();

    await TestBed.configureTestingModule({
      imports: [ProductManagementComponent],
      providers: [
        { provide: DukanzProductService, useValue: productService },
        { provide: ProductCategoryService, useValue: new ProductCategoryServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requests products on init', () => {
    expect(productService.loadCalls).toBe(1);
  });

  it('renders create CTA in empty state', () => {
    productService.subject.next({
      status: 'empty',
      data: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Create product');
  });

  it('wires edit and delete row actions', () => {
    productService.subject.next({
      status: 'ready',
      data: [
        {
          id: 'prod-1',
          productName: 'Arabica Beans',
          currentPrice: 24,
          currentCost: 18,
          orignalPrice: 25,
          unitName: 'bag',
          displayPercentage: 100,
          visible: true,
          order: 1,
          productCategoryId: 'coffee',
        },
      ],
    });
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('button[aria-label="Edit"]') as HTMLButtonElement;
    const deleteButton = fixture.nativeElement.querySelector('button[aria-label="Delete"]') as HTMLButtonElement;

    editButton.click();
    fixture.detectChanges();
    expect(component.dialogMode).toBe('edit');

    deleteButton.click();
    fixture.detectChanges();
    expect(component.pendingDelete?.id).toBe('prod-1');
  });
});
