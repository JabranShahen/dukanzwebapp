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
    if (!this.productData.id) {
      // If id is not present, it means it's a new product
      this.mode = 'New';
      // Initialize other properties of Product entity if needed
    } else {
      // If id is present, it means it's an existing product
      this.mode = 'Edit';
    }
  
    this.productForm = this.formBuilder.group({
      id: [this.productData.id],
      productName: [this.productData.productName],
      productDescription: [this.productData.productDescription],
      orignalPrice: [this.productData.orignalPrice],
      currentPrice: [this.productData.currentPrice],
      currentCost: [this.productData.currentCost],
      unitName: [this.productData.unitName],
      displayPercentage: [this.productData.displayPercentage],
      displayUnitName: [this.productData.displayUnitName],
      imageURL: [this.productData.imageURL],
      visible: [this.productData.visible],
      order: [this.productData.order],
      productCategoryId: [this.productData.productCategoryId], // Add productCategoryId field
      // Include any other fields of Product entity here
    });
  }
  

  async onSubmit(): Promise<void> {
    const productFormValue = this.productForm.value as Product;
    
    // Check if productFormValue is null or undefined
    if (!productFormValue) {
      console.error('Product form value is undefined.');
      return;
    }
  
    // Log the JSON representation of productFormValue
    console.log('Product Form Value:', JSON.stringify(productFormValue));
  
    if (this.mode === 'New') {
      try {
        await this.productService.addProduct(productFormValue);
        this.dialogRef.close();
      } catch (error) {
        console.error('Error adding product:', error);
      }
    } else {
      try {
        await this.productService.updateProduct(productFormValue);
        console.log('Product updated successfully.');
        this.dialogRef.close();
      } catch (error) {
        console.error('Error updating product:', error);
      }
    }
  }
  
  
  
}
