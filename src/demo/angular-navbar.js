import { mountSiteNavbar } from './components/site-navbar.js';
import { readDemoLanguage } from './demo-language-switch.js';

document.documentElement.lang = readDemoLanguage();
mountSiteNavbar(document.querySelector('#site-navbar'));
