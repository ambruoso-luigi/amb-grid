import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
    COMPONENT_API_COVERAGE,
    COMPONENT_API_SHARED_METHODS,
    TABULATOR_CALC_COMPONENT_API_METHODS,
    TABULATOR_CELL_COMPONENT_API_METHODS,
    TABULATOR_COLUMN_COMPONENT_API_METHODS,
    TABULATOR_COMPONENT_API_VERSION,
    TABULATOR_GROUP_COMPONENT_API_METHODS,
    TABULATOR_RANGE_COMPONENT_API_METHODS,
    TABULATOR_ROW_COMPONENT_API_METHODS,
    TABULATOR_SHEET_COMPONENT_API_METHODS
} from './support/tabulator-component-api-coverage.js';

const allowedStatuses = new Set([
    'exposed',
    'narrower-contract',
    'missing',
    'deferred',
    'intentionally-excluded',
    'not-applicable'
]);
const allowedClassifications = new Set([
    'safe-pass-through',
    'AMB-aware',
    'overridden',
    'delicate',
    'intentionally-excluded',
    'not-applicable'
]);
const statusesRequiringReason = new Set([
    'narrower-contract',
    'missing',
    'deferred',
    'intentionally-excluded',
    'not-applicable'
]);
const coveredStatuses = new Set([
    'exposed',
    'narrower-contract'
]);
const componentSnapshots = {
    row: TABULATOR_ROW_COMPONENT_API_METHODS,
    cell: TABULATOR_CELL_COMPONENT_API_METHODS,
    column: TABULATOR_COLUMN_COMPONENT_API_METHODS,
    group: TABULATOR_GROUP_COMPONENT_API_METHODS,
    range: TABULATOR_RANGE_COMPONENT_API_METHODS,
    calc: TABULATOR_CALC_COMPONENT_API_METHODS,
    sheet: TABULATOR_SHEET_COMPONENT_API_METHODS
};
const controllerDirectory = resolve('src/lib/table/controller');
const installedTabulatorPackage = JSON.parse(readFileSync(
    resolve('node_modules/tabulator-tables/package.json'),
    'utf8'
));

const pairKey = (component, method) => `${component}:${method}`;
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readControllerMethods = () => {
    const methodControllers = new Map();
    const publicMethods = new Set(
        COMPONENT_API_COVERAGE
            .filter(entry => coveredStatuses.has(entry.status))
            .map(entry => entry.publicMethod)
    );

    readdirSync(controllerDirectory)
        .filter(fileName => {
            return fileName.endsWith('-methods.js')
                && fileName !== 'compose-controller-methods.js';
        })
        .forEach(fileName => {
            const controller = fileName.replace('.js', '');
            const source = readFileSync(
                resolve(controllerDirectory, fileName),
                'utf8'
            );

            publicMethods.forEach(publicMethod => {
                const pattern = new RegExp(
                    `^ {4}${escapeRegExp(publicMethod)}\\s*\\(`,
                    'gm'
                );
                const matches = source.match(pattern) || [];

                matches.forEach(() => {
                    const controllers = methodControllers.get(publicMethod) || [];

                    controllers.push(controller);
                    methodControllers.set(publicMethod, controllers);
                });
            });
        });

    return methodControllers;
};

const getSharedSnapshotMethods = () => {
    const methodComponents = new Map();

    Object.entries(componentSnapshots).forEach(([component, methods]) => {
        methods.forEach(method => {
            const components = methodComponents.get(method) || [];

            components.push(component);
            methodComponents.set(method, components);
        });
    });

    return [...methodComponents.entries()]
        .filter(([, components]) => components.length > 1)
        .map(([method, components]) => ({
            method,
            components: [...components].sort()
        }))
        .sort((left, right) => left.method.localeCompare(right.method));
};

describe('stable Tabulator Component API coverage manifest', () => {
    test('matches the seven static Component API snapshots for 6.4.0', () => {
        expect(TABULATOR_COMPONENT_API_VERSION).toBe('6.4.0');
        expect(installedTabulatorPackage.version)
            .toBe(TABULATOR_COMPONENT_API_VERSION);
        expect(Object.keys(componentSnapshots)).toEqual([
            'row',
            'cell',
            'column',
            'group',
            'range',
            'calc',
            'sheet'
        ]);

        Object.values(componentSnapshots).forEach(methods => {
            expect(methods.length).toBeGreaterThan(0);
            expect(new Set(methods).size).toBe(methods.length);
        });

        const snapshotPairs = Object.entries(componentSnapshots)
            .flatMap(([component, methods]) => {
                return methods.map(method => pairKey(component, method));
            })
            .sort();
        const manifestPairs = COMPONENT_API_COVERAGE
            .map(entry => pairKey(entry.component, entry.method));

        expect(new Set(manifestPairs).size).toBe(manifestPairs.length);
        expect([...manifestPairs].sort()).toEqual(snapshotPairs);
    });

    test('uses valid classifications and complete coverage metadata', () => {
        COMPONENT_API_COVERAGE.forEach(entry => {
            expect(allowedStatuses.has(entry.status)).toBe(true);
            expect(allowedClassifications.has(entry.classification)).toBe(true);

            if (coveredStatuses.has(entry.status)) {
                expect(entry.publicMethod).toEqual(expect.any(String));
                expect(entry.publicMethod.length).toBeGreaterThan(0);
                expect(entry.controller).toMatch(/-methods$/);
            }

            if (
                statusesRequiringReason.has(entry.status)
                || (
                    coveredStatuses.has(entry.status)
                    && entry.publicMethod !== entry.method
                )
            ) {
                expect(entry.reason).toEqual(expect.any(String));
                expect(entry.reason.length).toBeGreaterThan(0);
            }
        });
    });

    test('matches each covered public method to exactly one declared controller', () => {
        const methodControllers = readControllerMethods();

        COMPONENT_API_COVERAGE
            .filter(entry => coveredStatuses.has(entry.status))
            .forEach(entry => {
                expect(methodControllers.get(entry.publicMethod)).toEqual([
                    entry.controller
                ]);
            });
    });

    test('documents exactly the method names shared by Component APIs', () => {
        const declaredSharedMethods = COMPONENT_API_SHARED_METHODS
            .map(entry => ({
                method: entry.method,
                components: [...entry.components].sort()
            }))
            .sort((left, right) => left.method.localeCompare(right.method));

        expect(new Set(COMPONENT_API_SHARED_METHODS.map(entry => entry.method)).size)
            .toBe(COMPONENT_API_SHARED_METHODS.length);

        COMPONENT_API_SHARED_METHODS.forEach(entry => {
            expect(new Set(entry.components).size).toBe(entry.components.length);
            expect(entry.reason).toEqual(expect.any(String));
            expect(entry.reason.length).toBeGreaterThan(0);
            expect(entry.ambPolicy).toEqual(expect.any(String));
            expect(entry.ambPolicy.length).toBeGreaterThan(0);
        });

        expect(declaredSharedMethods).toEqual(getSharedSnapshotMethods());
    });
});
