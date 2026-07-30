import { describe, expect, test, vi } from 'vitest';

import { createHistoryRuntime } from '../src/lib/table/history-runtime.js';

const createDeferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
};

const createHarness = ({
    undoCount = 1,
    redoCount = 1
} = {}) => {
    const listeners = new Map();
    const table = {
        undoCount,
        redoCount,
        on: vi.fn((eventName, callback) => {
            const callbacks = listeners.get(eventName) || [];

            callbacks.push(callback);
            listeners.set(eventName, callbacks);
        }),
        off: vi.fn((eventName, callback) => {
            const callbacks = listeners.get(eventName) || [];
            const index = callbacks.indexOf(callback);

            if (index !== -1) callbacks.splice(index, 1);
        }),
        emit(eventName, ...args) {
            (listeners.get(eventName) || []).slice().forEach(callback => {
                callback(...args);
            });
        },
        getHistoryUndoSize: vi.fn(() => table.undoCount),
        getHistoryRedoSize: vi.fn(() => table.redoCount),
        undo: vi.fn(() => {
            table.emit('historyUndo', 'cellEdit', { id: 'undo-cell' }, {
                oldValue: 'before',
                newValue: 'after'
            });
            return true;
        }),
        redo: vi.fn(() => {
            table.emit('historyRedo', 'rowMove', { id: 'redo-row' }, {
                posFrom: 1,
                posTo: 2
            });
            return true;
        })
    };
    const crud = {
        isDestroyed: false,
        reconcileHistoryAction: vi.fn(() => Promise.resolve())
    };
    const runtime = createHistoryRuntime({
        table,
        crud,
        historyEnabled: true
    });

    return {
        crud,
        listeners,
        runtime,
        table
    };
};

