import { createApp } from 'vue';
import { AMB } from 'amb-grid';
import 'amb-grid/style.css';
import { mountSiteNavbar } from '../../../src/demo/components/site-navbar.js';
import App from './App.vue';
import { language } from './language';
import './styles.css';

if (typeof AMB !== 'object' || AMB === null) throw new Error('AMB Grid is unavailable');

document.documentElement.lang = language.value;
mountSiteNavbar(document.querySelector('#site-navbar'), {
  onLanguageChange: next => { language.value = next; }
});
createApp(App).mount('#app');
