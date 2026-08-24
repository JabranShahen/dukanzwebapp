import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="closeRequested.emit()" role="presentation">
      <section
        class="modal-card"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="title || 'Dialog'"
        (click)="$event.stopPropagation()"
      >
        <header class="modal-head">
          <div>
            <h3>{{ title }}</h3>
            <p *ngIf="description">{{ description }}</p>
          </div>
          <button type="button" class="close-button" [attr.aria-label]="closeAriaLabel" (click)="closeRequested.emit()">X</button>
        </header>

        <div class="modal-body">
          <ng-content></ng-content>
        </div>

        <footer class="modal-actions" *ngIf="showActions">
          <ng-content select="[modal-actions]"></ng-content>
        </footer>
      </section>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 28, 26, 0.64);
        display: grid;
        place-items: center;
        padding: 1rem;
        z-index: 60;
      }

      .modal-card {
        width: min(100%, 40rem);
        max-height: calc(100vh - 2rem);
        overflow: auto;
        background: #fff;
        border-radius: 24px;
        border: 1px solid rgba(20, 50, 46, 0.08);
        box-shadow: 0 36px 110px rgba(10, 24, 22, 0.34);
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
      }

      .modal-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 0.8rem;
      }

      .modal-head h3 {
        margin: 0;
      }

      .modal-head p {
        margin: 0.35rem 0 0;
        color: var(--tone-muted);
      }

      .close-button {
        border: 0;
        background: rgba(20, 50, 46, 0.08);
        color: #12322d;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        cursor: pointer;
      }

      .modal-body {
        display: grid;
        gap: 1rem;
      }

      .modal-actions {
        display: flex;
        justify-content: end;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class UiModalComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() showActions = true;
  @Input() closeAriaLabel = 'Close dialog';
  @Output() closeRequested = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeRequested.emit();
  }
}
