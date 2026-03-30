import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-management-header',
  templateUrl: './management-header.component.html',
  styleUrls: ['./management-header.component.scss']
})
export class ManagementHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtext = '';
  @Input() ctaLabel = '';
  @Output() ctaClick = new EventEmitter<void>();
}
