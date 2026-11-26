import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const read = path => readFileSync(new URL(`../examples/react-demo/src/${path}`, import.meta.url), 'utf8');

test('React inventory keeps the existing grid and KPI components without redundant headings', () => {
    const app = read('App.tsx');
    const shell = read('components/InventoryShell.tsx');
    const guide = read('components/TableGuideAccordion.tsx');
    const kpis = read('components/InventoryKpis.tsx');
    expect(app).toContain('<TableGuideAccordion language={language} />');
    expect(app).toContain('<InventoryShell language={language} />');
    expect(app).not.toContain('Demo React + TypeScript');
    expect(shell).not.toContain('Operazioni inventario');
    expect(shell).not.toContain('inventory-workspace__header');
    expect(shell).toContain('<InventoryKpis language={language} snapshot={snapshot} />');
    expect(shell).toContain('<InventoryGrid language={language} onReady={handleGridReady} onStateChange={syncFromGrid} />');
    expect(kpis.match(/\['(?:Products|Modified|Errors|Ready to save|Low stock|On hold)'/g)).toHaveLength(6);
    expect(guide).toContain('Inventario interattivo');
    expect(guide).toContain('Interactive inventory');
    expect(guide).toContain('Guida tecnica demo');
    expect(guide).toContain('Demo technical guide');
    expect(guide).toContain('aria-expanded={open}');
    expect(guide).toContain('aria-controls="react-table-guide-content"');
    expect(guide).toContain('<BookOpen aria-hidden="true" size={17} strokeWidth={2.2} />');
    expect(guide).toContain('data-open={open}');
    expect(guide).toContain('fields.map');
    expect(guide).toContain('SlidersHorizontal, Gauge, Calculator, Database');
});

test('React guide and workbench share a full width layout with responsive controls', () => {
    const css = read('styles.css');
    expect(css).toContain('grid-template-columns: minmax(0, 1fr) auto');
    expect(css).toContain('.react-demo-panel .inventory-workspace { box-sizing: border-box; max-width: 100%; min-width: 0; padding: 0; width: 100%; }');
    expect(css).toContain('.react-demo-panel .react-table-guide__content[data-open="true"]');
    expect(css).toContain('.react-demo-panel .react-table-guide__trigger:focus-visible');
    expect(css).toContain('padding-inline: 0');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
});

test('React grid uses native maximum height and exposes the active filter count', () => {
    const grid = read('components/InventoryGrid.tsx');
    const toolbar = read('components/InventoryToolbar.tsx');
    const css = read('styles.css');
    expect(grid).toContain('grid.setMaxHeight(height)');
    expect(toolbar).toContain("Number(props.filters.status !== '') + Number(props.filters.inspection !== '')");
    expect(toolbar).toContain('aria-describedby={activeFilterCount ? filterDescriptionId : undefined}');
    expect(toolbar).toContain('activeFilterCount > 0');
    expect(css).toContain('min-height: 438px');
    expect(css).toContain('0 6px 16px rgb(16 78 98 / 8%)');
    expect(css).toContain('background: #ecfeff !important');
    expect(css).toContain('.inventory-toolbar__filter-count');
});
