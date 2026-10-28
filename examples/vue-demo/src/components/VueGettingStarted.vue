<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';

const props = defineProps<{ language: 'it' | 'en' }>();

// Static excerpts for display only; they never create another AMB Grid instance.
const snippets = {
  mount: `import { onMounted, ref } from 'vue';
import { AMB } from 'amb-grid';
import { createAntiqueItems } from '../data/antique-items';

const container = ref<HTMLDivElement | null>(null);
const items = createAntiqueItems();
let grid: ReturnType<typeof AMB.table> | null = null;

onMounted(() => {
  if (!container.value) return;
  grid = AMB.table({
    selector: container.value, data: items, toolbar: false,
    layout: 'fitColumns', height: 540,
    initialSort: [{ column: 'name', dir: 'asc' }],
    columns: [
      { title: 'Oggetto', field: 'name', minWidth: 260, widthGrow: 3,
        sorter: 'string', sorterParams: { locale: 'it' } },
    ],
  });
});`,
  image: `const photoColumn = {
  title: 'Foto', field: 'images', width: 120, headerSort: false,
  formatter: AMB.formatters.image({
    width: 80,
    height: 72,
    fit: 'cover',
    preview: true,
    viewer: true,
  }),
};`,
  price: `const priceColumn = {
  title: 'Prezzo', field: 'price', width: 150, sorter: 'number',
  hozAlign: 'right', headerHozAlign: 'right',
  formatter: AMB.formatters.currency({
    locale: 'it-IT', currency: 'EUR',
  }),
};`,
  notes: `const notesColumn = {
  title: 'Note', field: 'notes', minWidth: 300,
  formatter: AMB.formatters.largeTextPreview({ maxLength: 50 }),
  editor: AMB.editors.largeText({
    title: "Storia dell'oggetto", readOnly: true, closeText: 'Chiudi',
    width: 720, maxWidth: '92vw', textareaHeight: 320,
  }),
  floatingMessages: {
    largeTextPreviews: {
      enabled: true, title: "Storia dell'oggetto",
      className: 'antique-notes-tooltip', maxLength: 160,
    },
  },
};`,
  cleanup: `import { onBeforeUnmount } from 'vue';

onBeforeUnmount(() => {
  grid?.destroy();
  grid = null;
});`,
} as const;

