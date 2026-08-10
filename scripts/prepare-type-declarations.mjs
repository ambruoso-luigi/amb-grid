import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const declarationPath = resolve(projectRoot, 'dist-lib/index.d.ts');
const cssDeclarationPath = resolve(projectRoot, 'dist-lib/css-modules.d.ts');
const cssReference = '/// <reference path="./css-modules.d.ts" />';
const declaration = readFileSync(declarationPath, 'utf8');

writeFileSync(cssDeclarationPath, "declare module '*.css';\n", 'utf8');
writeFileSync(
    declarationPath,
    declaration.startsWith(cssReference)
        ? declaration
        : `${cssReference}\n${declaration}`,
    'utf8'
);
