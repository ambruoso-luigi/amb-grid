export type DemoCommandGuideLocale = 'it' | 'en';

export type DemoCommandGuideTab = 'navigation' | 'editing' | 'whileEditing' | 'checkbox' | 'advanced';

type GuideToken = { label: string; kind: 'key' | 'action' };
type GuideItem = { tokens: readonly GuideToken[]; text: string };
type GuideGroup = { title?: string; items: readonly GuideItem[] };
type GuideTabCopy = { label: string; groups: readonly GuideGroup[] };
type GuideCopy = {
    title: string;
    subtitle: string;
    trigger: { label: string; title: string };
    tabs: Record<DemoCommandGuideTab, GuideTabCopy>;
};

const key = (label: string): GuideToken => ({ label, kind: 'key' });
const action = (label: string): GuideToken => ({ label, kind: 'action' });

export const commandGuideCopy: Record<DemoCommandGuideLocale, GuideCopy> = {
    it: {
        title: 'Come interagire con la tabella',
        subtitle: 'Navigazione, modifica e controlli della tabella',
        trigger: { label: 'Guida comandi', title: 'Mouse, tastiera e scorciatoie della tabella' },
        tabs: {
            navigation: {
                label: 'Navigazione',
                groups: [{ items: [
                    { tokens: [action('Click su una cella')], text: 'Seleziona la cella senza aprirne la modifica.' },
                    { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'Spostano la selezione tra le celle disponibili.' },
                    { tokens: [key('Tab')], text: 'Passa alla cella successiva.' },
                    { tokens: [key('Shift+Tab')], text: 'Passa alla cella precedente. Tab e Shift+Tab possono continuare automaticamente tra le pagine locali della tabella.' },
                    { tokens: [key('Alt+PageUp'), key('Alt+PageDown')], text: 'Passano alla pagina precedente o successiva, quando disponibile.' }
                ] }]
            },
            editing: {
                label: 'Modifica',
                groups: [{ items: [
                    { tokens: [action('Doppio click su una cella editabile')], text: 'Apre la modifica della cella.' },
                    { tokens: [key('Enter')], text: 'Su una cella selezionata apre la modifica della cella editabile.' },
                    { tokens: [key('Enter')], text: 'Durante la modifica conferma il valore negli editor compatibili e applica le eventuali regole di validazione.' },
                    { tokens: [key('Tab'), key('Shift+Tab')], text: 'Durante la modifica confermano il valore, applicano le eventuali regole di validazione e passano alla cella successiva o precedente.' },
                    { tokens: [key('Esc')], text: 'Annulla la modifica corrente e torna alla cella.' },
                    { tokens: [action("Click su un'altra cella")], text: 'Conclude la modifica corrente e passa alla cella selezionata.' }
                ] }]
            },
            whileEditing: {
                label: 'Durante la modifica',
                groups: [{ items: [
                    { tokens: [action('Click nel testo')], text: 'Posiziona il cursore nel punto desiderato senza uscire dalla modifica.' },
                    { tokens: [action('Trascina sul testo')], text: 'Seleziona una parte del testo.' },
                    { tokens: [action('Doppio click sul testo')], text: 'Seleziona una parola.' },
                    { tokens: [key('←'), key('→')], text: 'Negli editor di testo spostano il cursore.' },
                    { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'Durante la modifica le frecce restano al controllo attivo quando questo le utilizza.' }
                ] }]
            },
            checkbox: {
                label: 'Checkbox e selezione',
                groups: [
                    { title: 'Checkbox dati', items: [
                        { tokens: [action('Click nella cella')], text: 'Cambia il valore della checkbox. Puoi cliccare in qualsiasi punto della cella, non soltanto sul quadratino.' },
                        { tokens: [key('Space'), key('Enter')], text: 'Alternano lo stato della checkbox quando la checkbox è la cella attiva.' },
                        { tokens: [key('1'), key('S')], text: 'Attiva.' },
                        { tokens: [key('0'), key('N')], text: 'Disattiva.' }
                    ] },
                    { title: 'Selezione riga', items: [
                        { tokens: [action('Click')], text: 'Seleziona o deseleziona la riga tramite la checkbox dedicata.' },
                        { tokens: [key('Space'), key('Enter')], text: 'Alternano la selezione della riga.' },
                        { tokens: [key('1'), key('0')], text: 'Selezionano o deselezionano direttamente.' }
                    ] }
                ]
            },
            advanced: {
                label: 'Lookup, calendario e conferme',
                groups: [
                    { title: 'Lookup', items: [
                        { tokens: [key('F2')], text: 'Apre la finestra di ricerca della cella, dove supportato.' },
                        { tokens: [action('Click su un risultato')], text: 'Evidenzia il risultato.' },
                        { tokens: [action('Doppio click')], text: 'Seleziona e conferma il risultato.' },
                        { tokens: [key('↑'), key('↓')], text: 'Spostano la selezione tra i risultati.' },
                        { tokens: [key('Enter')], text: 'Conferma il risultato selezionato.' },
                        { tokens: [key('Esc')], text: 'Chiude il lookup senza selezionare un nuovo valore.' },
                        { tokens: [key('Alt+PageUp'), key('Alt+PageDown')], text: 'Passano alla pagina precedente o successiva dei risultati.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Spostano il focus tra i controlli della finestra senza uscire dal lookup.' }
                    ] },
                    { title: 'Calendario', items: [
                        { tokens: [key('F2')], text: 'Apre il calendario nelle celle data compatibili.' },
                        { tokens: [action('Click su una data')], text: 'Seleziona la data.' },
                        { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'Navigano nel calendario.' },
                        { tokens: [key('Enter')], text: 'Conferma la data evidenziata nel calendario.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Confermano il valore e passano alla cella successiva o precedente.' },
                        { tokens: [key('Esc')], text: 'Chiude il calendario. Nelle celle solo-calendario annulla la modifica corrente.' }
                    ] },
                    { title: 'Finestre di conferma', items: [
                        { tokens: [key('←'), key('↑'), key('→'), key('↓')], text: 'Spostano la selezione tra Annulla e Conferma.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Spostano il focus tra i pulsanti della finestra senza uscire dal dialog.' },
                        { tokens: [key('Esc')], text: "Annulla l'operazione e chiude la finestra." }
                    ] }
                ]
            }
        }
    },
    en: {
        title: 'How to interact with the table',
        subtitle: 'Table navigation, editing and controls',
        trigger: { label: 'Command guide', title: 'Mouse, keyboard and table shortcuts' },
        tabs: {
            navigation: {
                label: 'Navigation',
                groups: [{ items: [
                    { tokens: [action('Click a cell')], text: 'Selects the cell without opening editing.' },
                    { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'Move selection between available cells.' },
                    { tokens: [key('Tab')], text: 'Moves to the next cell.' },
                    { tokens: [key('Shift+Tab')], text: 'Moves to the previous cell. Tab and Shift+Tab can continue automatically across local table pages.' },
                    { tokens: [key('Alt+PageUp'), key('Alt+PageDown')], text: 'Move to the previous or next page when available.' }
                ] }]
            },
            editing: {
                label: 'Editing',
                groups: [{ items: [
                    { tokens: [action('Double click an editable cell')], text: 'Opens cell editing.' },
                    { tokens: [key('Enter')], text: 'On a selected cell, opens editing for the editable cell.' },
                    { tokens: [key('Enter')], text: 'While editing, confirms the value in compatible editors and applies any validation rules.' },
                    { tokens: [key('Tab'), key('Shift+Tab')], text: 'While editing, confirm the value, apply any validation rules, and move to the next or previous cell.' },
                    { tokens: [key('Esc')], text: 'Cancels the current edit and returns to the cell.' },
                    { tokens: [action('Click another cell')], text: 'Finishes the current edit and moves to the selected cell.' }
                ] }]
            },
            whileEditing: {
                label: 'While editing',
                groups: [{ items: [
                    { tokens: [action('Click text')], text: 'Places the cursor where needed without leaving editing.' },
                    { tokens: [action('Drag over text')], text: 'Selects part of the text.' },
                    { tokens: [action('Double click text')], text: 'Selects a word.' },
                    { tokens: [key('←'), key('→')], text: 'In text editors, move the cursor.' },
                    { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'While editing, arrows stay with the active control when it uses them.' }
                ] }]
            },
            checkbox: {
                label: 'Checkboxes & selection',
                groups: [
                    { title: 'Data checkboxes', items: [
                        { tokens: [action('Click the cell')], text: 'Changes the checkbox value. You can click anywhere in the cell, not only the box.' },
                        { tokens: [key('Space'), key('Enter')], text: 'Toggle the checkbox when it is the active cell.' },
                        { tokens: [key('1'), key('Y')], text: 'Check.' },
                        { tokens: [key('0'), key('N')], text: 'Uncheck.' }
                    ] },
                    { title: 'Row selection', items: [
                        { tokens: [action('Click')], text: 'Selects or deselects the row through its dedicated checkbox.' },
                        { tokens: [key('Space'), key('Enter')], text: 'Toggle row selection.' },
                        { tokens: [key('1'), key('0')], text: 'Select or deselect directly.' }
                    ] }
                ]
            },
            advanced: {
                label: 'Lookup, calendar & dialogs',
                groups: [
                    { title: 'Lookup', items: [
                        { tokens: [key('F2')], text: 'Opens the cell search window where supported.' },
                        { tokens: [action('Click a result')], text: 'Highlights the result.' },
                        { tokens: [action('Double click')], text: 'Selects and confirms the result.' },
                        { tokens: [key('↑'), key('↓')], text: 'Move selection between results.' },
                        { tokens: [key('Enter')], text: 'Confirms the selected result.' },
                        { tokens: [key('Esc')], text: 'Closes lookup without selecting a new value.' },
                        { tokens: [key('Alt+PageUp'), key('Alt+PageDown')], text: 'Move to the previous or next result page.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Move focus between window controls without leaving lookup.' }
                    ] },
                    { title: 'Calendar', items: [
                        { tokens: [key('F2')], text: 'Opens the calendar in compatible date cells.' },
                        { tokens: [action('Click a date')], text: 'Selects the date.' },
                        { tokens: [key('←'), key('↑'), key('↓'), key('→')], text: 'Navigate the calendar.' },
                        { tokens: [key('Enter')], text: 'Confirms the highlighted calendar date.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Confirm the value and move to the next or previous cell.' },
                        { tokens: [key('Esc')], text: 'Closes the calendar. In picker-only cells, cancels the current edit.' }
                    ] },
                    { title: 'Confirmation dialogs', items: [
                        { tokens: [key('←'), key('↑'), key('→'), key('↓')], text: 'Move selection between Cancel and Confirm.' },
                        { tokens: [key('Tab'), key('Shift+Tab')], text: 'Move focus between dialog buttons without leaving the dialog.' },
                        { tokens: [key('Esc')], text: 'Cancels the operation and closes the dialog.' }
                    ] }
                ]
            }
        }
    }
};
