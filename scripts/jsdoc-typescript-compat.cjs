// Documentation-only adapter. TypeScript continues to read the untouched sources.
// Both parsers are dependencies of the installed JSDoc, not additional packages.
const { createRequire } = require('node:module');
const jsdocRequire = createRequire(require.resolve('jsdoc/package.json'));
const catharsis = jsdocRequire('catharsis');
const { parse } = jsdocRequire('@babel/parser');
const definitions = new Map();

function parseType(type) {
    // Closure generics can occur inside an otherwise TypeScript-shaped annotation.
    return parse(`type DocumentationType = ${type.replace(/\.\s*</g, '<')}`, {
        plugins: ['typescript']
    }).program.body[0].typeAnnotation;
}

// Read balanced tag type expressions, including multiline object types. Do not
// touch examples or JavaScript. Compatible types pass through, except inline
// record typedefs, whose fields need explicit property tags for the HTML template.
function typeTags(comment) {
    const tags = [];
    const pattern = /@(typedef|property|param|returns?)\s+\{/g;
    let match;
    while ((match = pattern.exec(comment))) {
        const start = pattern.lastIndex;
        let depth = 1;
        let quote = '';
        let end = start;
        for (; end < comment.length && depth; end++) {
            const char = comment[end];
            if (quote) {
                if (char === '\\') end++;
                else if (char === quote) quote = '';
            } else if (char === '"' || char === "'") quote = char;
            else if (char === '{') depth++;
            else if (char === '}') depth--;
        }
        if (depth) throw new Error('Unbalanced documentation type');
        tags.push({ tag: match[1], start, end: end - 1,
            type: comment.slice(start, end - 1).replace(/\r?\n\s*\*\s?/g, '\n') });
        pattern.lastIndex = end;
    }
    return tags;
}

function members(node) {
    if (node.type === 'TSTypeLiteral') return node.members;
    if (node.type === 'TSIntersectionType') return node.types.flatMap(members);
    if (node.type === 'TSTypeReference' && definitions.has(node.typeName.name)) {
        return members(parseType(definitions.get(node.typeName.name)));
    }
    throw new Error(`Cannot expand documentation intersection: ${node.type}`);
}

function propertyName(member) {
    if (member.type !== 'TSPropertySignature' || member.computed) {
        throw new Error(`Unsupported documentation property: ${member.type}`);
    }
    return member.key.name ?? member.key.value;
}

function render(node) {
    const keywords = { TSStringKeyword: 'string', TSNumberKeyword: 'number',
        TSBooleanKeyword: 'boolean', TSUnknownKeyword: 'unknown',
        TSObjectKeyword: 'object', TSUndefinedKeyword: 'undefined',
        TSNullKeyword: 'null', TSVoidKeyword: 'void' };
    if (keywords[node.type]) return keywords[node.type];
    switch (node.type) {
    case 'TSParenthesizedType': return render(node.typeAnnotation);
    case 'TSLiteralType': return JSON.stringify(node.literal.value);
    case 'TSUnionType': return `(${node.types.map(render).join('|')})`;
    case 'TSArrayType': return `Array.<${render(node.elementType)}>`;
    case 'TSTypeReference': {
        if (node.typeName.type !== 'Identifier') throw new Error('Unsupported qualified type');
        const parameters = node.typeParameters?.params;
        return node.typeName.name + (parameters ? `.<${parameters.map(render).join(', ')}>` : '');
    }
    case 'TSIndexedAccessType':
        if (node.indexType.type !== 'TSLiteralType' || typeof node.indexType.literal.value !== 'string') {
            throw new Error('Only named member references are supported');
        }
        return `${render(node.objectType)}#${node.indexType.literal.value}`;
    case 'TSFunctionType':
        return `function(${node.parameters.map(parameter => {
            const type = render(parameter.typeAnnotation.typeAnnotation);
            return parameter.optional ? `${type}=` : type;
        }).join(', ')}): ${render(node.typeAnnotation.typeAnnotation)}`;
    case 'TSIntersectionType':
    case 'TSTypeLiteral': {
        const entries = members(node);
        const index = entries.find(member => member.type === 'TSIndexSignature');
        if (index) {
            if (entries.length !== 1) throw new Error('Mixed index signatures require typedef properties');
            return `Object.<${render(index.parameters[0].typeAnnotation.typeAnnotation)}, ${render(index.typeAnnotation.typeAnnotation)}>`;
        }
        return `{${entries.map(member => {
            const type = render(member.typeAnnotation.typeAnnotation);
            return `${propertyName(member)}: ${member.optional ? `(${type}|undefined)` : type}`;
        }).join(', ')}}`;
    }
    default: throw new Error(`Unsupported documentation type: ${node.type}`);
    }
}

function typedef(node) {
    const entries = members(node);
    // Dictionaries retain their key/value types; mixed records expose every
    // named property and explicitly describe the additional accepted keys.
    if (entries.length === 1 && entries[0].type === 'TSIndexSignature') return { type: render(node), tags: '' };
    const notes = [];
    const tags = entries.flatMap(member => {
        if (member.type === 'TSIndexSignature') {
            notes.push(`Additional ${render(member.parameters[0].typeAnnotation.typeAnnotation)} keys accept ${render(member.typeAnnotation.typeAnnotation)} values.`);
            return [];
        }
        const name = propertyName(member);
        return `@property {${render(member.typeAnnotation.typeAnnotation)}} ${member.optional ? `[${name}]` : name}`;
    });
    if (node.type === 'TSIntersectionType') {
        for (const part of node.types.filter(part => part.type === 'TSTypeReference')) {
            tags.push(`@see ${render(part)}`);
        }
    }
    return { type: 'object', tags: '\n * ' + tags.join('\n * '), notes: notes.join(' ') };
}

exports.handlers = {
    parseBegin() { definitions.clear(); },
    beforeParse(event) {
        for (const comment of event.source.match(/\/\*\*[\s\S]*?\*\//g) || []) {
            const tag = typeTags(comment).find(entry => entry.tag === 'typedef');
            if (!tag) continue;
            const name = comment.slice(tag.end + 1).match(/^\s*(\w+)/)?.[1];
            if (!name) continue;
            if (tag.type === 'object') {
                const properties = [...comment.matchAll(/@property\s+\{([^}]+)\}\s+(\w+)/g)];
                definitions.set(name, `{${properties.map(property => `${property[2]}: ${property[1]}`).join(', ')}}`);
            } else definitions.set(name, tag.type);
        }
    },
    jsdocCommentFound(event) {
        let comment = event.comment;
        let extraTags = '';
        let notes = '';
        for (const tag of typeTags(comment).reverse()) {
            // Inline record typedefs also need explicit properties: the default
            // HTML template otherwise displays only "Object", hiding the fields.
            const recordTypedef = tag.tag === 'typedef' && tag.type.startsWith('{');
            if (!recordTypedef) {
                try { catharsis.parse(tag.type, { jsdoc: true }); continue; } catch { /* Normalize only unsupported syntax. */ }
            }
            const node = parseType(tag.type);
            const replacement = tag.tag === 'typedef' && ['TSTypeLiteral', 'TSIntersectionType'].includes(node.type)
                ? typedef(node) : { type: render(node), tags: '' };
            // Validate the conversion rather than hiding unhandled parser errors.
            catharsis.parse(replacement.type, { jsdoc: true });
            extraTags += replacement.tags;
            notes += replacement.notes || '';
            if (tag.tag !== 'typedef' && ['TSFunctionType', 'TSTypeLiteral'].includes(node.type)) {
                // JSDoc's default template abbreviates function and record types
                // to "function" / "Object". Keep their precise signature visible.
                const signature = tag.type.replace(/\s+/g, ' ').replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const tail = comment.slice(tag.end + 1);
                const boundary = tail.search(/\r?\n|\*\//);
                const position = boundary < 0 ? comment.length : tag.end + 1 + boundary;
                comment = comment.slice(0, position).trimEnd()
                    + ` TypeScript: <code>${signature}</code>. ` + comment.slice(position);
            }
            comment = comment.slice(0, tag.start) + replacement.type + comment.slice(tag.end);
        }
        if (notes) comment = comment.replace('@typedef', `${notes}\n * @typedef`);
        event.comment = extraTags ? comment.replace(/\*\/$/, `${extraTags}\n */`) : comment;
    }
};
