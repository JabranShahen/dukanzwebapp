import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-status-pill',
  templateUrl: './ui-status-pill.component.html',
  styleUrls: ['./ui-status-pill.component.scss']
})
export class UiStatusPillComponent {
  @Input() label = '';
  @Input() tone: 'success' | 'muted' = 'muted';
}
