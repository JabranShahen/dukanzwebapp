import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth-service';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let token: string | null;

  beforeEach(() => {
    token = 'live-token';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getFreshToken: () => Promise.resolve(token),
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('attaches bearer token for mutation requests to configured API roots', async () => {
    const url = `${environment.api.baseUrl}/${environment.api.endpoints.dukanzProduct}`;
    const requestPromise = firstValueFrom(http.post(url, { productName: 'Beans' }));

    await Promise.resolve();

    const req = httpTesting.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer live-token');
    expect(req.request.method).toBe('POST');
    req.flush({});

    await requestPromise;
  });

  it('attaches bearer token for fallback API root as well', async () => {
    const fallbackRoot = environment.api.fallbackBaseUrls[0];
    const url = `${fallbackRoot}/${environment.api.endpoints.dukanzConfig}`;
    const requestPromise = firstValueFrom(http.put(url, { message: 'new' }));

    await Promise.resolve();

    const req = httpTesting.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer live-token');
    expect(req.request.method).toBe('PUT');
    req.flush({});

    await requestPromise;
  });

  it('does not attach token for non-API urls', async () => {
    const url = 'https://example.com/public';
    const requestPromise = firstValueFrom(http.get(url));

    await Promise.resolve();

    const req = httpTesting.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });

    await requestPromise;
  });
});
