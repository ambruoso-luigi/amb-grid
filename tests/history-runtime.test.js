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

    test.each([
        ['undo', 'getHistoryUndoSize'],
        ['redo', 'getHistoryRedoSize']
    ])('resolves %s false without a runtime call when its count is zero', async (
        direction,
        countMethod
    ) => {
        const harness = createHarness({
            undoCount: direction === 'undo' ? 0 : 1,
            redoCount: direction === 'redo' ? 0 : 1
        });

        await expect(harness.runtime.perform(direction)).resolves.toBe(false);
        expect(harness.table[countMethod]).toHaveBeenCalledOnce();
        expect(harness.table[direction]).not.toHaveBeenCalled();
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

    test('serializes distinct public calls and continues after a false result', async () => {
        const { crud, runtime, table } = createHarness();
        const firstReconciliation = createDeferred();

        crud.reconcileHistoryAction
            .mockReturnValueOnce(firstReconciliation.promise)
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

        table.undoCount = 0;
        await expect(runtime.perform('undo')).resolves.toBe(false);
        table.undoCount = 1;
        await expect(runtime.perform('undo')).resolves.toBe(true);
        expect(table.undo).toHaveBeenCalledTimes(3);
    });

    test('rechecks a queued operation count after history is cleared', async () => {
        const { crud, runtime, table } = createHarness();
        const firstReconciliation = createDeferred();

        crud.reconcileHistoryAction.mockReturnValueOnce(firstReconciliation.promise);

        const first = runtime.perform('undo');
        const queued = runtime.perform('undo');

        await vi.waitFor(() => expect(table.undo).toHaveBeenCalledOnce());
        table.undoCount = 0;
        firstReconciliation.resolve();

        await expect(first).resolves.toBe(true);
        await expect(queued).resolves.toBe(false);
        expect(table.getHistoryUndoSize).toHaveBeenCalledTimes(2);
        expect(table.undo).toHaveBeenCalledOnce();
        expect(runtime.isAvailable()).toBe(true);
    });

    test('preserves runtime false and propagates the same synchronous error', async () => {
        const { crud, runtime, table } = createHarness();
        const runtimeError = new Error('undo failed');

        table.undo.mockReturnValueOnce(false);
        await expect(runtime.perform('undo')).resolves.toBe(false);
        expect(crud.reconcileHistoryAction).not.toHaveBeenCalled();

        table.undo.mockImplementationOnce(() => {
            throw runtimeError;
        });
        await expect(runtime.perform('undo')).rejects.toBe(runtimeError);

        table.undo.mockImplementationOnce(() => {
            table.emit('historyUndo', 'cellEdit', { id: 'next' }, {});
            return true;
        });
        await expect(runtime.perform('undo')).resolves.toBe(true);
    });

    test('propagates reconciliation errors without rollback and keeps the queue usable', async () => {
        const { crud, runtime, table } = createHarness();
        const reconciliationError = new Error('reconcile failed');

        crud.reconcileHistoryAction
            .mockRejectedValueOnce(reconciliationError)
            .mockResolvedValueOnce();

        await expect(runtime.perform('redo')).rejects.toBe(reconciliationError);
        await expect(runtime.perform('redo')).resolves.toBe(true);

        expect(table.redo).toHaveBeenCalledTimes(2);
        expect(table).not.toHaveProperty('setData');
        expect(table).not.toHaveProperty('replaceData');
        expect(crud).not.toHaveProperty('rebaseCurrentData');
    });

    test('rejects explicitly when a successful runtime call emits no event', async () => {
        const { crud, runtime, table } = createHarness();

        table.redo.mockReturnValueOnce(true);

        await expect(runtime.perform('redo')).rejects.toThrow(
            /completed without emitting historyRedo/
        );
        expect(crud.reconcileHistoryAction).not.toHaveBeenCalled();

        await expect(runtime.perform('redo')).resolves.toBe(true);
    });

    test('reconciles keyboard or advanced events once and contains their errors', async () => {
        const { crud, runtime, table } = createHarness();
        const externalError = new Error('external failure');
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        crud.reconcileHistoryAction
            .mockRejectedValueOnce(externalError)
            .mockResolvedValueOnce();

        table.emit('historyUndo', 'rowAdd', { id: 'keyboard-row' }, {
            data: { id: null }
        });
        await vi.waitFor(() => expect(consoleError).toHaveBeenCalledWith(
            expect.stringContaining('external history undo'),
            externalError
        ));

        table.emit('historyRedo', 'rowMove', { id: 'advanced-row' }, {});
        await vi.waitFor(() => {
            expect(crud.reconcileHistoryAction).toHaveBeenLastCalledWith(
                'redo',
                'rowMove',
                { id: 'advanced-row' },
                {}
            );
        });
        expect(crud.reconcileHistoryAction).toHaveBeenCalledTimes(2);

        consoleError.mockRestore();
        runtime.destroy();
    });

    test('cancels an outstanding event wait during destroy', async () => {
        const { runtime, table } = createHarness();

        table.undo.mockReturnValueOnce(true);
        const operation = runtime.perform('undo');

        await Promise.resolve();
        expect(table.undo).toHaveBeenCalledOnce();
        runtime.destroy();

        await expect(operation).resolves.toBe(false);
        await expect(runtime.perform('undo')).resolves.toBe(false);
    });
});
