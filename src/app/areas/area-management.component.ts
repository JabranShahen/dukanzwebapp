import { Component, OnInit } from '@angular/core';

import { Area } from '../models/area.model';
import { AreaService } from '../services/area.service';

@Component({
  selector: 'app-area-management',
  templateUrl: './area-management.component.html',
  styleUrls: ['./area-management.component.scss']
})
export class AreaManagementComponent implements OnInit {
  loading = false;
  saving = false;
  error = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  areas: Area[] = [];
  newAreaName = '';
  draftNames: Record<string, string> = {};

  constructor(private readonly areaService: AreaService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.areaService.getAll().subscribe({
      next: (areas) => {
        this.areas = areas.sort((a, b) => a.name.localeCompare(b.name));
        this.draftNames = this.areas.reduce<Record<string, string>>((acc, area) => {
          acc[area.id] = area.name;
          return acc;
        }, {});
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load areas.';
        this.loading = false;
      }
    });
  }

  create(): void {
    const name = this.newAreaName.trim();
    if (!name) {
      return;
    }

    this.saving = true;
    this.areaService.create(name).subscribe({
      next: () => {
        this.newAreaName = '';
        this.saving = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Area created.';
        this.load();
      },
      error: () => {
        this.saving = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to create area.';
      }
    });
  }

  save(area: Area): void {
    const name = (this.draftNames[area.id] || '').trim();
    if (!name) {
      return;
    }

    this.update({ ...area, name });
  }

  toggle(area: Area): void {
    this.update({ ...area, enabled: !area.enabled });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  trackById(_: number, area: Area): string {
    return area.id;
  }

  private update(area: Area): void {
    this.saving = true;
    this.areaService.update(area).subscribe({
      next: () => {
        this.saving = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Area updated.';
        this.load();
      },
      error: () => {
        this.saving = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to update area.';
      }
    });
  }
}
