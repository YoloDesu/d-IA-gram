import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectList } from './project-list';
import { ProjectApiService } from '../../core/api/project-api';
import { Project, SaveProjectRequest } from '../../shared/models/project.model';

/** Named fake for ProjectApiService — no real HTTP (CLAUDE.md: mock external I/O). */
class FakeProjectApiService {
  projects: Project[] = [];
  shouldFail = false;

  list() {
    return this.shouldFail ? throwError(() => new Error('boom')) : of(this.projects);
  }

  create(request: SaveProjectRequest) {
    const created: Project = {
      id: 'new-id',
      name: request.name,
      diagramCount: 0,
      createdAt: '2026-01-01T00:00:00Z'
    };
    return of(created);
  }
}

function setup(fake: FakeProjectApiService): ProjectList {
  TestBed.configureTestingModule({
    imports: [ProjectList],
    providers: [provideRouter([]), { provide: ProjectApiService, useValue: fake }]
  });
  return TestBed.createComponent(ProjectList).componentInstance;
}

describe('ProjectList', () => {
  it('loads projects on init', () => {
    const fake = new FakeProjectApiService();
    fake.projects = [{ id: '1', name: 'A', diagramCount: 2, createdAt: '2026-01-01T00:00:00Z' }];

    const component = setup(fake);
    component.ngOnInit();

    expect(component['projects']().length).toBe(1);
  });

  it('sets an error message when loading fails', () => {
    const fake = new FakeProjectApiService();
    fake.shouldFail = true;

    const component = setup(fake);
    component.ngOnInit();

    expect(component['error']()).not.toBeNull();
  });

  it('prepends a newly created project and clears the input', () => {
    const fake = new FakeProjectApiService();
    const component = setup(fake);
    component['newName'].set('My Flow');

    component['createProject']();

    expect(component['projects']()[0].name).toBe('My Flow');
    expect(component['newName']()).toBe('');
  });

  it('does not create a project from a blank name', () => {
    const fake = new FakeProjectApiService();
    const component = setup(fake);
    component['newName'].set('   ');

    component['createProject']();

    expect(component['projects']().length).toBe(0);
  });
});
