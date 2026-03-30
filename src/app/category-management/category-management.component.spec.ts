import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryManagementComponent } from './category-management.component';
import { ProductCategoryService } from '../services/product-category.service';
import { ResourceState } from '../services/resource-state';
import { ProductCategory } from '../entities/product-category';

class ProductCategoryServiceMock {
  readonly subject = new BehaviorSubject<ResourceState<ProductCategory[]>>({
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

  getSnapshot(): ResourceState<ProductCategory[]> {
    return this.subject.value;
  }
}

describe('CategoryManagementComponent', () => {
  let fixture: ComponentFixture<CategoryManagementComponent>;
  let component: CategoryManagementComponent;
  let service: ProductCategoryServiceMock;

  beforeEach(async () => {
    service = new ProductCategoryServiceMock();

    await TestBed.configureTestingModule({
      imports: [CategoryManagementComponent],
      providers: [{ provide: ProductCategoryService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requests categories on init', () => {
    expect(service.loadCalls).toBe(1);
  });

  it('renders create CTA in empty state', () => {
    service.subject.next({
      status: 'empty',
      data: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Create category');
  });

  it('wires edit and delete row actions', () => {
    service.subject.next({
      status: 'ready',
      data: [
        {
          id: 'cat-1',
          productCategoryName: 'Bakery',
          visible: true,
          order: 1,
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
    expect(component.pendingDelete?.id).toBe('cat-1');
  });
});
