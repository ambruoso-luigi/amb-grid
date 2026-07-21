/**
 * Creates the event methods exposed by the AMB Grid controller.
 *
 * Application listeners registered through this group are tracked separately
 * from AMB Grid internal event bindings. This allows `off(eventName)` to remove
 * only application listeners without disrupting grid lifecycle, lookup,
 * validation or other internally managed behavior.
 *
 * @param {object} context - Required method dependencies.
 * @param {object} context.table - Internal table engine instance.
 * @returns {object} Event methods for the flat controller API.
 * @private
 * @internal
 */
export const createEventMethods = ({ table }) => {
    const listeners = new Map();

    return {
        /**
         * Subscribes an application callback to a public grid event.
         *
         * The event name and callback are delegated unchanged to the underlying
         * table engine. The subscription is tracked by AMB Grid so it can later be
         * removed without affecting internal event bindings.
         *
         * Application code should use a captured `grid` reference instead of relying
         * on the callback `this` value.
         *
         * @param {string} eventName - Public grid event name.
         * @param {Function} callback - Event callback.
         * @returns {void}
         */
        on(eventName, callback) {
            table.on(eventName, callback);

            const eventListeners = listeners.get(eventName) || [];

            eventListeners.push(callback);
            listeners.set(eventName, eventListeners);
        },

        /**
         * Removes application event listeners registered through `grid.on`.
         *
         * When a callback is supplied, one matching registration is removed.
         * When it is omitted, all application listeners registered through `grid.on`
         * for the event are removed.
         *
         * Internal AMB Grid bindings and listeners registered through advanced direct
         * engine access are preserved.
         *
         * @param {string} eventName - Public grid event name.
         * @param {Function} [callback] - Specific application callback to remove.
         * @returns {void}
         */
        off(eventName, callback) {
            const eventListeners = listeners.get(eventName);

            if (!eventListeners || eventListeners.length === 0) return;

            if (typeof callback === 'function') {
                const index = eventListeners.indexOf(callback);

                if (index === -1) return;

                table.off(eventName, callback);
                eventListeners.splice(index, 1);

                if (eventListeners.length === 0) {
                    listeners.delete(eventName);
                }

                return;
            }

            eventListeners.slice().forEach(listener => {
                table.off(eventName, listener);
            });

            listeners.delete(eventName);
        }
    };
};
