import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-empty-state',
  templateUrl: './ui-empty-state.component.html',
  styleUrls: ['./ui-empty-state.component.scss']
})
export class UiEmptyStateComponent {
  @Input() title = 'No records available right now';
  @Input() body = 'Data is missing or not visible yet.';
}
