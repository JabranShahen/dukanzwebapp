import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-feedback',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="feedback" [class.feedback--success]="tone === 'success'" [class.feedback--error]="tone === 'error'">
      {{ message }}
    </p>
  `,
  styles: [
    `
      .feedback {
        margin: 0;
        border-radius: 14px;
        padding: 0.75rem 0.9rem;
        background: rgba(20, 50, 46, 0.08);
        color: #12322d;
        font-weight: 600;
      }

      .feedback--success {
        background: rgba(31, 111, 98, 0.14);
        color: #145247;
      }

      .feedback--error {
        background: rgba(159, 61, 55, 0.14);
        color: #7f2e2b;
      }
    `,
  ],
})
export class UiFeedbackComponent {
  @Input() message = '';
  @Input() tone: 'info' | 'success' | 'error' = 'info';
}
