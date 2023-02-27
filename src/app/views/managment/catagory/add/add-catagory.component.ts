import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ProductCategory } from 'app/entities/product_catagory';

@Component({
  selector: 'app-add-catagory',
  templateUrl: './add-catagory.component.html',
  styleUrls: ['./add-catagory.component.scss']
})
export class AddCatagoryComponent implements OnInit {
  formData = {}
  console = console;
  catagoryForm: UntypedFormGroup;
  catagoryData: ProductCategory

  constructor() { }

  ngOnInit() {

    this.catagoryData = new ProductCategory();
    this.catagoryData.visible =true;
    this.catagoryData.productCategoryName="";
    this.catagoryData.productCategoryImageURL="";
    this.catagoryData.order=0;


    this.catagoryForm = new UntypedFormGroup({
      productCategoryName: new UntypedFormControl('', [
        Validators.required
      ]),
      productCategoryImageURL: new UntypedFormControl('', [
        Validators.required
      ]),
      visible: new UntypedFormControl(''),
      order: new UntypedFormControl(''),
    }
    );
  }
}