<script setup lang="ts">
import { computed } from 'vue';
import ambGridLogo from '../../../../src/demo/amb-grid-logo.png';

const props = defineProps<{ language: 'it' | 'en' }>();
const copy = {
  it: {
    integration: 'Integrazione Vue',
    description: 'Antiquariato, design e oggetti con una storia.',
    videoLabel: 'Demo AMB Grid',
    videoOpen: 'Apri la demo video di AMB Grid su YouTube (nuova scheda)'
  },
  en: {
    integration: 'Vue integration',
    description: 'Antiques, design and objects with a story.',
    videoLabel: 'AMB Grid Demo',
    videoOpen: 'Open the AMB Grid video demo on YouTube (new tab)'
  }
} as const;
const text = computed(() => copy[props.language]);
</script>

<template>
  <header class="vue-hero" aria-labelledby="hero-title">
    <div class="vue-hero__brand">
      <img :src="ambGridLogo" alt="AMB Grid" width="450" height="70">
    </div>
    <div class="vue-hero__content">
      <div class="vue-identity">
        <span class="vue-identity__logo" aria-hidden="true">
          <svg viewBox="0 0 64 64" focusable="false">
            <path d="M3 7h13l16 27L48 7h13L32 57 3 7Z" fill="currentColor" />
            <path d="M16 7h10l6 10 6-10h10L32 34 16 7Z" fill="#102950" />
          </svg>
        </span>
        <span class="vue-identity__copy">
          <strong>{{ text.integration }}</strong>
          <small>Vue 3 + TypeScript + AMB Grid</small>
        </span>
      </div>
      <div class="vue-hero__intro">
        <h1 id="hero-title">Atelier <span>del Tempo</span></h1>
        <p>{{ text.description }}</p>
      </div>
    </div>
    <a class="vue-video-preview" href="https://www.youtube.com/watch?v=2qhXHt0Upps"
      target="_blank" rel="noopener noreferrer" :aria-label="text.videoOpen">
      <img class="vue-video-preview__image" src="https://i.ytimg.com/vi/2qhXHt0Upps/hqdefault.jpg" alt="" loading="eager">
      <span class="vue-video-preview__overlay" aria-hidden="true"></span>
      <span class="vue-video-preview__title">{{ text.videoLabel }}</span>
      <span class="vue-video-preview__destination">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M21.58 7.19a2.99 2.99 0 0 0-2.1-2.12C17.62 4.57 12 4.57 12 4.57s-5.62 0-7.48.5a2.99 2.99 0 0 0-2.1 2.12A31.2 31.2 0 0 0 1.92 12c0 1.62.2 3.23.5 4.81a2.99 2.99 0 0 0 2.1 2.12c1.86.5 7.48.5 7.48.5s5.62 0 7.48-.5a2.99 2.99 0 0 0 2.1-2.12c.3-1.58.5-3.19.5-4.81 0-1.62-.2-3.23-.5-4.81Z" fill="currentColor" />
          <path d="m10 15.5 5.2-3.5L10 8.5v7Z" fill="#fff" />
        </svg>
        YouTube
      </span>
    </a>
  </header>
</template>
