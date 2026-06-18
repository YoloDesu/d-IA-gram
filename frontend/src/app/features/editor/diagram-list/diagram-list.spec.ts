import { TestBed } from '@angular/core/testing';
import { DiagramList } from './diagram-list';

function createComponent(): DiagramList {
  TestBed.configureTestingModule({ imports: [DiagramList] });
  return TestBed.createComponent(DiagramList).componentInstance;
}

describe('DiagramList', () => {
  it('emits createDiagram with the trimmed name and clears the input', () => {
    const component = createComponent();
    const emitted: string[] = [];
    component.createDiagram.subscribe(name => emitted.push(name));
    component['newName'].set('  Flow  ');

    component['create']();

    expect(emitted).toEqual(['Flow']);
    expect(component['newName']()).toBe('');
  });

  it('does not emit when the name is blank', () => {
    const component = createComponent();
    let emitted = false;
    component.createDiagram.subscribe(() => (emitted = true));
    component['newName'].set('   ');

    component['create']();

    expect(emitted).toBe(false);
  });
});
