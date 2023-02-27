import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductCategory } from 'app/entities/product_catagory';

@Component({
  selector: 'app-add-catagory',
  templateUrl: './add-catagory.component.html',
  styleUrls: ['./add-catagory.component.scss']
})
export class AddCatagoryComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<AddCatagoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductCategory
    ) { }

formControl = new FormControl('', [
Validators.required
// Validators.email,
]);

  ngOnInit(): void {
  }


  submit()
  {
    
  }

}
