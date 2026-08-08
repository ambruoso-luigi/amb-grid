import { describe, expect, test } from 'vitest';
import { createCalculationPresentationRuntime } from '../src/lib/table/calculation-presentation-runtime.js';

class ClassList {
    constructor(classes = []) {
        this.classes = new Set(classes);
    }

    add(...classes) {
        classes.forEach(className => this.classes.add(className));
    }

    contains(className) {
        return this.classes.has(className);
    }
}

class ElementStub {
    constructor(classes = [], children = []) {
        this.nodeType = 1;
        this.classList = new ClassList(classes);
        this.children = [];
        this.parentElement = null;
        children.forEach(child => this.append(child));
    }

    append(child) {
        child.parentElement = this;
        this.children.push(child);
    }

    matches(selector) {
        return selector.split(',').some(part => {
            return this.classList.contains(part.trim().slice(1));
        });
    }

    querySelectorAll(selector) {
        return this.children.flatMap(child => [
            ...(child.matches(selector) ? [child] : []),
            ...child.querySelectorAll(selector)
        ]);
    }

    closest(selector) {
        let current = this;

        while (current) {
            if (current.matches(selector)) return current;
            current = current.parentElement;
        }

        return null;
    }
}

class MutationObserverStub {
    static instance = null;

    constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        MutationObserverStub.instance = this;
    }

    observe(root, options) {
        this.root = root;
        this.options = options;
    }

    emit(...addedNodes) {
        this.callback([{ addedNodes }]);
    }

    disconnect() {
        this.disconnected = true;
    }
}

const createCalculationRow = position => {
    return new ElementStub(
        [`tabulator-calcs-${position}`],
        [new ElementStub(['tabulator-cell']), new ElementStub(['tabulator-cell'])]
    );
};

describe('calculation presentation runtime', () => {
    test('decorates existing top and nested bottom calculation rows and their cells', () => {
        const topRow = createCalculationRow('top');
        const bottomRow = createCalculationRow('bottom');
        const group = new ElementStub(['group'], [bottomRow]);
        const root = new ElementStub(['root'], [topRow, group]);

        createCalculationPresentationRuntime(root, {
            MutationObserver: MutationObserverStub
        });

        expect(topRow.classList.contains('amb-calc-row')).toBe(true);
        expect(topRow.classList.contains('amb-calc-row--top')).toBe(true);
        expect(bottomRow.classList.contains('amb-calc-row')).toBe(true);
        expect(bottomRow.classList.contains('amb-calc-row--bottom')).toBe(true);
        [...topRow.children, ...bottomRow.children].forEach(cell => {
            expect(cell.classList.contains('amb-calc-cell')).toBe(true);
        });
    });

    test('decorates added rows and remains idempotent', () => {
        const root = new ElementStub(['root']);

        createCalculationPresentationRuntime(root, {
            MutationObserver: MutationObserverStub
        });
        const row = createCalculationRow('top');

        root.append(row);
        MutationObserverStub.instance.emit(row);
        MutationObserverStub.instance.emit(row);

        expect(row.classList.contains('amb-calc-row--top')).toBe(true);
        expect(row.classList.classes.size).toBe(3);
        row.children.forEach(cell => {
            expect(cell.classList.contains('amb-calc-cell')).toBe(true);
        });
    });

    test('decorates a cell added inside an existing calculation row', () => {
        const row = createCalculationRow('bottom');
        const root = new ElementStub(['root'], [row]);

        createCalculationPresentationRuntime(root, {
            MutationObserver: MutationObserverStub
        });
        const cell = new ElementStub(['tabulator-cell']);

        row.append(cell);
        MutationObserverStub.instance.emit(cell);

        expect(cell.classList.contains('amb-calc-cell')).toBe(true);
    });

    test('observes only the root subtree and disconnects on destroy', () => {
        const root = new ElementStub(['root']);
        const runtime = createCalculationPresentationRuntime(root, {
            MutationObserver: MutationObserverStub
        });
        const observer = MutationObserverStub.instance;

        expect(observer.root).toBe(root);
        expect(observer.options).toEqual({ childList: true, subtree: true });

        runtime.destroy();

        expect(observer.disconnected).toBe(true);
    });
});
