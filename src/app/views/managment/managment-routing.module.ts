import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CatagoryComponent } from './catagory/catagory.component';

export const routes: Routes = [
  {
    path: '',
    children: [{
      path: 'catagory',
      component: CatagoryComponent,
      data: { title: 'Catagory', breadcrumb: 'Catagory' }
    }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagmentRoutingModule { }
