import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from 'app/entities/product';
import { ProductCategory } from 'app/entities/product_catagory';
import { ProductService } from 'app/shared/services/Dukanz/product.service';
import { CategoryService } from 'app/shared/services/Dukanz/product_category';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {

  productData: Product;
  productCategories: ProductCategory[] = [];
  productForm: FormGroup;
  selectedCategory: string;
  mode: string;

  constructor(
    private formBuilder: FormBuilder,
    private categoryService: CategoryService,
    private productService: ProductService,
    private dialogRef: MatDialogRef<AddProductComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any // Inject MAT_DIALOG_DATA
  ) {
    this.mode = data.mode; // Assign the mode value
  }

  ngOnInit(): void {

    this.productData = new Product('', '', undefined, 0, 0, 0, '', 0, undefined, '', false, 0, undefined,'');

    this.selectedCategory = '';

    this.productForm = this.formBuilder.group({
      productName: [this.productData.productName, Validators.required],
      productDescription: [this.productData.productDescription, Validators.required],
      orignalPrice: [this.productData.orignalPrice, Validators.required],
      currentPrice: [this.productData.currentPrice, Validators.required],
      currentCost: [this.productData.currentCost, Validators.required],
      unitName: [this.productData.unitName, Validators.required],
      displayPercentage: [this.productData.displayPercentage, Validators.required],
      displayUnitName: [this.productData.displayUnitName, Validators.required],
      imageURL: [this.productData.imageURL, Validators.required],
      visible: [this.productData.visible, Validators.required],
      order: [this.productData.order, Validators.required],
      productCategoryId: ["", Validators.required]
    });

    this.loadProductCategories();

    // Check the mode and set the product data accordingly
    if (this.mode === 'Existing') {
      // Set the product data from the selected product
      this.productData = this.data.selectedProduct;
      // this.selectedCategory = this.productData.productCategoryId;
    }
  }

  loadProductCategories(): void {
    this.categoryService.getCategories().subscribe(
      (categories: ProductCategory[]) => {
        this.productCategories = categories;
      },
      (error: any) => {
        console.error('Error fetching product categories:', error);
      }
    );
  }

  onSelectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }
  async saveProduct(): Promise<void> {
    try {
      if (this.mode === 'New') {
        // Generate a new GUID for the id and partitionKey properties
        const newProduct = { 
          ...this.productForm.value, 
          id: uuidv4(), 
          partitionKey: uuidv4() // Ensure partitionKey is set here for a new product
        };
        console.log("New product data with partitionKey:", JSON.stringify(newProduct));
        await this.productService.addProduct(newProduct);
      } else if (this.mode === 'Existing') {
        // Ensure the partitionKey is retained when updating the product
        const updatedProduct = { 
          ...this.productForm.value, 
          id: this.productData.id, 
          partitionKey: this.productData.partitionKey // Retain existing partitionKey
        };
        console.log("Updated product data with partitionKey:", JSON.stringify(updatedProduct));
        await this.productService.updateProduct(updatedProduct);
      }
      // Close the dialog after saving
      this.dialogRef.close();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  }
  
  async deleteProduct(): Promise<void> {
    try {
      await this.productService.deleteProduct(this.productData);
      // Close the dialog after deleting
      this.dialogRef.close();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  closeDialog(): void {
    // Close the dialog without saving
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    // Perform any additional actions on form submission if needed

    this.saveProduct();
  }
}
