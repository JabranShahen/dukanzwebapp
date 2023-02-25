import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManagmentRoutingModule } from './managment-routing.module';
import { CatagoryComponent } from './catagory/catagory.component';


@NgModule({
  declarations: [CatagoryComponent],
  imports: [
    CommonModule,
    ManagmentRoutingModule
  ],  
})
export class ManagmentModule { }
