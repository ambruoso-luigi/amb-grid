import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, test } from 'vitest';

import {
    TABLE_API_COVERAGE,
    TABULATOR_API_VERSION
} from './support/tabulator-api-coverage.js';

const allowedStatuses = new Set([
    'exposed',
    'narrower-contract',
    'missing',
    'deferred',
    'intentionally-excluded'
]);
const allowedClassifications = new Set([
    'safe-pass-through',
    'AMB-aware',
    'overridden',
    'delicate',
    'not-applicable'
]);
const controllerDirectory = resolve('src/lib/table/controller');
const installedTabulatorPackage = JSON.parse(readFileSync(
    resolve('node_modules/tabulator-tables/package.json'),
    'utf8'
));

const readControllerMethods = () => {
    const methodControllers = new Map();

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

            TABLE_API_COVERAGE.forEach(({ method }) => {
                const pattern = new RegExp(
                    `^\\s{4,8}${method}\\s*\\(`,
                    'gm'
                );
                const matches = source.match(pattern) || [];

                matches.forEach(() => {
                    const controllers = methodControllers.get(method) || [];

                    controllers.push(controller);
                    methodControllers.set(method, controllers);
                });
            });
        });

    return methodControllers;
};

describe('stable Tabulator Table API coverage manifest', () => {
    test('uses valid unique entries for Tabulator 6.4.0', () => {
        const methods = TABLE_API_COVERAGE.map(entry => entry.method);

        expect(TABULATOR_API_VERSION).toBe('6.4.0');
        expect(installedTabulatorPackage.version).toBe(TABULATOR_API_VERSION);
        expect(new Set(methods).size).toBe(methods.length);

        TABLE_API_COVERAGE.forEach(entry => {
            expect(allowedStatuses.has(entry.status)).toBe(true);
            expect(allowedClassifications.has(entry.classification)).toBe(true);

            if (
                entry.status === 'exposed'
                || entry.status === 'narrower-contract'
            ) {
                expect(entry.controller).toMatch(/-methods$/);
            } else {
                expect(entry.reason).toEqual(expect.any(String));
                expect(entry.reason.length).toBeGreaterThan(0);
            }

            if (entry.status === 'narrower-contract') {
                expect(entry.reason).toEqual(expect.any(String));
                expect(entry.reason.length).toBeGreaterThan(0);
            }
        });
    });

    test('matches each exposed method to exactly one declared controller', () => {
        const methodControllers = readControllerMethods();

        TABLE_API_COVERAGE
            .filter(entry => {
                return entry.status === 'exposed'
                    || entry.status === 'narrower-contract';
            })
            .forEach(entry => {
                expect(methodControllers.get(entry.method)).toEqual([
                    entry.controller
                ]);
            });
    });
});
