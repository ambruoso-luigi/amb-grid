import { expect } from '@playwright/test';

export async function setSiteLanguage(page, language) {
    const navbar = page.locator('#site-navbar');
    const toggle = navbar.locator('.site-navbar__menu-toggle');
    const responsive = await toggle.isVisible();
    if (responsive) {
        if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }
    await navbar.getByRole('button', { name: language === 'en' ? 'English' : 'Italiano', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    if (responsive) await expect(toggle).toHaveAttribute('aria-expanded', 'false');
}