const copy = {
  it: {
    title: 'Inizia con AMB Grid in Vue',
    intro: 'La demo Atelier del Tempo mostra come utilizzare AMB Grid in un componente Vue per realizzare un catalogo di antiquariato con immagini, schede descrittive e contenuti consultabili attraverso formatter dedicati.',
    installPrompt: 'Devi ancora installare AMB Grid?',
    installLink: 'Vai alla pagina Installazione →',
    codeLabel: 'Codice TypeScript / Composition API',
    steps: [
      {
        title: 'Inizializza AMB Grid con Vue',
        description: 'Vue controlla il contenitore DOM, collegato con ref. Dopo il montaggio, onMounted esegue AMB.table(): AMB Grid gestisce la tabella all’interno del contenitore fornito da Vue.',
        note: 'Estratto parziale di AntiqueCatalog.vue, nello script setup TypeScript: è mostrata solo la colonna Oggetto. Il template collega il contenitore con <div ref="container" />. Le altre colonne e le opzioni Floating Messages sono omesse qui; lo smontaggio è descritto al passaggio 4.',
      },
      {
        title: 'Mostra immagini e anteprime nel catalogo',
        description: 'AMB.formatters.image mostra le fotografie nella cella con dimensioni e ritaglio definiti. preview abilita l’anteprima; viewer apre il visualizzatore completo. Il campo images contiene una galleria di fotografie, ciascuna con src e, quando disponibili, thumbnail, alt e caption.',
        note: 'Estratto della colonna Foto di AntiqueCatalog.vue, da inserire in columns. photoColumn dà un nome alla configurazione originale senza cambiarne le opzioni.',
      },
      {
        title: 'Personalizza la presentazione delle informazioni',
        description: 'Il formatter currency presenta i prezzi in euro. largeTextPreview limita a 50 caratteri le note in cella; il Floating Message mostra un estratto fino a 160 caratteri. Aprendo la cella Note, largeText permette di consultare la storia completa in un dialogo readonly: il catalogo è dedicato alla consultazione.',
        note: 'Estratti delle colonne Prezzo e Note di AntiqueCatalog.vue. priceColumn e notesColumn nominano le configurazioni da inserire in columns. Nella tabella, floatingMessages.enabled e floatingMessages.largeTextPreviews sono già true; le opzioni della colonna definiscono titolo, classe e lunghezza dell’estratto.',
      },
      {
        title: 'Gestisci correttamente lo smontaggio',
        description: 'Quando Vue smonta il componente, destroy rilascia le risorse dell’istanza AMB Grid. Azzerare il riferimento evita di conservare una griglia distrutta; il cleanup impedisce che restino griglie o listener inutilizzati.',
        note: 'Estratto dello stesso script setup di AntiqueCatalog.vue: grid è l’istanza dichiarata al passaggio 1. Il componente reale importa onBeforeUnmount insieme a onMounted e ref.',
      },
    ],
  },
  en: {
    title: 'Get started with AMB Grid in Vue',
    intro: 'The Atelier del Tempo demo shows how to use AMB Grid in a Vue component to build an antiques catalogue with images, descriptive entries and content presented through dedicated formatters.',
    installPrompt: 'Still need to install AMB Grid?',
    installLink: 'Go to the Installation page →',
    codeLabel: 'TypeScript / Composition API code',
    steps: [
      {
        title: 'Initialize AMB Grid with Vue',
        description: 'Vue owns the DOM container, linked through ref. After mounting, onMounted calls AMB.table(): AMB Grid manages the table inside the container provided by Vue.',
        note: 'Partial excerpt from the TypeScript script setup in AntiqueCatalog.vue: only the Object column is shown. The template connects the container using <div ref="container" />. Other columns and Floating Messages options are omitted here; step 4 covers unmounting.',
      },
      {
        title: 'Show images and previews in the catalogue',
        description: 'AMB.formatters.image displays photographs in the cell with explicit dimensions and cropping. preview enables the preview; viewer opens the full viewer. The images field contains a photo gallery, with src and, where available, thumbnail, alt and caption for each image.',
        note: 'Excerpt from the Photo column in AntiqueCatalog.vue, for use in columns. photoColumn names the original configuration without changing its options.',
      },
      {
        title: 'Customize how information is presented',
        description: 'The currency formatter displays prices in euros. largeTextPreview limits cell notes to 50 characters; the Floating Message shows an excerpt of up to 160 characters. Opening the Notes cell lets users read the full history in a readonly largeText dialog: this is a catalogue for browsing.',
        note: 'Excerpts from the Price and Notes columns in AntiqueCatalog.vue. priceColumn and notesColumn name the configurations to place in columns. At table level, floatingMessages.enabled and floatingMessages.largeTextPreviews are already true; column options define the excerpt title, class and length.',
      },
      {
        title: 'Clean up correctly on unmount',
        description: 'When Vue unmounts the component, destroy releases the AMB Grid instance’s resources. Clearing the reference avoids retaining a destroyed grid; cleanup prevents unused grids or listeners from remaining.',
        note: 'Excerpt from the same script setup in AntiqueCatalog.vue: grid is the instance declared in step 1. The actual component imports onBeforeUnmount alongside onMounted and ref.',
      },
    ],
  },
} as const;

const text = computed(() => copy[props.language]);
const stepCode = [[snippets.mount], [snippets.image], [snippets.price, snippets.notes], [snippets.cleanup]];

