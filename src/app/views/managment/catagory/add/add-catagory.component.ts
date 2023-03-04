import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductCategory } from 'app/entities/product_catagory';
import { CatagoryService } from '../services/catagory.service';

@Component({
  selector: 'app-add-catagory',
  templateUrl: './add-catagory.component.html',
  styleUrls: ['./add-catagory.component.scss']
})
export class AddCatagoryComponent implements OnInit {
  formData = {}
  console = console;
  catagoryForm: UntypedFormGroup;

  private mode: string = "";


  constructor(
    @Inject(MAT_DIALOG_DATA) public catagoryData: ProductCategory,
    public catagoryService: CatagoryService,
    public dialogRef: MatDialogRef<AddCatagoryComponent>
  ) { };
  ngOnInit() {
    
    this.console.log( "this.catagoryData " + this.catagoryData.id);  
    if (this.catagoryData.id==null)
    {
      this.mode = "New";
      this.catagoryData.visible = true;
      this.catagoryData.productCategoryName = "";
      this.catagoryData.productCategoryImageURL = "";
      this.catagoryData.order = 0;
    }
    else
    {
      this.mode = "Edit";
    }

    this.catagoryForm = new UntypedFormGroup({
      productCategoryName: new UntypedFormControl('', [
        Validators.required
      ]),
      productCategoryImageURL: new UntypedFormControl('', [
        Validators.required
      ]),
      visible: new UntypedFormControl(''),
      order: new UntypedFormControl('', [
        Validators.required
      ]),
    }
    );
  }

  onSubmit() {
    if(this.mode == "New")          
    {
      this.catagoryService.saveNewCatagory(this.catagoryData).subscribe
      (
        data =>
          this.dialogRef.close()
      );
    }
    else
    {
      this.catagoryService.UpdateCatagory(this.catagoryData).subscribe
      (
        data =>
        {
          console.log("Update Catagory Completed");
          this.dialogRef.close();
        }                  
      );
    }
  }
}