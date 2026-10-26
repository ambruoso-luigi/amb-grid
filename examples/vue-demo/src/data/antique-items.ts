import type { AntiqueItem } from '../models/antique-item';

// Demonstration records: dates are approximate, prices simulated, licensed photographs show illustrative analogues.
// Historical notes describe the object type, without certified makers or provenance.
export const antiqueItems: readonly AntiqueItem[] = [
  {
    id: 1, code: 'ADT-001', name: 'Pendola da parete in noce', category: 'Orologi',
    period: 'Fine Ottocento, circa 1890', approximateYear: 1890,
    materials: ['Noce', 'Ottone', 'Vetro'], condition: 'Buono', price: 680, available: true, images: [
      { src: '/vue/images/adt-001-1.jpg', thumbnail: '/vue/images/adt-001-1-thumb.jpg',
        alt: "Pendola da parete con cassa lignea e pendolo a vista",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Pendola da parete con cassa lignea e pendolo a vista. Megatherium - CC BY-SA 4.0." }
    ],
    notes: 'Cassa vetrata e pendolo a vista, nella tradizione degli orologi domestici di fine Ottocento. La finitura presenta lievi segni di uso; il movimento richiede una verifica prima della messa in servizio.'
  },
  {
    id: 2, code: 'ADT-002', name: 'Orologio da viaggio con custodia', category: 'Orologi',
    period: 'Primo Novecento, circa 1920', approximateYear: 1920,
    materials: ['Ottone', 'Vetro', 'Pelle'], condition: 'Buono', price: 310, available: true, images: [
      { src: '/vue/images/adt-002-1.jpg', thumbnail: '/vue/images/adt-002-1-thumb.jpg',
        alt: "Orologio da viaggio, esemplare museale AM16360 - vista 1",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Orologio da viaggio, esemplare museale AM16360 - vista 1. Auckland War Memorial Museum Tamaki Paenga Hira - CC BY 4.0." },
      { src: '/vue/images/adt-002-2.jpg', thumbnail: '/vue/images/adt-002-2-thumb.jpg',
        alt: "Orologio da viaggio, esemplare museale AM16360 - vista 2",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Orologio da viaggio, esemplare museale AM16360 - vista 2. Auckland War Memorial Museum Tamaki Paenga Hira - CC BY 4.0." }
    ],
    notes: 'Piccolo orologio meccanico da viaggio con custodia ripiegabile, pensato per essere trasportato nel bagaglio. La pelle mostra usura sui bordi; quadrante leggibile e maniglia conservata.'
  },
  {
    id: 4, code: 'ADT-004', name: 'Grammofono da tavolo con sportelli', category: 'Audio',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Acciaio', 'Ottone'], condition: 'Buono', price: 720, available: true, images: [
      { src: '/vue/images/adt-004-1.jpg', thumbnail: '/vue/images/adt-004-1-thumb.jpg',
        alt: "Grammofono acustico da tavolo con mobile in legno",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Grammofono acustico da tavolo con mobile in legno. 波喜多 - CC0." }
    ],
    notes: 'Mobile compatto con tromba interna e sportelli frontali per modulare la diffusione del suono. Tipologia domestica per dischi a 78 giri; meccanismo a molla e diaframma non collaudati.'
  },
  {
    id: 6, code: 'ADT-006', name: 'Fonografo a cilindri con base lignea', category: 'Audio',
    period: 'Primo Novecento, circa 1905', approximateYear: 1905,
    materials: ['Ghisa', 'Ottone', 'Legno'], condition: 'Da restaurare', price: 1150, available: true, images: [
      { src: '/vue/images/adt-006-1.jpg', thumbnail: '/vue/images/adt-006-1-thumb.jpg',
        alt: "Fonografo a cilindri esposto alla 1811 Kid Ory Historic House - vista 1",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Fonografo a cilindri esposto alla 1811 Kid Ory Historic House - vista 1. Infrogmation of New Orleans - CC BY-SA 4.0." },
      { src: '/vue/images/adt-006-2.jpg', thumbnail: '/vue/images/adt-006-2-thumb.jpg',
        alt: "Fonografo a cilindri esposto alla 1811 Kid Ory Historic House - vista 2",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Fonografo a cilindri esposto alla 1811 Kid Ory Historic House - vista 2. Infrogmation of New Orleans - CC BY-SA 4.0." }
    ],
    notes: 'Apparecchio della famiglia dei fonografi a cilindri, precedente alla diffusione del disco come supporto dominante. Manca la tromba acustica; registratore e trasmissione richiedono esame specialistico.'
  },
  {
    id: 7, code: 'ADT-007', name: 'Fotocamera pieghevole a soffietto', category: 'Fotografia',
    period: 'Primo Novecento, circa 1915', approximateYear: 1915,
    materials: ['Metallo', 'Pelle', 'Vetro'], condition: 'Buono', price: 240, available: true, images: [
      { src: '/vue/images/adt-007-1.jpg', thumbnail: '/vue/images/adt-007-1-thumb.jpg',
        alt: "Fotocamera pieghevole Beier Beirax a soffietto",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Fotocamera pieghevole Beier Beirax a soffietto. LoMit - CC BY-SA 4.0." }
    ],
    notes: 'Fotocamera a rullo con sportello ribaltabile, concepita per ridurre gli ingombri durante il trasporto. Soffietto con pieghe marcate e otturatore da verificare; nessuna garanzia di tenuta alla luce.'
  },
  {
    id: 10, code: 'ADT-010', name: 'Macchina da scrivere portatile con valigia', category: 'Scrittura',
    period: 'Fine anni Trenta, circa 1938', approximateYear: 1938,
    materials: ['Acciaio', 'Gomma', 'Tessuto rivestito'], condition: 'Buono', price: 260, available: true, images: [
      { src: '/vue/images/adt-010-1.jpg', thumbnail: '/vue/images/adt-010-1-thumb.jpg',
        alt: "Macchina da scrivere portatile Remington",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Macchina da scrivere portatile Remington. Maksym Kozlenko - CC BY-SA 4.0." }
    ],
    notes: 'Carrello compatto e custodia rigida rispondono alla crescente mobilità della scrittura professionale. Tasti completi, rullo indurito e nastro da sostituire; la battitura necessita di regolazione.'
  },
  {
    id: 12, code: 'ADT-012', name: 'Macchina da scrivere meccanica color crema', category: 'Scrittura',
    period: 'Anni Cinquanta, circa 1955', approximateYear: 1955,
    materials: ['Metallo smaltato', 'Acciaio', 'Plastica'], condition: 'Ottimo', price: 340, available: false, images: [
      { src: '/vue/images/adt-012-1.jpg', thumbnail: '/vue/images/adt-012-1-thumb.jpg',
        alt: "Macchina da scrivere color crema Triumph Tippa - vista 1",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Macchina da scrivere color crema Triumph Tippa - vista 1. Raimond Spekking - CC BY-SA 4.0." },
      { src: '/vue/images/adt-012-2.jpg', thumbnail: '/vue/images/adt-012-2-thumb.jpg',
        alt: "Macchina da scrivere color crema Triumph Tippa - vista 2",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Macchina da scrivere color crema Triumph Tippa - vista 2. Raimond Spekking - CC BY-SA 4.0." }
    ],
    notes: 'Scocca arrotondata e finitura chiara richiamano il design degli apparecchi domestici del dopoguerra. Tastiera completa e carro scorrevole; il colore non costituisce un elemento di attribuzione a un produttore.'
  },
  {
    id: 13, code: 'ADT-013', name: 'Lampada da scrittoio in ottone', category: 'Illuminazione',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Vetro opalino'], condition: 'Buono', price: 320, available: true, images: [
      { src: '/vue/images/adt-013-1.jpg', thumbnail: '/vue/images/adt-013-1-thumb.jpg',
        alt: "Lampada da scrittoio in ottone con paralume in vetro verde",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Lampada da scrittoio in ottone con paralume in vetro verde. Axl0506 - CC BY-SA 3.0." }
    ],
    notes: 'Base zavorrata e paralume orientabile appartengono alla tipologia delle lampade da lettura da scrivania. Patina superficiale e piccoli segni sul vetro; impianto elettrico da controllare prima dell’utilizzo.'
  },
  {
    id: 16, code: 'ADT-016', name: 'Secretaire con ribalta e cassetti', category: 'Mobili',
    period: 'Secondo Ottocento, circa 1880', approximateYear: 1880,
    materials: ['Noce', 'Abete', 'Ottone'], condition: 'Buono', price: 1450, available: true, images: [
      { src: '/vue/images/adt-016-1.jpg', thumbnail: '/vue/images/adt-016-1-thumb.jpg',
        alt: "Secretaire storico con ribalta e cassetti",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Secretaire storico con ribalta e cassetti. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Mobile da scrittura con piano a ribalta e scomparti interni, destinato alla corrispondenza e alla custodia di documenti. Sono visibili riprese della finitura; la serratura interna è priva di chiave.'
  },
  {
    id: 18, code: 'ADT-018', name: 'Comodino con piano in marmo', category: 'Mobili',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Marmo', 'Ottone'], condition: 'Buono', price: 360, available: false, images: [
      { src: '/vue/images/adt-018-1.jpg', thumbnail: '/vue/images/adt-018-1-thumb.jpg',
        alt: "Comodino storico con piano in marmo",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Comodino storico con piano in marmo. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Anta singola e piccolo cassetto accompagnano il piano lapideo, soluzione diffusa nei mobili per la camera. Marmo con macchie superficiali e impiallacciatura ripresa su un fianco; ferramenta disomogenea.'
  },
  {
    id: 19, code: 'ADT-019', name: 'Bilancia da farmacia con vetrina', category: 'Strumenti scientifici',
    period: 'Primo Novecento, circa 1910', approximateYear: 1910,
    materials: ['Ottone', 'Legno', 'Vetro'], condition: 'Buono', price: 540, available: true, images: [
      { src: '/vue/images/adt-019-1.jpg', thumbnail: '/vue/images/adt-019-1-thumb.jpg',
        alt: "Bilancia a due piatti con vetrina protettiva",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Bilancia a due piatti con vetrina protettiva. Jeff Keyzer from Austin, TX, USA - CC BY-SA 2.0." }
    ],
    notes: 'Bilancia a due piatti protetta da una vetrina per limitare l’effetto delle correnti d’aria sulle pesate. Serie di pesi incompleta e taratura non verificata; presentata come strumento storico da collezione.'
  },
  {
    id: 20, code: 'ADT-020', name: 'Microscopio monoculare con specchio', category: 'Strumenti scientifici',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Ghisa', 'Vetro ottico'], condition: 'Buono', price: 430, available: true, images: [
      { src: '/vue/images/adt-020-1.jpg', thumbnail: '/vue/images/adt-020-1-thumb.jpg',
        alt: "Microscopio monoculare storico con specchio",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Microscopio monoculare storico con specchio. Wellcome Collection / Wellcome Images - CC BY 4.0." }
    ],
    notes: 'Illuminazione a specchio e messa a fuoco meccanica caratterizzano la strumentazione didattica del periodo. La base presenta usura e le ottiche richiedono pulizia; non è dichiarata una prestazione scientifica.'
  },
  {
    id: 21, code: 'ADT-021', name: 'Barometro aneroide da parete', category: 'Strumenti scientifici',
    period: 'Fine Ottocento, circa 1895', approximateYear: 1895,
    materials: ['Legno intagliato', 'Ottone', 'Vetro'], condition: 'Buono', price: 230, available: false, images: [
      { src: '/vue/images/adt-021-1.jpg', thumbnail: '/vue/images/adt-021-1-thumb.jpg',
        alt: "Barometro aneroide su supporto ligneo",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Barometro aneroide su supporto ligneo. Reconrabbit - CC0." }
    ],
    notes: 'Strumento domestico per seguire le variazioni della pressione atmosferica senza colonna di mercurio. Cornice intagliata con piccole perdite di finitura; indice e capsula aneroide non sono stati tarati.'
  },
  {
    id: 24, code: 'ADT-024', name: 'Cornice dorata con decoro a foglie', category: 'Oggetti decorativi',
    period: 'Fine Ottocento, circa 1885', approximateYear: 1885,
    materials: ['Legno', 'Gesso', 'Doratura'], condition: 'Da restaurare', price: 210, available: true, images: [
      { src: '/vue/images/adt-024-1.jpg', thumbnail: '/vue/images/adt-024-1-thumb.jpg',
        alt: "Cornice storica intagliata con motivi vegetali",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Cornice storica intagliata con motivi vegetali. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Cornice sagomata con motivi vegetali in rilievo, adatta alla presentazione di un dipinto o di uno specchio. Lacune agli angoli e riprese nella doratura; venduta senza opera e senza vetro.'
  }
];

export const createAntiqueItems = (): AntiqueItem[] => antiqueItems.map(item => ({
  ...item,
  materials: [...item.materials],
  images: item.images.map(image => ({ ...image }))
}));
