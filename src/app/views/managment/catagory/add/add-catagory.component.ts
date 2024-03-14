import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductCategory } from 'app/entities/product_catagory';
import { CatagoryService } from '../services/catagory.service';

@Component({
  selector: 'app-add-catagory',
  templateUrl: './add-catagory.component.html',
  styleUrls: ['./add-catagory.component.scss']
})
export class AddCatagoryComponent implements OnInit {
  catagoryForm: FormGroup;
  mode: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public catagoryData: ProductCategory,
    public catagoryService: CatagoryService,
    public dialogRef: MatDialogRef<AddCatagoryComponent>,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    console.log('this.catagoryData ', this.catagoryData.id);  
    if (!this.catagoryData.id) {
      this.mode = 'New';
      this.catagoryData.visible = true;
      this.catagoryData.productCategoryName = '';
      this.catagoryData.productCategoryImageURL = '';
      this.catagoryData.order = 0;
    } else {
      this.mode = 'Edit';
    }

    this.catagoryForm = this.formBuilder.group({
      productCategoryName: ['', Validators.required],
      productCategoryImageURL: ['', Validators.required],
      visible: [''],
      order: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.mode === 'New') {
      try {
        await this.catagoryService.saveNewCatagory(this.catagoryData);
        this.dialogRef.close();
      } catch (error) {
        console.error('Error saving category:', error);
      }
    } else {
      try {
        await this.catagoryService.updateCatagory(this.catagoryData);
        console.log('Update Category Completed');
        this.dialogRef.close();
      } catch (error) {
        console.error('Error updating category:', error);
      }
    }
  }
  
}
