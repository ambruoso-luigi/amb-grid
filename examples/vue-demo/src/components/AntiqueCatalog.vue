<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { AMB } from 'amb-grid';
import { createAntiqueItems } from '../data/antique-items';
import type { AntiqueItem } from '../models/antique-item';

const container = ref<HTMLDivElement | null>(null);
let grid: ReturnType<typeof AMB.table> | null = null;

onMounted(() => {
  if (!container.value) return;
  grid = AMB.table({
    selector: container.value,
    data: createAntiqueItems(),
    toolbar: false,
    floatingMessages: false,
    layout: 'fitColumns',
    height: 540,
    initialSort: [{ column: 'name', dir: 'asc' }],
    columns: [
      { title: 'Codice', field: 'code', width: 115, sorter: 'string' },
      { title: 'Oggetto', field: 'name', minWidth: 260, widthGrow: 3, sorter: 'string', sorterParams: { locale: 'it' } },
      { title: 'Categoria', field: 'category', minWidth: 190, sorter: 'string', sorterParams: { locale: 'it' } },
      {
        title: 'Epoca', field: 'approximateYear', minWidth: 230, sorter: 'number',
        formatter: (cell: { getRow: () => { getData: () => AntiqueItem } }) => cell.getRow().getData().period
      },
      { title: 'Stato', field: 'condition', minWidth: 145, sorter: 'string' },
      {
        title: 'Prezzo', field: 'price', width: 150, sorter: 'number',
        hozAlign: 'right', headerHozAlign: 'right',
        formatter: AMB.formatters.currency({ locale: 'it-IT', currency: 'EUR' })
      }
    ]
  });
});

onBeforeUnmount(() => {
  grid?.destroy();
  grid = null;
});
</script>

<template>
  <div class="antique-catalog">
    <p class="antique-catalog__description">24 articoli in consultazione · Catalogo dimostrativo con prezzi simulati</p>
    <div class="antique-catalog__scroll">
      <div ref="container" class="antique-catalog__grid" aria-labelledby="catalogue-title"></div>
    </div>
  </div>
</template>

<style scoped>
.antique-catalog {
  --catalog-ink: #403328;
  --catalog-border: #d8ccb6;
  color: var(--catalog-ink);
  min-width: 0;
}
.antique-catalog__description { margin: 12px 0 20px; color: #6a5a46; font-size: 14px; line-height: 1.5; }
.antique-catalog__scroll { overflow-x: auto; border: 1px solid var(--catalog-border); border-radius: 6px; }
.antique-catalog__grid { min-width: 1090px; }
.antique-catalog :deep(.tabulator) { border: 0; background: #f6f1e6; color: var(--catalog-ink); font: inherit; font-size: 14px; }
.antique-catalog :deep(.tabulator-header) { background: #eee6d5; border-bottom: 2px solid #ac8d55; color: #493921; }
.antique-catalog :deep(.tabulator-header .tabulator-col) { background: transparent; border-right-color: var(--catalog-border); }
.antique-catalog :deep(.tabulator-header .tabulator-col:hover) { background: #e2dac7; }
.antique-catalog :deep(.tabulator-header .tabulator-col-content) { padding: 14px 12px; }
.antique-catalog :deep(.tabulator-row) { background: #fffdf6; color: var(--catalog-ink); border-bottom: 1px solid #e8decb; }
.antique-catalog :deep(.tabulator-row.tabulator-row-even) { background: #f7f2e8; }
.antique-catalog :deep(.tabulator-row:hover) { background: #eaf0e4; }
.antique-catalog :deep(.tabulator-row .tabulator-cell) { padding: 13px 12px; border-right-color: #e8decb; }
.antique-catalog :deep(.tabulator-cell[tabulator-field="code"]) { color: #79603a; font-variant-numeric: tabular-nums; }
.antique-catalog :deep(.tabulator-cell[tabulator-field="name"]) { font-weight: 600; }
.antique-catalog :deep(.tabulator-cell[tabulator-field="price"]) { font-variant-numeric: tabular-nums; font-weight: 600; }
.antique-catalog :deep(.tabulator-cell:focus-visible) { outline: 2px solid #6c8060; outline-offset: -2px; }
</style>
