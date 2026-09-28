export type DemoCommandGuideLocale = 'it' | 'en';

export type DemoCommandGuideTab = 'mouse' | 'keyboard' | 'editing' | 'special';

type GuideItem = {
    keys: readonly string[];
    text: string;
};

type GuideTabCopy = {
    label: string;
    items: readonly GuideItem[];
};

type GuideCopy = {
    title: string;
    subtitle: string;
    tabs: Record<DemoCommandGuideTab, GuideTabCopy>;
};

export const commandGuideCopy: Record<DemoCommandGuideLocale, GuideCopy> = {
    it: {
        title: 'Come interagire con la tabella',
        subtitle: 'Mouse, tastiera e scorciatoie disponibili nella demo',
        tabs: {
            mouse: {
                label: 'Mouse',
                items: [
                    { keys: ['Click'], text: 'Focalizza una cella per navigare.' },
                    { keys: ['Doppio click'], text: 'Apre l’editor delle celle compatibili.' },
                    { keys: ['Editor'], text: 'Click, trascinamento e doppio click sul testo restano nell’editor attivo.' },
                    { keys: ['Altra cella'], text: 'Conclude l’editing attraverso il normale lifecycle.' }
                ]
            },
            keyboard: {
                label: 'Tastiera',
                items: [
                    { keys: ['←', '↑', '↓', '→'], text: 'In navigazione spostano il focus tra celle operative.' },
                    { keys: ['Tab', 'Shift+Tab'], text: 'Seguono le celle editabili o interattive e attraversano le pagine locali.' },
                    { keys: ['Alt+PageUp', 'Alt+PageDown'], text: 'Aprono la pagina precedente o successiva quando disponibile.' },
                    { keys: ['Enter'], text: 'Apre l’editor della cella editabile focalizzata.' }
                ]
            },
            editing: {
                label: 'Modifica',
                items: [
                    { keys: ['Enter'], text: 'Conferma gli editor inline standard.' },
                    { keys: ['Esc'], text: 'Annulla gli editor inline standard e riporta il focus alla cella.' },
                    { keys: ['←', '↑', '↓', '→'], text: 'Durante l’editing restano nell’editor o nel controllo quando previsto.' },
                    { keys: ['Tab', 'Shift+Tab'], text: 'Confermano e proseguono la navigazione negli editor compatibili.' }
                ]
            },
            special: {
                label: 'Azioni speciali',
                items: [
                    { keys: ['F2'], text: 'Su controlli compatibili apre l’azione ausiliaria, come lookup o calendario.' },
                    { keys: ['Space', 'Enter'], text: 'Su checkbox e controlli compatibili attivano o cambiano valore.' },
                    { keys: ['1', '0'], text: 'Nella colonna di selezione compatibile selezionano o deselezionano la riga.' },
                    { keys: ['Lookup', 'Data'], text: 'I controlli speciali mantengono le proprie regole di tastiera e dialogo.' }
                ]
            }
        }
    },
    en: {
        title: 'How to interact with the table',
        subtitle: 'Mouse, keyboard, and shortcuts available in the demo',
        tabs: {
            mouse: {
                label: 'Mouse',
                items: [
                    { keys: ['Click'], text: 'Focus a cell for navigation.' },
                    { keys: ['Double click'], text: 'Open the editor of compatible cells.' },
                    { keys: ['Editor'], text: 'Clicking, dragging, and double-clicking text stay inside the active editor.' },
                    { keys: ['Another cell'], text: 'Leave editing through its normal lifecycle.' }
                ]
            },
            keyboard: {
                label: 'Keyboard',
                items: [
                    { keys: ['←', '↑', '↓', '→'], text: 'In navigation, move focus between operational cells.' },
                    { keys: ['Tab', 'Shift+Tab'], text: 'Move through editable or interactive cells and across local pages.' },
                    { keys: ['Alt+PageUp', 'Alt+PageDown'], text: 'Open the previous or next page when available.' },
                    { keys: ['Enter'], text: 'Open the focused editable cell editor.' }
                ]
            },
            editing: {
                label: 'Editing',
                items: [
                    { keys: ['Enter'], text: 'Commit standard inline editors.' },
                    { keys: ['Esc'], text: 'Cancel standard inline editors and return focus to the cell.' },
                    { keys: ['←', '↑', '↓', '→'], text: 'While editing, remain with the editor or control where supported.' },
                    { keys: ['Tab', 'Shift+Tab'], text: 'Commit and continue navigation in compatible editors.' }
                ]
            },
            special: {
                label: 'Special actions',
                items: [
                    { keys: ['F2'], text: 'On compatible controls, open an auxiliary action such as lookup or calendar.' },
                    { keys: ['Space', 'Enter'], text: 'On compatible checkboxes and controls, activate or change value.' },
                    { keys: ['1', '0'], text: 'In a compatible selection column, select or deselect the row.' },
                    { keys: ['Lookup', 'Date'], text: 'Special controls retain their own keyboard and dialog rules.' }
                ]
            }
        }
    }
};
