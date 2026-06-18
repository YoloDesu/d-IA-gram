import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjectApiService } from './project-api';
import { environment } from '../../../environments/environment';
import { Project } from '../../shared/models/project.model';

describe('ProjectApiService', () => {
  let service: ProjectApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/api/projects`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectApiService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProjectApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() issues GET to the projects endpoint', () => {
    const fake: Project[] = [
      { id: '1', name: 'A', diagramCount: 0, createdAt: '2026-01-01T00:00:00Z' }
    ];
    let result: Project[] | undefined;
    service.list().subscribe(r => (result = r));

    const request = httpMock.expectOne(baseUrl);
    expect(request.request.method).toBe('GET');
    request.flush(fake);

    expect(result).toEqual(fake);
  });

  it('create() POSTs the request body', () => {
    service.create({ name: 'New' }).subscribe();

    const request = httpMock.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'New' });
    request.flush({ id: '2', name: 'New', diagramCount: 0, createdAt: '2026-01-01T00:00:00Z' });
  });
});
