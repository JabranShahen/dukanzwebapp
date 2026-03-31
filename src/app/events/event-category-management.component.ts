import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-event-category-management',
  templateUrl: './event-category-management.component.html',
  styleUrls: ['./event-category-management.component.scss']
})
export class EventCategoryManagementComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const eventId = (params.get('eventId') || '').trim();
      this.router.navigate(['/dashboard/event-composition'], {
        queryParams: {
          event: eventId || null
        },
        replaceUrl: true
      });
    });
  }
}
