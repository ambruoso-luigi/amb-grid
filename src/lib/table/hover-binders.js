import { getLookupMetadata } from '../lookup-metadata.js';

export const createLookupDescriptionBinder = (table, floatingMessage) => {
    const tableElement = table && table.element;

    if (!tableElement) {
        return () => {};
    }

    let activeCellElement = null;

    const findLookupCell = target => {
        return target && target.closest
            ? target.closest('.tabulator-cell[data-lookup-field]')
            : null;
    };

    const getRowForElement = rowElement => {
        return table.getRows().find(row => row.getElement && row.getElement() === rowElement) || null;
    };

    const getLookupDescription = cellElement => {
        const rowElement = cellElement.closest('.tabulator-row');
        const row = getRowForElement(rowElement);
        const field = cellElement.dataset.lookupField;
        const metadata = row && getLookupMetadata(row.getData(), field);

        return metadata && metadata.current ? metadata.current.description : '';
    };

    const showDescription = event => {
        const cellElement = findLookupCell(event.target);

        if (!cellElement || cellElement.dataset.cellError === 'true') return;
        if (cellElement === activeCellElement) return;

        const description = getLookupDescription(cellElement);

        if (!description) return;

        activeCellElement = cellElement;
        floatingMessage.scheduleShow(cellElement, {
            type: 'info',
            title: 'Description',
            message: description
        });
    };

    const hideDescription = event => {
        const cellElement = findLookupCell(event.target);

        if (!cellElement || cellElement !== activeCellElement) return;
        if (cellElement.contains(event.relatedTarget)) return;

        activeCellElement = null;
        floatingMessage.hide();
    };

    tableElement.addEventListener('mouseover', showDescription);
    tableElement.addEventListener('mouseout', hideDescription);

    return () => {
        tableElement.removeEventListener('mouseover', showDescription);
        tableElement.removeEventListener('mouseout', hideDescription);
        floatingMessage.hide();
    };
};

export const createLargeTextBinder = (table, floatingMessage) => {
    const tableElement = table && table.element;

    if (!tableElement) {
        return () => {};
    }

    let activeCellElement = null;

    const findLargeTextCell = target => {
        return target && target.closest
            ? target.closest('.tabulator-cell[data-large-text-field]')
            : null;
    };

    const getRowForElement = rowElement => {
        return table.getRows().find(row => row.getElement && row.getElement() === rowElement) || null;
    };

    const getFullText = cellElement => {
        const rowElement = cellElement.closest('.tabulator-row');
        const row = getRowForElement(rowElement);
        const field = cellElement.dataset.largeTextField;
        const rowData = row && row.getData ? row.getData() : null;
        const value = rowData && field ? rowData[field] : '';

        if (value === null || value === undefined || value === '') return '';

        return String(value);
    };

    const showText = event => {
        const cellElement = findLargeTextCell(event.target);

        if (!cellElement || cellElement.dataset.cellError === 'true') return;
        if (cellElement === activeCellElement) return;

        const text = getFullText(cellElement);

        if (!text) return;

        activeCellElement = cellElement;
        floatingMessage.scheduleShow(cellElement, {
            type: 'info',
            title: 'Text',
            message: text
        });
    };

    const hideText = event => {
        const cellElement = findLargeTextCell(event.target);

        if (!cellElement || cellElement !== activeCellElement) return;
        if (cellElement.contains(event.relatedTarget)) return;

        activeCellElement = null;
        floatingMessage.hide();
    };

    tableElement.addEventListener('mouseover', showText);
    tableElement.addEventListener('mouseout', hideText);

    return () => {
        tableElement.removeEventListener('mouseover', showText);
        tableElement.removeEventListener('mouseout', hideText);
        floatingMessage.hide();
    };
};
