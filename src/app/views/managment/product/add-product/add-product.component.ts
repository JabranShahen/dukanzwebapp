import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from 'app/entities/product';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {
  productForm: FormGroup;
  mode: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public productData: Product,
    public productService: ProductService,
    public dialogRef: MatDialogRef<AddProductComponent>,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log('this.productData ', this.productData.id);  
    if (!this.productData.id) {
      this.mode = 'New';
      // Initialize other properties of Product entity if needed
    } else {
      this.mode = 'Edit';
    }

    this.productForm = this.formBuilder.group({
      productName: ['', Validators.required],
      productDescription: ['', Validators.required],
      orignalPrice: ['', Validators.required],
      currentPrice: ['', Validators.required],
      currentCost: ['', Validators.required],
      unitName: ['', Validators.required],
      displayPercentage: ['', Validators.required],
      displayUnitName: ['', Validators.required],
      imageURL: ['', Validators.required],
      visible: [''],
      order: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    const product: Product = this.productForm.value as Product;
    if (this.mode === 'New') {
      try {
        await this.productService.addProduct(product);
        this.dialogRef.close();
      } catch (error) {
        console.error('Error adding product:', error);
      }
    } else {
      try {
        await this.productService.updateProduct(product);
        console.log('Product updated successfully.');
        this.dialogRef.close();
      } catch (error) {
        console.error('Error updating product:', error);
      }
    }
  }
}
