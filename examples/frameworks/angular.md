# Angular integration

Install AMB Grid:

```bash
npm install amb-grid
```

Use a standalone component and Angular's normal view lifecycle:

```ts
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { AMB } from 'amb-grid';

@Component({
  selector: 'app-people-grid',
  standalone: true,
  template: '<div #gridElement></div>'
})
export class PeopleGridComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gridElement', { static: true })
  private gridElement!: ElementRef<HTMLElement>;

  private grid: ReturnType<typeof AMB.table> | null = null;

  ngAfterViewInit(): void {
    const rows = [
      { id: 1, name: 'Mario Rossi', active: true },
      { id: 2, name: 'Laura Bianchi', active: false }
    ];

    const columns = [
      { title: 'ID', field: 'id' },
      { title: 'Name', field: 'name', editor: AMB.editors.text() },
      { title: 'Active', field: 'active', editor: AMB.editors.checkbox() }
    ];

    this.grid = AMB.table({
      selector: this.gridElement.nativeElement,
      data: rows,
      columns
    });
  }

  ngOnDestroy(): void {
    this.grid?.destroy();
    this.grid = null;
  }
}
```

Load the package stylesheet once in the application's global `styles.css`:

```css
@import 'amb-grid/style.css';
```

## Lifecycle

`AfterViewInit` guarantees that the container is available. `OnDestroy`
releases the AMB Grid controller when Angular removes the component.

## Responsibilities

Angular owns the component and its container. AMB Grid owns the table DOM
inside that container; the Angular template does not render rows or cells.
