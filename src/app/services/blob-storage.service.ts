import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BlobStorageService {
  private readonly baseUrls: string[];
  private readonly containerName = (environment.blobContainerName || 'images').trim();
  private readonly rawHttp: HttpClient;

  constructor(
    private readonly http: HttpClient,
    httpBackend: HttpBackend
  ) {
    this.rawHttp = new HttpClient(httpBackend);
    this.baseUrls = [environment.apiBaseUrl, ...(environment.fallbackApiBaseUrls || [])]
      .map((url) => (url || '').replace(/\/+$/, ''))
      .filter((url, index, all) => !!url && all.indexOf(url) === index);
  }

  uploadImage(file: File, folder: string): Observable<string> {
    const normalizedFolder = this.normalizeFolder(folder);
    const blobPath = `${normalizedFolder}/${this.buildStoredFileName(file.name)}`;

    return this.getText('blob/generate-upload-sas', {
      containerName: this.containerName,
      blobPath
    }).pipe(
      switchMap((sasUrl) => {
        const headers = new HttpHeaders({
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type || 'application/octet-stream'
        });

        return this.rawHttp.put(sasUrl, file, { headers }).pipe(map(() => blobPath));
      })
    );
  }

  getDownloadUrl(blobPath: string): Observable<string> {
    const normalizedBlobPath = (blobPath || '').trim();
    if (!normalizedBlobPath) {
      return of('');
    }

    return this.getText('blob/generate-download-sas', {
      containerName: this.containerName,
      blobPath: normalizedBlobPath
    });
  }

  private getText(endpoint: string, queryParams: Record<string, string>, index = 0): Observable<string> {
    if (index >= this.baseUrls.length) {
      return throwError(() => new Error('No API base URL configured.'));
    }

    const url = `${this.baseUrls[index]}/${endpoint.replace(/^\/+/, '')}`;
    return this.http.get(url, {
      params: queryParams,
      responseType: 'text'
    }).pipe(
      catchError((error) => {
        if (index + 1 < this.baseUrls.length) {
          return this.getText(endpoint, queryParams, index + 1);
        }

        return throwError(() => error);
      })
    );
  }

  private normalizeFolder(folder: string): string {
    return (folder || 'dukanz/uploads')
      .split('/')
      .map((segment) => this.sanitizeSegment(segment))
      .filter((segment) => !!segment)
      .join('/');
  }

  private buildStoredFileName(fileName: string): string {
    const normalizedName = this.sanitizeSegment(fileName || 'upload');
    return `${Date.now()}-${normalizedName}`;
  }

  private sanitizeSegment(value: string): string {
    return (value || '')
      .trim()
      .replace(/[\\?# <>|"*:]+/g, '_')
      .replace(/^\/+|\/+$/g, '');
  }
}
