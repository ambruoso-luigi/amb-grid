import { expect, test } from '@playwright/test';

const guideSelector = '#demo-command-guide-panel';

const expectWorkbenchOrder = async (page, workbenchSelector, toolbarSelector, gridSelector) => {
    await expect.poll(() => page.locator(workbenchSelector).evaluate((workbench, selectors) => {
        const indexOf = selector => [...workbench.children]
            .findIndex(child => child.matches(selector));

        const [host, toolbar, grid] = selectors.map(indexOf);

        return host > -1 && toolbar > host && grid > toolbar;
    }, [
        '.demo-command-guide-host',
        toolbarSelector,
        gridSelector
    ])).toBe(true);
};

test('the JavaScript demo command guide opens, localizes, and leaves the grid intact', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/#getting-started-javascript');
    const table = page.locator('#inventory-table.tabulator');
    const trigger = page.locator('[data-action="demo-command-guide"]');

    await expect(table).toBeVisible();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'demo-command-guide-panel');

    const gridSnapshot = await table.evaluate(element => ({
        className: element.className,
        rowCount: element.querySelectorAll('.tabulator-row:not(.tabulator-calcs)').length
    }));

    await trigger.click();
    const panel = page.locator(guideSelector);
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveClass(/is-command-guide-active/);
    await expect(panel).toContainText('Come interagire con la tabella');
    await expectWorkbenchOrder(page, '#javascript-demo .demo-table-workbench', '.amb-toolbar', '#inventory-table');
    expect(await table.evaluate((element, snapshot) => ({
        className: element.className,
        rowCount: element.querySelectorAll('.tabulator-row:not(.tabulator-calcs)').length
    }), gridSnapshot)).toEqual(gridSnapshot);

    const tabs = panel.getByRole('tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs).toHaveText([
        'Navigazione',
        'Modifica',
        'Durante la modifica',
        'Checkbox e selezione',
        'Lookup, calendario e conferme'
    ]);
    await panel.getByRole('tab', { name: 'Modifica', exact: true }).click();
    await expect(panel.getByRole('tab', { name: 'Modifica', exact: true }))
        .toHaveAttribute('aria-selected', 'true');

    await page.locator('#site-navbar').getByRole('button', { name: 'English' }).click();
    await expect(trigger).toContainText('Command guide');
    await expect(trigger).toHaveAttribute('title', 'Mouse, keyboard and table shortcuts');
    await expect(trigger).toHaveAttribute('aria-label', 'Mouse, keyboard and table shortcuts');
    await expect(panel).toContainText('How to interact with the table');
    await expect(tabs).toHaveText([
        'Navigation',
        'Editing',
        'While editing',
        'Checkboxes & selection',
        'Lookup, calendar & dialogs'
    ]);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveCount(1);

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveClass(/is-command-guide-active/);
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(pageErrors).toEqual([]);
});

test('the React demo shares one command guide across a route change', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/#getting-started-react');
    await expect(page.locator('.inventory-toolbar')).toBeVisible();
    await expect(page.locator('.react-demo-grid')).toBeVisible();

    const trigger = page.locator(
        '.inventory-toolbar button[aria-controls="demo-command-guide-panel"]'
    );
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveAttribute('aria-controls', 'demo-command-guide-panel');
    await trigger.click();

    const panel = page.locator(guideSelector);
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect.poll(() => page.locator('.inventory-workspace').evaluate(workspace => {
        const indexOf = selector => [...workspace.children]
            .findIndex(child => child.matches(selector));

        const host = indexOf('.demo-command-guide-host');
        const toolbar = indexOf('.inventory-toolbar');
        const grid = indexOf('.react-demo-grid-shell');

        return host > -1 && toolbar > host && grid > toolbar;
    })).toBe(true);

    await page.locator('#site-navbar').getByRole('button', { name: 'English' }).click();
    await expect(trigger).toContainText('Command guide');
    await expect(trigger).toHaveAttribute('title', 'Mouse, keyboard and table shortcuts');
    await expect(trigger).toHaveAttribute('aria-label', 'Mouse, keyboard and table shortcuts');
    await expect(panel).toContainText('How to interact with the table');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveCount(1);

    await page.evaluate(() => { window.location.hash = '#getting-started-javascript'; });
    const javascriptTrigger = page.locator('[data-action="demo-command-guide"]');
    await expect(javascriptTrigger).toBeVisible();
    await expect(page.locator('.inventory-toolbar')).toHaveCount(0);
    await javascriptTrigger.click();
    await expect(page.locator(guideSelector)).toHaveCount(1);
    await expect(page.locator(guideSelector)).toHaveAttribute('aria-hidden', 'false');
    expect(pageErrors).toEqual([]);
});