// Local highlighting of fixed excerpts, using text VNodes so Vue escapes HTML.
const CodeBlock = defineComponent({
  props: { code: { type: String, required: true }, label: { type: String, required: true } },
  setup(block) {
    return () => {
      const tokens = block.code.split(/(\/\/[^\n]*|'[^'\n]*'|"[^"\n]*"|\b(?:const|let|if|return|import|from|typeof|null|true|false)\b|\bAMB\b|\b\d+\b|\b[A-Za-z_$][\w$]*(?=\())/g);
      return h('pre', { class: 'vue-start-code', tabindex: 0, 'aria-label': block.label }, [
        h('code', tokens.map((token, index) => {
          const kind = token.startsWith('//') ? 'comment'
            : /^['"]/.test(token) ? 'string'
              : token === 'AMB' ? 'api'
                : /^\d+$/.test(token) ? 'number'
                  : /^(const|let|if|return|import|from|typeof|null|true|false)$/.test(token) ? 'keyword'
                    : index % 2 === 1 ? 'function' : undefined;
          return kind ? h('span', { class: `vue-start-token--${kind}` }, token) : token;
        })),
      ]);
    };
  },
});
</script>

<template>
  <section id="vue-getting-started" class="vue-start-guide" aria-labelledby="vue-getting-started-title">
    <header class="vue-start-guide__heading">
      <p class="vue-start-guide__kicker">VUE · COMPOSITION API</p>
      <h2 id="vue-getting-started-title">{{ text.title }}</h2>
      <p>{{ text.intro }}</p>
      <p class="vue-start-guide__install">{{ text.installPrompt }} <a href="/install/">{{ text.installLink }}</a></p>
    </header>
    <ol class="vue-start-guide__steps">
      <li v-for="(step, index) in text.steps" :key="index" class="vue-start-step">
        <span class="vue-start-step__number" aria-hidden="true">{{ index + 1 }}</span>
        <div class="vue-start-step__body">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
          <p class="vue-start-step__note">{{ step.note }}</p>
          <CodeBlock v-for="(code, block) in stepCode[index]" :key="block" :code="code" :label="`${step.title} — ${text.codeLabel} ${block + 1}`" />
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.vue-start-guide { --vue-guide-accent: #258764; background: #f8faf9; color: #142033; margin: 40px auto 20px; max-width: 1320px; padding: clamp(20px, 3vw, 40px); width: 100%; }
.vue-start-guide__heading { margin-bottom: 28px; }
.vue-start-guide .vue-start-guide__kicker { color: #206f53; font-size: 13px; font-weight: 800; letter-spacing: .08em; }
.vue-start-guide h2 { font-size: clamp(28px, 3.2vw, 42px); font-weight: 750; line-height: 1.12; margin: 10px 0 16px; }
.vue-start-guide h3 { font-size: clamp(21px, 2.3vw, 26px); font-weight: 700; line-height: 1.2; margin: 0 0 12px; }
.vue-start-guide p { color: #50677c; font-size: 16px; line-height: 1.65; margin: 0 0 12px; max-width: 920px; }
.vue-start-guide .vue-start-guide__install { font-size: 14px; margin-top: 18px; }
.vue-start-guide__install a { color: #206f53; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.vue-start-guide__install a:hover { color: #164d3a; }
.vue-start-guide a:focus-visible, .vue-start-guide :deep(.vue-start-code:focus-visible) { outline: 2px solid var(--vue-guide-accent); outline-offset: 4px; }
.vue-start-guide__steps { list-style: none; margin: 0; padding: 0; }
.vue-start-step { border-top: 1px solid #dbe5df; display: grid; gap: 18px; grid-template-columns: 34px minmax(0, 1fr); padding: 30px 0; }
.vue-start-step:last-child { border-bottom: 1px solid #dbe5df; }
.vue-start-step__number { align-items: center; background: #206f53; border-radius: 50%; color: #fff; display: flex; font-size: 15px; font-weight: 800; height: 34px; justify-content: center; width: 34px; }
.vue-start-step__body { min-width: 0; }
.vue-start-guide .vue-start-step__note { font-size: 14px; line-height: 1.6; }
.vue-start-guide :deep(.vue-start-code) { background: #0d1420; border: 1px solid #25344a; border-radius: 8px; color: #dbe7f5; font: 13px/1.6 Consolas, "Courier New", monospace; margin: 18px 0 0; max-width: 100%; overflow-x: auto; padding: 18px; scrollbar-color: #52647d #111c2c; tab-size: 2; white-space: pre; }
.vue-start-guide :deep(.vue-start-code code) { color: inherit; font: inherit; }
.vue-start-guide :deep(.vue-start-token--keyword) { color: #c792ea; }
.vue-start-guide :deep(.vue-start-token--string) { color: #b9d88b; }
.vue-start-guide :deep(.vue-start-token--number) { color: #f2c580; }
.vue-start-guide :deep(.vue-start-token--comment) { color: #9baac0; font-style: italic; }
.vue-start-guide :deep(.vue-start-token--function) { color: #82c7ff; }
.vue-start-guide :deep(.vue-start-token--api) { color: #58d6c7; font-weight: 700; }
@media (max-width: 640px) {
  .vue-start-guide { margin-top: 28px; padding: 18px 6px; }
  .vue-start-step { gap: 12px; grid-template-columns: minmax(0, 1fr); padding-block: 24px; }
  .vue-start-guide :deep(.vue-start-code) { padding: 14px; }
}
</style>
