import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../auth.guard';
import { BatchMonitoringComponent } from './batch-monitoring.component';

const routes: Routes = [
  {
    path: '',
    component: BatchMonitoringComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BatchMonitoringRoutingModule {}
