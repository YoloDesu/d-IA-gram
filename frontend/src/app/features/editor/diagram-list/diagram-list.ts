import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Diagram } from '../../../shared/models/diagram.model';

/** Left sidebar listing the project's diagrams and creating new ones. */
@Component({
  selector: 'app-diagram-list',
  imports: [FormsModule],
  templateUrl: './diagram-list.html',
  styleUrl: './diagram-list.css'
})
export class DiagramList {
  readonly diagrams = input<readonly Diagram[]>([]);
  readonly selectedId = input<string | null>(null);

  readonly selectDiagram = output<string>();
  readonly createDiagram = output<string>();

  protected readonly newName = signal('');

  protected create(): void {
    const name = this.newName().trim();
    if (!name)
      return;
    this.createDiagram.emit(name);
    this.newName.set('');
  }
}