describe('AMB interaction-history runtime coordinator', () => {
    test('binds one internal listener per direction and removes each exactly once', () => {
        const { listeners, runtime, table } = createHarness();

        expect(table.on).toHaveBeenCalledTimes(2);
        expect(table.on).toHaveBeenCalledWith('historyUndo', expect.any(Function));
        expect(table.on).toHaveBeenCalledWith('historyRedo', expect.any(Function));
        expect(listeners.get('historyUndo')).toHaveLength(1);
        expect(listeners.get('historyRedo')).toHaveLength(1);

        runtime.destroy();
        runtime.destroy();

        expect(table.off).toHaveBeenCalledTimes(2);
        expect(listeners.get('historyUndo')).toHaveLength(0);
        expect(listeners.get('historyRedo')).toHaveLength(0);
        expect(runtime.isAvailable()).toBe(false);
    });

    test('returns false for zero counts or a runtime false result', async () => {
        for (const direction of ['undo', 'redo']) {
            const harness = createHarness({
                undoCount: direction === 'undo' ? 0 : 1,
                redoCount: direction === 'redo' ? 0 : 1
            });
            const countMethod = direction === 'undo'
                ? 'getHistoryUndoSize'
                : 'getHistoryRedoSize';

            await expect(harness.runtime.perform(direction)).resolves.toBe(false);
            expect(harness.table[countMethod]).toHaveBeenCalledOnce();
            expect(harness.table[direction]).not.toHaveBeenCalled();
            expect(harness.crud.reconcileHistoryAction).not.toHaveBeenCalled();
        }

        const harness = createHarness();

        harness.table.undo.mockReturnValueOnce(false);
        await expect(harness.runtime.perform('undo')).resolves.toBe(false);
        expect(harness.crud.reconcileHistoryAction).not.toHaveBeenCalled();
    });

    test('resolves true only after the exact undo event is reconciled', async () => {
        const { crud, runtime, table } = createHarness();
        const deferred = createDeferred();

        crud.reconcileHistoryAction.mockReturnValueOnce(deferred.promise);

        const operation = runtime.perform('undo');
        let settled = false;

        operation.finally(() => {
            settled = true;
        });
        await vi.waitFor(() => {
            expect(crud.reconcileHistoryAction).toHaveBeenCalledWith(
                'undo',
                'cellEdit',
                { id: 'undo-cell' },
                {
                    oldValue: 'before',
                    newValue: 'after'
                }
            );
        });
        expect(table.undo).toHaveBeenCalledOnce();
        expect(settled).toBe(false);

        deferred.resolve();

        await expect(operation).resolves.toBe(true);
    });

    test('serializes calls and keeps the queue reusable after false or error', async () => {
        const { crud, runtime, table } = createHarness();
        const firstReconciliation = createDeferred();
        const queuedReconciliation = createDeferred();
        const reconciliationError = new Error('reconcile failed');

        crud.reconcileHistoryAction
            .mockReturnValueOnce(firstReconciliation.promise)
            .mockResolvedValueOnce()
            .mockReturnValueOnce(queuedReconciliation.promise)
            .mockRejectedValueOnce(reconciliationError)
            .mockResolvedValueOnce();

        const first = runtime.perform('undo');
        const second = runtime.perform('undo');

        expect(first).not.toBe(second);
        await vi.waitFor(() => expect(table.undo).toHaveBeenCalledOnce());
        expect(table.getHistoryUndoSize).toHaveBeenCalledOnce();

        firstReconciliation.resolve();
        await expect(first).resolves.toBe(true);
        await expect(second).resolves.toBe(true);
        expect(table.undo).toHaveBeenCalledTimes(2);

        const beforeClear = runtime.perform('undo');
        const afterClear = runtime.perform('undo');

        await vi.waitFor(() => expect(table.undo).toHaveBeenCalledTimes(3));
        table.undoCount = 0;
        queuedReconciliation.resolve();
        await expect(beforeClear).resolves.toBe(true);
        await expect(afterClear).resolves.toBe(false);

        table.undoCount = 1;
        await expect(runtime.perform('undo')).rejects.toBe(reconciliationError);
        await expect(runtime.perform('undo')).resolves.toBe(true);
        expect(table.undo).toHaveBeenCalledTimes(5);
        expect(runtime.isAvailable()).toBe(true);
    });

    test('propagates runtime errors and rejects when the expected event is missing', async () => {
        const { crud, runtime, table } = createHarness();
        const runtimeError = new Error('undo failed');
        const reconciliationError = new Error('reconcile failed');

        table.undo.mockImplementationOnce(() => {
            throw runtimeError;
        });
        await expect(runtime.perform('undo')).rejects.toBe(runtimeError);

        crud.reconcileHistoryAction.mockRejectedValueOnce(reconciliationError);
        await expect(runtime.perform('redo')).rejects.toBe(reconciliationError);

        table.redo.mockReturnValueOnce(true);
        await expect(runtime.perform('redo')).rejects.toThrow(
            /completed without emitting historyRedo/
        );
        expect(table).not.toHaveProperty('setData');
        expect(crud).not.toHaveProperty('rebaseCurrentData');
    });

    test('contains external-event errors and cancels pending waits on destroy', async () => {
        const { crud, runtime, table } = createHarness();
        const externalError = new Error('external failure');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        crud.reconcileHistoryAction.mockRejectedValueOnce(externalError);
        table.emit('historyUndo', 'rowAdd', { id: 'keyboard-row' }, {
            data: { id: null }
        });
        await vi.waitFor(() => expect(consoleError).toHaveBeenCalledWith(
            expect.stringContaining('external history undo'),
            externalError
        ));
        expect(crud.reconcileHistoryAction).toHaveBeenCalledOnce();

        table.undo.mockReturnValueOnce(true);
        const operation = runtime.perform('undo');

        await Promise.resolve();
        expect(table.undo).toHaveBeenCalledOnce();
        runtime.destroy();

        await expect(operation).resolves.toBe(false);
        await expect(runtime.perform('undo')).resolves.toBe(false);
        consoleError.mockRestore();
    });
});
