const logoUrl = new URL('./amb-grid-logo.png', import.meta.url).href;

export const renderDemoBrand = ({ href = '#top' } = {}) => `
    <a class="demo-brand" href="${href}" aria-label="AMB Grid">
        <img class="demo-brand__logo" src="${logoUrl}" alt="AMB Grid">
    </a>
`;
