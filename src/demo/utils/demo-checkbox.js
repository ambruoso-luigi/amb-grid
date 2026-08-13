export const createDemoCheckboxFormatter = ({ checkedValue = true } = {}) => cell => {
    const stateClass = cell.getValue() === checkedValue ? ' is-checked' : '';

    return `<span class="demo-inspection-visual${stateClass}" aria-hidden="true"></span>`;
};
