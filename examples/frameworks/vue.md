# Vue integration

Install AMB Grid:

```bash
npm install amb-grid
```

Use the Vue 3 Composition API to mount AMB Grid inside a Vue-owned container:

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';

const gridElement = ref(null);
let grid = null;

const rows = [
  { id: 1, name: 'Mario Rossi', active: true },
  { id: 2, name: 'Laura Bianchi', active: false }
];

const columns = [
  { title: 'ID', field: 'id' },
  { title: 'Name', field: 'name', editor: AMB.editors.text() },
  { title: 'Active', field: 'active', editor: AMB.editors.checkbox() }
];

onMounted(() => {
  grid = AMB.table({
    selector: gridElement.value,
    data: rows,
    columns
  });
});

onBeforeUnmount(() => {
  grid?.destroy();
  grid = null;
});
</script>

<template>
  <div ref="gridElement"></div>
</template>
```

## Lifecycle

`onMounted` creates the controller after the container exists, while
`onBeforeUnmount` destroys it before Vue removes the component.

## Responsibilities

Vue owns the container. AMB Grid owns the table DOM inside it, so the template
does not render rows or cells.
