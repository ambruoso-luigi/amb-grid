const HISTORY_EVENTS = {
    undo: 'historyUndo',
    redo: 'historyRedo'
};

const createMissingEventError = direction => {
    return new Error(
        `AMB Grid history ${direction} completed without emitting ${HISTORY_EVENTS[direction]}; `
        + 'the runtime action may already have been applied'
    );
};

/**
 * Coordinates interaction-history events with AMB Grid CRUD reconciliation.
 *
 * The coordinator owns one internal listener for each history direction,
 * associates controller operations with their exact runtime event, and
 * serializes public operations and externally originated reconciliations.
 *
 * @param {object} context - Required history dependencies.
 * @param {object} context.table - Internal table engine.
 * @param {object} context.crud - AMB Grid CRUD layer.
 * @param {boolean} context.historyEnabled - Whether interaction history is enabled.
 * @returns {object} Internal history coordinator.
 * @private
 * @internal
 */
export const createHistoryRuntime = ({
    table,
    crud,
    historyEnabled
}) => {
    let destroyed = false;
    let queue = Promise.resolve();
    let pendingInvocation = null;
    const listeners = new Map();

    const isAvailable = () => {
        return !destroyed
            && historyEnabled === true
            && crud
            && crud.isDestroyed !== true
            && typeof crud.reconcileHistoryAction === 'function'
            && listeners.size === 2;
    };

    const enqueue = task => {
        const result = queue.then(task, task);

        queue = result.catch(() => undefined);

        return result;
    };

    const reconcile = ({ direction, action, component, data }) => {
        if (!isAvailable()) {
            throw new Error(
                `AMB Grid cannot reconcile history ${direction}; `
                + 'the CRUD lifecycle is no longer available and the runtime action may already have been applied'
            );
        }

        return crud.reconcileHistoryAction(
            direction,
            action,
            component,
            data
        );
    };

    const reportExternalError = (direction, error) => {
        console.error(
            `AMB Grid failed to reconcile external history ${direction}; `
            + 'the runtime action may already have been applied',
            error
        );
    };

    const handleEvent = direction => (action, component, data) => {
        const event = {
            direction,
            action,
            component,
            data
        };

        if (
            pendingInvocation
            && pendingInvocation.direction === direction
            && !pendingInvocation.event
        ) {
            pendingInvocation.event = event;
            pendingInvocation.resolve(event);
            return;
        }

        enqueue(() => reconcile(event))
            .catch(error => reportExternalError(direction, error));
    };

    if (
        table
        && typeof table.on === 'function'
        && typeof table.off === 'function'
    ) {
        Object.entries(HISTORY_EVENTS).forEach(([direction, eventName]) => {
            const listener = handleEvent(direction);

            listeners.set(eventName, listener);
            table.on(eventName, listener);
        });
    }

    const perform = direction => enqueue(async () => {
        const runtimeMethod = table && table[direction];
        const countMethodName = direction === 'undo'
            ? 'getHistoryUndoSize'
            : 'getHistoryRedoSize';
        const countMethod = table && table[countMethodName];

        if (
            !isAvailable()
            || typeof runtimeMethod !== 'function'
            || typeof countMethod !== 'function'
        ) {
            return false;
        }

        if (countMethod.call(table) === 0) {
            return false;
        }

        let resolveEvent;
        const eventPromise = new Promise(resolve => {
            resolveEvent = resolve;
        });
        const invocation = {
            direction,
            event: null,
            resolve: resolveEvent
        };

        pendingInvocation = invocation;

        let runtimeResult;

        try {
            runtimeResult = runtimeMethod.call(table);
        } catch (error) {
            if (pendingInvocation === invocation) {
                pendingInvocation = null;
            }

            throw error;
        }

        if (runtimeResult === false) {
            if (pendingInvocation === invocation) {
                pendingInvocation = null;
            }

            return false;
        }

        let event;

        try {
            event = invocation.event || await Promise.race([
                eventPromise,
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (destroyed) {
                            resolve(null);
                            return;
                        }

                        reject(createMissingEventError(direction));
                    }, 0);
                })
            ]);
        } finally {
            if (pendingInvocation === invocation) {
                pendingInvocation = null;
            }
        }

        if (!event || destroyed) {
            return false;
        }

        await reconcile(event);
        return true;
    });

    return {
        /**
         * Whether this coordinator can currently reconcile history actions.
         *
         * @returns {boolean} True while all required lifecycle resources exist.
         * @private
         * @internal
         */
        isAvailable,

        /**
         * Queue one public history operation.
         *
         * @param {'undo'|'redo'} direction - History direction to execute.
         * @returns {Promise<boolean>} Coordinated operation result.
         * @private
         * @internal
         */
        perform,

        /**
         * Detach history listeners and cancel an event wait that can no longer complete.
         *
         * @returns {void}
         * @private
         * @internal
         */
        destroy() {
            if (destroyed) return;

            destroyed = true;

            listeners.forEach((listener, eventName) => {
                table.off(eventName, listener);
            });
            listeners.clear();

            if (pendingInvocation) {
                pendingInvocation.resolve(null);
                pendingInvocation = null;
            }
        }
    };
};
