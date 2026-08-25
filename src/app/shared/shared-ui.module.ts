import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ConfirmDialogComponent } from './ui/confirm-dialog/confirm-dialog.component';
import { ManagementHeaderComponent } from './management-header/management-header.component';
import { ManagementPanelComponent } from './management-panel/management-panel.component';
import { UiButtonComponent } from './ui/ui-button/ui-button.component';
import { UiEmptyStateComponent } from './ui/ui-empty-state/ui-empty-state.component';
import { UiSnackbarComponent } from './ui/ui-snackbar/ui-snackbar.component';
import { UiStatusPillComponent } from './ui/ui-status-pill/ui-status-pill.component';

@NgModule({
  declarations: [
    ConfirmDialogComponent,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiSnackbarComponent,
    UiStatusPillComponent
  ],
  imports: [CommonModule],
  exports: [
    ConfirmDialogComponent,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiSnackbarComponent,
    UiStatusPillComponent
  ]
})
export class SharedUiModule {}
