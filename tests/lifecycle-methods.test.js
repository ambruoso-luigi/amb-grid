import { describe, expect, test, vi } from 'vitest';

import { createLifecycleMethods } from '../src/lib/table/controller/lifecycle-methods.js';

describe('AMB table controller lifecycle methods', () => {
    test('destroys owned AMB resources before the internal table engine', () => {
        const order = [];
        const destroyResource = name => ({
            destroy: vi.fn(() => order.push(name))
        });
        const unsubscribe = name => vi.fn(() => order.push(name));
        const resources = {
            toolbarController: destroyResource('toolbar'),
            unsubscribeDeleteColumn: unsubscribe('delete-column'),
            unsubscribeSelectionColumn: unsubscribe('selection-column'),
            unsubscribeLookupDescriptions: unsubscribe('lookup-descriptions'),
            unsubscribeLookupMetadata: unsubscribe('lookup-metadata'),
            unsubscribeLargeText: unsubscribe('large-text'),
            searchController: destroyResource('search'),
            feedback: destroyResource('feedback')
        };
        const controller = {
            toolbar: resources.toolbarController,
            feedback: resources.feedback
        };
        const cellMessageBinder = destroyResource('cell-message-binder');
        const floatingMessage = destroyResource('floating-message');
        const confirmDialog = destroyResource('confirm-dialog');
        const crud = destroyResource('crud');
        const table = destroyResource('table');
        const methods = createLifecycleMethods({
            table,
            crud,
            resources,
            getController: () => controller,
            cellMessageBinder,
            floatingMessage,
            confirmDialog
        });

        methods.destroy();

        expect(order).toEqual([
            'toolbar',
            'delete-column',
            'selection-column',
            'lookup-descriptions',
            'lookup-metadata',
            'large-text',
            'search',
            'feedback',
            'cell-message-binder',
            'floating-message',
            'confirm-dialog',
            'crud',
            'table'
        ]);
        Object.values(resources).forEach(resource => expect(resource).toBeNull());
        expect(controller.toolbar).toBeNull();
        expect(controller.feedback).toBeNull();
        expect(cellMessageBinder.destroy).toHaveBeenCalledOnce();
        expect(floatingMessage.destroy).toHaveBeenCalledOnce();
        expect(confirmDialog.destroy).toHaveBeenCalledOnce();
        expect(crud.destroy).toHaveBeenCalledOnce();
        expect(table.destroy).toHaveBeenCalledOnce();
        expect(crud.destroy.mock.invocationCallOrder[0])
            .toBeLessThan(table.destroy.mock.invocationCallOrder[0]);
    });
});
