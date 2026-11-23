import { expect, test } from '@playwright/test';

const titles = {
    it: ['Prepara il contenitore', 'Definisci dati e colonne', 'Crea la griglia CRUD', 'Ottieni il payload CRUD'],
    en: ['Prepare the container', 'Define data and columns', 'Create the CRUD grid', 'Get the CRUD payload']
};

for (const language of ['it', 'en']) {
    test(`JavaScript getting started focuses on four API steps (${language})`, async ({ page }) => {
        await page.addInitScript(value => localStorage.setItem('amb-grid-demo-language', value), language);
        await page.goto('/#getting-started-javascript');

        const guide = page.locator('#javascript-getting-started');
        const steps = guide.locator('.demo-guide-steps > .demo-guide-step');
        await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
        await expect(steps).toHaveCount(4);
        await expect(steps.locator('.demo-guide-step__number')).toHaveText(['1', '2', '3', '4']);
        await expect(steps.locator('h3')).toHaveText(titles[language]);
        await expect(guide.locator('[data-i18n="guide.startText"]')).toContainText(language === 'it' ? 'Quattro passaggi' : 'Four steps');
        await expect(guide.locator('[data-i18n="guide.step1.text"]')).toContainText(language === 'it' ? 'elemento HTML' : 'HTML element');
        await expect(guide.locator('[data-i18n="guide.step2.text"]')).toContainText(language === 'it' ? 'array di oggetti' : 'array of JavaScript objects');
        await expect(guide.locator('[data-i18n="guide.step3.text"]')).toContainText('AMB.table()');
        await expect(guide.locator('[data-i18n="guide.step4.note"]')).toContainText(language === 'it' ? 'non esegue il salvataggio' : 'does not save');
        await expect(guide.locator('.demo-guide-next')).toHaveCount(0);
        await expect(guide.getByText(language === 'it' ? 'Devi ancora installare AMB Grid?' : 'Need to install AMB Grid first?')).toBeVisible();
        await expect(guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' })).toHaveAttribute('href', '/install/');
        await expect(steps.nth(2).locator('code')).toContainText('AMB.table');
        await expect(steps.nth(3).locator('code')).toContainText('getSavePayload');
        await expect(steps.nth(3).locator('code')).toContainText('payload.changes');
        await expect(guide.locator('.demo-guide-app-css')).toHaveCount(0);
        await expect(guide.locator('[data-i18n="guide.step4.note"]')).toBeVisible();
        const snippets = await steps.locator('code').allTextContents();
        expect(snippets).toHaveLength(4);
        expect(snippets[0]).toBe('<div id="grid"></div>');
        expect(snippets[1].match(/const rows\s*=/g)).toHaveLength(1);
        expect(snippets[2]).toContain("buttons: ['add', 'payload']");
        expect(snippets[2]).toContain('grid.addRow(');
        expect(snippets[3]).toBe('const payload = grid.getSavePayload();\n\nconsole.log(payload.changes);');
        expect(snippets.join('\n')).not.toMatch(/grid\.crud|saveRows/);
        expect(() => new Function('AMB', snippets.slice(1).join('\n'))).not.toThrow();
        await expect(page.locator('#javascript-integration')).toHaveCount(0);
        await expect(page.locator('.demo-guide-mode-card')).toHaveCount(0);
        await expect(guide).not.toContainText('npm install');
        await expect(guide).not.toContainText("'amb-grid/style.css'");
        await guide.getByRole('link', { name: language === 'it' ? 'Vai alla pagina Installazione →' : 'Go to the Installation page →' }).click();
        await expect(page).toHaveURL(/\/install\/$/);
        await expect(page.locator('.installation-hero h1')).toHaveText(language === 'it' ? 'Installa AMB Grid' : 'Install AMB Grid');
    });
}

test('the displayed snippets create an isolated grid and expose its changes', async ({ page }) => {
    await page.goto('/#getting-started-javascript');
    await expect(page.locator('#inventory-table.tabulator')).toBeVisible();
    await page.evaluate(() => {
        const snippets = [...document.querySelectorAll('#javascript-getting-started .demo-guide-step code')].map(code => code.textContent);
        const fixture = document.createElement('section');
        fixture.id = 'guide-snippet-test';
        fixture.innerHTML = snippets[0];
        document.body.append(fixture);
        const messages = [];
        const example = new Function('AMB', 'console', `${snippets[1]}\n${snippets[2]}\nreturn { grid, showPayload: () => { ${snippets[3]} } };`)(window.AMB, { log: value => messages.push(value) });
        window.__guideSnippetTest = { ...example, messages, fixture };
    });
    try {
        const fixture = page.locator('#guide-snippet-test');
        await expect(fixture.locator('#grid .tabulator-row')).toHaveCount(2);
        const add = fixture.locator('.amb-toolbar__button--add');
        const payloadButton = fixture.locator('.amb-toolbar__button--payload');
        await expect(add).toBeEnabled();
        await expect(payloadButton).toBeEnabled();
        await expect(fixture.locator('.amb-toolbar__button')).toHaveCount(2);
        await add.click();
        await expect(fixture.locator('#grid .tabulator-row')).toHaveCount(3);
        await expect(fixture.locator('#grid .tabulator-row[data-state="new"]')).toHaveCount(1);
        await expect.poll(() => page.evaluate(() => window.__guideSnippetTest.grid.getSavePayload().changes.inserted.length)).toBe(1);
        const changes = await page.evaluate(() => window.__guideSnippetTest.grid.getSavePayload().changes);
        expect(changes.inserted[0]).toMatchObject({ id: null, sku: '', productName: '', stockQuantity: 0 });
        await payloadButton.click();
        await expect.poll(() => page.evaluate(() => window.__guideSnippetTest.messages.length)).toBe(1);
        await page.evaluate(() => window.__guideSnippetTest.showPayload());
        const messages = await page.evaluate(() => window.__guideSnippetTest.messages);
        expect(messages).toEqual([changes, changes]);
    } finally {
        await page.evaluate(() => {
            window.__guideSnippetTest.grid.destroy();
            window.__guideSnippetTest.fixture.remove();
            delete window.__guideSnippetTest;
        });
    }
});

test('the technical guide expands below the heading on desktop and mobile', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#getting-started-javascript');
    const demo = page.locator('#javascript-demo');
    const heading = demo.locator('.demo-app-shell__meta h2');
    const description = demo.locator('.demo-main-description');
    const shell = demo.locator('.demo-app-shell');
    const disclosure = shell.locator(':scope > .demo-disclosure--technical');
    const summary = disclosure.locator('summary');
    const content = disclosure.locator('.demo-disclosure__content');
    const launch = shell.locator('[data-action="tutorial-launch"]');
    const workbench = shell.locator('.demo-table-workbench');
    const tutorial = shell.locator('#javascript-inventory-tutorial');
    const table = workbench.locator('#inventory-table');
    await expect(table).toBeVisible();

    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(heading).toBeVisible();
        await expect(disclosure).not.toHaveAttribute('open');
        await expect(summary).toBeVisible();
        const closedBox = await summary.boundingBox();
        const shellBox = await shell.boundingBox();
        expect(closedBox.width).toBeLessThan(shellBox.width);
        if (width > 760) {
            const headingBox = await heading.boundingBox();
            const launchBox = await launch.boundingBox();
            expect(launchBox.x).toBeGreaterThanOrEqual(headingBox.x + headingBox.width - 1);
            expect(closedBox.x).toBeGreaterThanOrEqual(launchBox.x + launchBox.width - 1);
        }

        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(disclosure).toHaveAttribute('open', '');
        await expect(content).toBeVisible();
        await expect(heading).toBeVisible();
        const headingBox = await heading.boundingBox();
        const descriptionBox = await description.boundingBox();
        const openBox = await content.boundingBox();
        const tableBox = await workbench.boundingBox();
        expect(openBox.y).toBeGreaterThanOrEqual(descriptionBox.y + descriptionBox.height - 1);
        expect(openBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height - 1);
        expect(openBox.width).toBeGreaterThanOrEqual(shellBox.width - 4);
        expect(tableBox.y).toBeGreaterThanOrEqual(openBox.y + openBox.height - 1);
        if (await tutorial.isVisible()) {
            const tutorialBox = await tutorial.boundingBox();
            expect(tutorialBox.y).toBeGreaterThanOrEqual(openBox.y + openBox.height - 1);
            expect(tableBox.y).toBeGreaterThanOrEqual(tutorialBox.y + tutorialBox.height - 1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);

        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(disclosure).not.toHaveAttribute('open');
        await expect(summary).toBeVisible();
    }
});
