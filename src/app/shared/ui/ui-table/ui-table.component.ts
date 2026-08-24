import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-shell" [style.maxHeight]="maxHeight">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .table-shell {
        overflow: auto;
        border-radius: 22px;
        border: 1px solid rgba(20, 50, 46, 0.08);
      }
    `,
  ],
})
export class UiTableComponent {
  @Input() maxHeight = '32rem';
}
