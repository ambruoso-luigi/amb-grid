import { ref } from 'vue';
import { readDemoLanguage } from '../../../src/demo/demo-language-switch.js';

export const language = ref(readDemoLanguage());
