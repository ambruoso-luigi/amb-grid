import { mountDemoFooter } from './demo-footer.js';
import { mountSiteNavbar } from './components/site-navbar.js';
import { readDemoLanguage } from './demo-language-switch.js';

document.documentElement.lang = readDemoLanguage();
mountSiteNavbar(document.querySelector('#site-navbar'));

mountDemoFooter(document.querySelector('#site-footer'));
