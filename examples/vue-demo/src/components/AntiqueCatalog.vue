<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { AMB } from 'amb-grid';
import { createAntiqueItems } from '../data/antique-items';
import type { AntiqueItem } from '../models/antique-item';

const container = ref<HTMLDivElement | null>(null);
const items = createAntiqueItems();
let grid: ReturnType<typeof AMB.table> | null = null;

onMounted(() => {
  if (!container.value) return;
  grid = AMB.table({
    selector: container.value,
    data: items,
    toolbar: false,
    floatingMessages: {
      enabled: true,
      validationErrors: false,
      lookupDescriptions: false,
      largeTextPreviews: true,
      searchFilterStatus: false
    },
    layout: 'fitColumns',
    height: 540,
    initialSort: [{ column: 'name', dir: 'asc' }],
    columns: [
      { title: 'Codice', field: 'code', width: 115, sorter: 'string' },
      { title: 'Oggetto', field: 'name', minWidth: 260, widthGrow: 3, sorter: 'string', sorterParams: { locale: 'it' } },
      {
        title: 'Foto', field: 'images', width: 120, headerSort: false,
        formatter: AMB.formatters.image({ width: 80, height: 72, fit: 'cover', preview: true, viewer: true })
      },
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
      },
      {
        title: 'Note', field: 'notes', minWidth: 300,
        formatter: AMB.formatters.largeTextPreview({ maxLength: 65 }),
        editor: AMB.editors.largeText({
          title: "Storia dell'oggetto", readOnly: true, closeText: 'Chiudi',
          width: 720, maxWidth: '92vw', textareaHeight: 320
        }),
        floatingMessages: {
          largeTextPreviews: { enabled: true, title: "Storia dell'oggetto", className: 'antique-notes-tooltip' }
        }
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
    <p class="antique-catalog__description">{{ items.length }} articoli in consultazione · Catalogo dimostrativo con prezzi simulati</p>
    <p class="antique-catalog__credits">
      Fotografie illustrative di esemplari analoghi, non degli articoli simulati.
      <a href="https://github.com/ambruoso-luigi/amb-grid/blob/main/examples/vue-demo/IMAGE_SOURCES.md" target="_blank" rel="noopener noreferrer">Fonti e licenze</a>
    </p>
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
.antique-catalog__credits { margin: -10px 0 20px; color: #6a5a46; font-size: 13px; line-height: 1.5; }
.antique-catalog__credits a { color: #526844; text-underline-offset: 3px; }
.antique-catalog__scroll { overflow-x: auto; border: 1px solid var(--catalog-border); border-radius: 6px; }
.antique-catalog__grid { min-width: 1500px; }
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
