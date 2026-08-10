# React integration

Install AMB Grid:

```bash
npm install amb-grid
```

Mount AMB Grid inside a React-owned container:

```jsx
import { useEffect, useRef } from 'react';
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';

const rows = [
  { id: 1, name: 'Mario Rossi', active: true },
  { id: 2, name: 'Laura Bianchi', active: false }
];

const columns = [
  { title: 'ID', field: 'id' },
  { title: 'Name', field: 'name', editor: AMB.editors.text() },
  { title: 'Active', field: 'active', editor: AMB.editors.checkbox() }
];

export function PeopleGrid() {
  const gridElementRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => {
    gridRef.current = AMB.table({
      selector: gridElementRef.current,
      data: rows,
      columns
    });

    return () => {
      gridRef.current?.destroy();
      gridRef.current = null;
    };
  }, []);

  return <div ref={gridElementRef} />;
}
```

## Lifecycle

`useEffect` creates the controller after React mounts the container. Its cleanup
destroys the controller before the component is removed.

## Responsibilities

React owns and renders the container. AMB Grid owns the table DOM inside it;
React should not render the grid rows or cells directly.
