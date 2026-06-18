/** Project summary as returned by the API. Mirrors backend `ProjectDto`. */
export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly diagramCount: number;
  readonly createdAt: string;
}

/** Body for creating or updating a project. */
export interface SaveProjectRequest {
  readonly name: string;
  readonly description?: string;
}
