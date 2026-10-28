<script setup lang="ts">
import VueHero from './components/VueHero.vue';
import AntiqueCatalog from './components/AntiqueCatalog.vue';
import VueGettingStarted from './components/VueGettingStarted.vue';
import { language } from './language';
</script>

<template>
  <main class="atelier-page">
    <VueHero :language="language" />
    <section id="collections-catalogue" class="atelier-catalogue" aria-labelledby="catalogue-title">
      <h2 id="catalogue-title">{{ language === 'it' ? 'Catalogo delle collezioni' : 'Collections catalogue' }}</h2>
      <AntiqueCatalog />
    </section>
    <VueGettingStarted :language="language" />
  </main>
</template>
