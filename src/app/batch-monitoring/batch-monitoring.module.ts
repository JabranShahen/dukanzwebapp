import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SharedUiModule } from '../shared/shared-ui.module';
import { BatchMonitoringRoutingModule } from './batch-monitoring-routing.module';
import { BatchMonitoringComponent } from './batch-monitoring.component';

@NgModule({
  declarations: [BatchMonitoringComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedUiModule,
    BatchMonitoringRoutingModule
  ]
})
export class BatchMonitoringModule {}
