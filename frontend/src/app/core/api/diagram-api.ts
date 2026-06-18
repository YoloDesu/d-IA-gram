import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateDiagramRequest,
  Diagram,
  SaveDiagramRequest
} from '../../shared/models/diagram.model';

/** Thin wrapper over the `/api/projects/{projectId}/diagrams` REST endpoints. */
@Injectable({ providedIn: 'root' })
export class DiagramApiService {
  private readonly http = inject(HttpClient);

  list(projectId: string): Observable<Diagram[]> {
    return this.http.get<Diagram[]>(this.baseUrl(projectId));
  }

  get(projectId: string, id: string): Observable<Diagram> {
    return this.http.get<Diagram>(`${this.baseUrl(projectId)}/${id}`);
  }

  create(projectId: string, request: CreateDiagramRequest): Observable<Diagram> {
    return this.http.post<Diagram>(this.baseUrl(projectId), request);
  }

  save(projectId: string, id: string, request: SaveDiagramRequest): Observable<Diagram> {
    return this.http.put<Diagram>(`${this.baseUrl(projectId)}/${id}`, request);
  }

  remove(projectId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(projectId)}/${id}`);
  }

  private baseUrl(projectId: string): string {
    return `${environment.apiBaseUrl}/api/projects/${projectId}/diagrams`;
  }
}
