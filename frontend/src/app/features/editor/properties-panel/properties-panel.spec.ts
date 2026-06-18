import { TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { PropertiesPanel } from './properties-panel';
import { SelectedCellInfo } from '../../../core/graph/graph-events';

describe('PropertiesPanel', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [PropertiesPanel] });
    const fixture = TestBed.createComponent(PropertiesPanel);
    return { fixture, ref: fixture.componentRef as ComponentRef<PropertiesPanel>, component: fixture.componentInstance };
  }

  it('copies the selected cell label into the editable draft', () => {
    const { fixture, ref, component } = setup();
    const cell: SelectedCellInfo = { id: 'n1', kind: 'node', label: 'Início' };

    ref.setInput('selected', cell);
    fixture.detectChanges();

    expect(component['draftLabel']()).toBe('Início');
  });

  it('emits labelChanged as the user types', () => {
    const { component } = setup();
    const emitted: string[] = [];
    component.labelChanged.subscribe(value => emitted.push(value));

    component['onLabelInput']('Novo');

    expect(emitted).toEqual(['Novo']);
    expect(component['draftLabel']()).toBe('Novo');
  });
});
