import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { NgChartsModule } from 'ng2-charts';
// import { FileUploadModule } from 'ng2-file-upload';
import { SharedModule } from './../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';

import { ManagmentRoutes } from './managment-routing.module';
import { CatagoryComponent } from './catagory/catagory.component';
import { Nested2Component } from '../others/nested2/nested2.component';
import { Nested1Component } from '../others/nested1/nested1.component';
import { Nested3Component } from '../others/nested3/nested3.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedMaterialModule } from 'app/shared/shared-material.module';
import { PerfectScrollbarModule } from 'app/shared/components/perfect-scrollbar';
import { CatagoryService } from './catagory/services/catagory.service';
import { V } from '@angular/cdk/keycodes';
import { AddCatagoryComponent } from './catagory/add/add-catagory.component';
import { MatDialog } from '@angular/material/dialog';


@NgModule({
  declarations: [CatagoryComponent, AddCatagoryComponent],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    FlexLayoutModule,
    PerfectScrollbarModule,
    HttpClientModule,
    RouterModule.forChild(ManagmentRoutes),    
  ],  
  providers:[CatagoryService]
})
export class ManagmentModule { }
