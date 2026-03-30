import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiModalComponent } from '../ui-modal/ui-modal.component';

@Component({
  selector: 'app-ui-confirm-dialog',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-ui-modal [title]="title" [description]="message" (closeRequested)="cancel.emit()">
      <div modal-actions>
        <app-ui-button variant="ghost" (clicked)="cancel.emit()">{{ cancelLabel }}</app-ui-button>
        <app-ui-button [variant]="confirmVariant" (clicked)="confirm.emit()">{{ confirmLabel }}</app-ui-button>
      </div>
    </app-ui-modal>
  `,
})
export class UiConfirmDialogComponent {
  @Input() title = 'Please confirm';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmVariant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
