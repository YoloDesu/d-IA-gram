import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectApiService } from '../../core/api/project-api';
import { Project } from '../../shared/models/project.model';

/** Landing page: lists projects and lets the user create one and open its editor. */
@Component({
  selector: 'app-project-list',
  imports: [FormsModule],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {
  private readonly api = inject(ProjectApiService);
  private readonly router = inject(Router);

  protected readonly projects = signal<Project[]>([]);
  protected readonly newName = signal('');
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjects();
  }

  protected loadProjects(): void {
    this.api.list().subscribe({
      next: projects => this.projects.set(projects),
      error: () => this.error.set('Não foi possível carregar os projetos. O backend está rodando?')
    });
  }

  protected createProject(): void {
    const name = this.newName().trim();
    if (!name)
      return;
    this.api.create({ name }).subscribe({
      next: created => this.onProjectCreated(created),
      error: () => this.error.set('Falha ao criar o projeto.')
    });
  }

  protected openProject(id: string): void {
    this.router.navigate(['/project', id]);
  }

  private onProjectCreated(created: Project): void {
    this.projects.update(list => [created, ...list]);
    this.newName.set('');
    this.error.set(null);
  }
}
