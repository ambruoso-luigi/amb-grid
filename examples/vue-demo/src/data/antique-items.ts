import type { AntiqueItem } from '../models/antique-item';

// Demonstration records: dates are approximate, prices simulated, photographs pending.
// Historical notes describe the object type, without certified makers or provenance.
export const antiqueItems: readonly AntiqueItem[] = [
  {
    id: 1, code: 'ADT-001', name: 'Pendola da parete in noce', category: 'Orologi',
    period: 'Fine Ottocento, circa 1890', approximateYear: 1890,
    materials: ['Noce', 'Ottone', 'Vetro'], condition: 'Buono', price: 680, available: true, images: [],
    notes: 'Cassa vetrata e pendolo a vista, nella tradizione degli orologi domestici di fine Ottocento. La finitura presenta lievi segni di uso; il movimento richiede una verifica prima della messa in servizio.'
  },
  {
    id: 2, code: 'ADT-002', name: 'Orologio da viaggio con custodia', category: 'Orologi',
    period: 'Primo Novecento, circa 1920', approximateYear: 1920,
    materials: ['Ottone', 'Vetro', 'Pelle'], condition: 'Buono', price: 310, available: true, images: [],
    notes: 'Piccolo orologio meccanico da viaggio con custodia ripiegabile, pensato per essere trasportato nel bagaglio. La pelle mostra usura sui bordi; quadrante leggibile e maniglia conservata.'
  },
  {
    id: 3, code: 'ADT-003', name: 'Sveglia meccanica a due campane', category: 'Orologi',
    period: 'Anni Quaranta, circa 1940', approximateYear: 1940,
    materials: ['Acciaio', 'Vetro'], condition: 'Da restaurare', price: 95, available: true, images: [],
    notes: 'Sveglia da comodino con suoneria esterna a due campane, diffusa nelle abitazioni della prima metà del Novecento. Ossidazioni sulla cassa e carica da revisionare; proposta come oggetto da recupero.'
  },
  {
    id: 4, code: 'ADT-004', name: 'Grammofono da tavolo con sportelli', category: 'Audio',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Acciaio', 'Ottone'], condition: 'Buono', price: 720, available: true, images: [],
    notes: 'Mobile compatto con tromba interna e sportelli frontali per modulare la diffusione del suono. Tipologia domestica per dischi a 78 giri; meccanismo a molla e diaframma non collaudati.'
  },
  {
    id: 5, code: 'ADT-005', name: 'Grammofono portatile a valigia', category: 'Audio',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Legno', 'Tessuto rivestito', 'Acciaio'], condition: 'Buono', price: 280, available: false, images: [],
    notes: 'La cassa a valigia integra il percorso acustico e rende trasportabile la riproduzione dei dischi a 78 giri. Rivestimento segnato vicino alla chiusura; manovella presente e accessori non originali possibili.'
  },
  {
    id: 6, code: 'ADT-006', name: 'Fonografo a cilindri con base lignea', category: 'Audio',
    period: 'Primo Novecento, circa 1905', approximateYear: 1905,
    materials: ['Ghisa', 'Ottone', 'Legno'], condition: 'Da restaurare', price: 1150, available: true, images: [],
    notes: 'Apparecchio della famiglia dei fonografi a cilindri, precedente alla diffusione del disco come supporto dominante. Manca la tromba acustica; registratore e trasmissione richiedono esame specialistico.'
  },
  {
    id: 7, code: 'ADT-007', name: 'Fotocamera pieghevole a soffietto', category: 'Fotografia',
    period: 'Primo Novecento, circa 1915', approximateYear: 1915,
    materials: ['Metallo', 'Pelle', 'Vetro'], condition: 'Buono', price: 240, available: true, images: [],
    notes: 'Fotocamera a rullo con sportello ribaltabile, concepita per ridurre gli ingombri durante il trasporto. Soffietto con pieghe marcate e otturatore da verificare; nessuna garanzia di tenuta alla luce.'
  },
  {
    id: 8, code: 'ADT-008', name: 'Fotocamera box con mirino superiore', category: 'Fotografia',
    period: 'Anni Trenta, circa 1935', approximateYear: 1935,
    materials: ['Lamiera', 'Tessuto rivestito', 'Vetro'], condition: 'Buono', price: 110, available: true, images: [],
    notes: 'La costruzione a scatola e i comandi ridotti caratterizzano le fotocamere destinate alla fotografia amatoriale. Il rivestimento è conservato con abrasioni; il mirino superiore presenta velature.'
  },
  {
    id: 9, code: 'ADT-009', name: 'Fotocamera da studio in legno', category: 'Fotografia',
    period: 'Inizio Novecento, circa 1900', approximateYear: 1900,
    materials: ['Legno', 'Ottone', 'Pelle', 'Vetro smerigliato'], condition: 'Da restaurare', price: 890, available: false, images: [],
    notes: 'Banco pieghevole con messa a fuoco su vetro smerigliato, tipico della ripresa su lastra. Soffietto fragile e portalastre assenti; lenti e parti meccaniche non sono state verificate per un uso fotografico.'
  },
  {
    id: 10, code: 'ADT-010', name: 'Macchina da scrivere portatile con valigia', category: 'Scrittura',
    period: 'Fine anni Trenta, circa 1938', approximateYear: 1938,
    materials: ['Acciaio', 'Gomma', 'Tessuto rivestito'], condition: 'Buono', price: 260, available: true, images: [],
    notes: 'Carrello compatto e custodia rigida rispondono alla crescente mobilità della scrittura professionale. Tasti completi, rullo indurito e nastro da sostituire; la battitura necessita di regolazione.'
  },
  {
    id: 11, code: 'ADT-011', name: 'Macchina da scrivere da ufficio', category: 'Scrittura',
    period: 'Anni Venti, circa 1920', approximateYear: 1920,
    materials: ['Ghisa verniciata', 'Acciaio', 'Gomma'], condition: 'Da restaurare', price: 190, available: true, images: [],
    notes: 'Struttura pesante a leve visibili, pensata per il lavoro continuativo di ufficio. Vernice consumata sulle zone di appoggio, alcuni leveraggi bloccati e ritorno del carrello da ripristinare.'
  },
  {
    id: 12, code: 'ADT-012', name: 'Macchina da scrivere meccanica color crema', category: 'Scrittura',
    period: 'Anni Cinquanta, circa 1955', approximateYear: 1955,
    materials: ['Metallo smaltato', 'Acciaio', 'Plastica'], condition: 'Ottimo', price: 340, available: false, images: [],
    notes: 'Scocca arrotondata e finitura chiara richiamano il design degli apparecchi domestici del dopoguerra. Tastiera completa e carro scorrevole; il colore non costituisce un elemento di attribuzione a un produttore.'
  },
  {
    id: 13, code: 'ADT-013', name: 'Lampada da scrittoio in ottone', category: 'Illuminazione',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Vetro opalino'], condition: 'Buono', price: 320, available: true, images: [],
    notes: 'Base zavorrata e paralume orientabile appartengono alla tipologia delle lampade da lettura da scrivania. Patina superficiale e piccoli segni sul vetro; impianto elettrico da controllare prima dell’utilizzo.'
  },
  {
    id: 14, code: 'ADT-014', name: 'Lume a petrolio con serbatoio in vetro', category: 'Illuminazione',
    period: 'Fine Ottocento, circa 1880', approximateYear: 1880,
    materials: ['Vetro', 'Ottone'], condition: 'Buono', price: 180, available: true, images: [],
    notes: 'Serbatoio stampato e bruciatore a stoppino documentano una tipologia di illuminazione precedente alla capillare elettrificazione. Camino presente con lievi irregolarità sul bordo; destinazione decorativa.'
  },
  {
    id: 15, code: 'ADT-015', name: 'Lampada da tavolo in vetro lattimo', category: 'Illuminazione',
    period: 'Anni Cinquanta, circa 1950', approximateYear: 1950,
    materials: ['Vetro lattimo', 'Ottone'], condition: 'Ottimo', price: 390, available: true, images: [],
    notes: 'Diffusore in vetro bianco e piede metallico sottile, secondo un linguaggio domestico del secondo dopoguerra. Non si propone alcuna attribuzione a designer o manifatture; cablaggio da verificare.'
  },
  {
    id: 16, code: 'ADT-016', name: 'Secretaire con ribalta e cassetti', category: 'Mobili',
    period: 'Secondo Ottocento, circa 1880', approximateYear: 1880,
    materials: ['Noce', 'Abete', 'Ottone'], condition: 'Buono', price: 1450, available: true, images: [],
    notes: 'Mobile da scrittura con piano a ribalta e scomparti interni, destinato alla corrispondenza e alla custodia di documenti. Sono visibili riprese della finitura; la serratura interna è priva di chiave.'
  },
  {
    id: 17, code: 'ADT-017', name: 'Sedia in noce con seduta intrecciata', category: 'Mobili',
    period: 'Inizio Novecento, circa 1900', approximateYear: 1900,
    materials: ['Noce', 'Fibra vegetale'], condition: 'Da restaurare', price: 120, available: true, images: [],
    notes: 'Schienale a traverse e seduta intrecciata richiamano la produzione domestica di uso quotidiano. Intreccio allentato e giunti da consolidare; la portata non è stata verificata e necessita di restauro.'
  },
  {
    id: 18, code: 'ADT-018', name: 'Comodino con piano in marmo', category: 'Mobili',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Marmo', 'Ottone'], condition: 'Buono', price: 360, available: false, images: [],
    notes: 'Anta singola e piccolo cassetto accompagnano il piano lapideo, soluzione diffusa nei mobili per la camera. Marmo con macchie superficiali e impiallacciatura ripresa su un fianco; ferramenta disomogenea.'
  },
  {
    id: 19, code: 'ADT-019', name: 'Bilancia da farmacia con vetrina', category: 'Strumenti scientifici',
    period: 'Primo Novecento, circa 1910', approximateYear: 1910,
    materials: ['Ottone', 'Legno', 'Vetro'], condition: 'Buono', price: 540, available: true, images: [],
    notes: 'Bilancia a due piatti protetta da una vetrina per limitare l’effetto delle correnti d’aria sulle pesate. Serie di pesi incompleta e taratura non verificata; presentata come strumento storico da collezione.'
  },
  {
    id: 20, code: 'ADT-020', name: 'Microscopio monoculare con specchio', category: 'Strumenti scientifici',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Ghisa', 'Vetro ottico'], condition: 'Buono', price: 430, available: true, images: [],
    notes: 'Illuminazione a specchio e messa a fuoco meccanica caratterizzano la strumentazione didattica del periodo. La base presenta usura e le ottiche richiedono pulizia; non è dichiarata una prestazione scientifica.'
  },
  {
    id: 21, code: 'ADT-021', name: 'Barometro aneroide da parete', category: 'Strumenti scientifici',
    period: 'Fine Ottocento, circa 1895', approximateYear: 1895,
    materials: ['Legno intagliato', 'Ottone', 'Vetro'], condition: 'Buono', price: 230, available: false, images: [],
    notes: 'Strumento domestico per seguire le variazioni della pressione atmosferica senza colonna di mercurio. Cornice intagliata con piccole perdite di finitura; indice e capsula aneroide non sono stati tarati.'
  },
  {
    id: 22, code: 'ADT-022', name: 'Scatola portagioie con intarsi geometrici', category: 'Oggetti decorativi',
    period: 'Inizio Novecento, circa 1900', approximateYear: 1900,
    materials: ['Legno', 'Impiallacciature miste', 'Ottone'], condition: 'Buono', price: 160, available: true, images: [],
    notes: 'Coperchio con intarsi geometrici e interno rivestito, secondo una tipologia di piccolo arredo personale. Alcune tessere mostrano sollevamenti; fodera probabilmente sostituita e serratura senza chiave.'
  },
  {
    id: 23, code: 'ADT-023', name: 'Vaso in ceramica con smalto verde', category: 'Oggetti decorativi',
    period: 'Anni Quaranta, circa 1940', approximateYear: 1940,
    materials: ['Ceramica smaltata'], condition: 'Ottimo', price: 140, available: true, images: [],
    notes: 'Corpo tornito con collo stretto e smalto verde dalle variazioni di tono, pensato come complemento di arredo. Fondo privo di marchi leggibili; non viene associato a una specifica manifattura.'
  },
  {
    id: 24, code: 'ADT-024', name: 'Cornice dorata con decoro a foglie', category: 'Oggetti decorativi',
    period: 'Fine Ottocento, circa 1885', approximateYear: 1885,
    materials: ['Legno', 'Gesso', 'Doratura'], condition: 'Da restaurare', price: 210, available: true, images: [],
    notes: 'Cornice sagomata con motivi vegetali in rilievo, adatta alla presentazione di un dipinto o di uno specchio. Lacune agli angoli e riprese nella doratura; venduta senza opera e senza vetro.'
  }
];

export const createAntiqueItems = (): AntiqueItem[] => antiqueItems.map(item => ({
  ...item,
  materials: [...item.materials],
  images: item.images.map(image => ({ ...image }))
}));
