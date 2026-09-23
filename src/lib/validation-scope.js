export const VALIDATION_SCOPE = Object.freeze({
    CELL: 'cell',
    ROW: 'row',
    FIELD: 'field',
    GRID: 'grid'
});

const VALIDATION_SCOPE_PRIORITY = {
    [VALIDATION_SCOPE.CELL]: 0,
    [VALIDATION_SCOPE.ROW]: 1,
    [VALIDATION_SCOPE.FIELD]: 2,
    [VALIDATION_SCOPE.GRID]: 3
};

export const normalizeValidationScope = scope => {
    return Object.prototype.hasOwnProperty.call(VALIDATION_SCOPE_PRIORITY, scope)
        ? scope
        : VALIDATION_SCOPE.CELL;
};

export const getBroadestValidationScope = (validators = []) => {
    return (validators || []).reduce((broadestScope, validator) => {
        const scope = normalizeValidationScope(validator && validator.scope);

        return VALIDATION_SCOPE_PRIORITY[scope] > VALIDATION_SCOPE_PRIORITY[broadestScope]
            ? scope
            : broadestScope;
    }, VALIDATION_SCOPE.CELL);
};

export const normalizeValidationDependsOn = dependsOn => {
    if (dependsOn === '*') return '*';
    if (!Array.isArray(dependsOn)) return null;

    const fields = [...new Set(dependsOn.filter(field => {
        return typeof field === 'string' && field.length > 0;
    }))];

    return fields.length ? fields : null;
};

export const mergeValidationDependsOn = (validators = []) => {
    const fields = [];

    for (const validator of validators || []) {
        const dependsOn = normalizeValidationDependsOn(validator && validator.dependsOn);

        if (dependsOn === '*') return '*';
        if (dependsOn) fields.push(...dependsOn);
    }

    return normalizeValidationDependsOn(fields);
};
