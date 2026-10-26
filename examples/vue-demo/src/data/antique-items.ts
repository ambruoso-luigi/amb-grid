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
    notes: 'Nelle case di fine Ottocento la pendola da parete scandiva le attività quotidiane e costituiva un elemento stabile del soggiorno. Il pendolo regolava il movimento meccanico, mentre la cassa proteggeva gli organi dalla polvere e contribuiva alla presenza decorativa dello strumento. Per questo articolo simulato sono dichiarati una struttura in noce, parti in ottone e una chiusura vetrata che lascia osservare il pendolo. La finitura presenta lievi segni di uso, compatibili con lo stato buono indicato in catalogo. Il movimento richiede una verifica prima della messa in servizio: non sono attestati precisione, durata della carica o interventi di restauro.'
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
    notes: 'La diffusione dei viaggi ferroviari e dei soggiorni fuori casa favorì piccoli orologi capaci di accompagnare il proprietario nel bagaglio. Intorno al 1920 questi strumenti affiancavano alla funzione pratica una cura particolare per la leggibilità del quadrante e la protezione durante il trasporto. Il modello simulato è descritto con parti in ottone e vetro e una custodia ripiegabile in pelle; il quadrante è leggibile e la maniglia conservata. La pelle mostra usura lungo i bordi, senza che ciò implichi una provenienza documentata o una revisione del meccanismo. Per il collezionista interessa il rapporto fra compattezza e costruzione meccanica, non una precisione di marcia qui non certificata.'
  },
  {
    id: 4, code: 'ADT-004', name: 'Grammofono da tavolo con sportelli', category: 'Audio',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Acciaio', 'Ottone'], condition: 'Buono', price: 720, available: true, images: [
      { src: '/vue/images/adt-004-1.jpg', thumbnail: '/vue/images/adt-004-1-thumb.jpg',
        alt: "Grammofono acustico da tavolo con mobile in legno",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Grammofono acustico da tavolo con mobile in legno. 波喜多 - CC0." }
    ],
    notes: 'Negli anni Venti il grammofono a tromba interna rese più discreta la presenza della riproduzione sonora negli ambienti domestici. Il percorso acustico era raccolto nel mobile e gli sportelli frontali permettevano di attenuare la diffusione del suono, senza ricorrere ad amplificazione elettrica. La scheda simulata descrive una cassa in legno impiallacciato con componenti in acciaio e ottone, destinata ai dischi a 78 giri. La costruzione unisce quindi arredo e meccanica, aspetto significativo nella storia del consumo musicale. Lo stato generale è indicato come buono, ma meccanismo a molla e diaframma non sono collaudati; non viene garantita la riproduzione sicura di supporti storici.'
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
    notes: 'All’inizio del Novecento il cilindro era ancora un supporto importante per la registrazione e la riproduzione della voce e della musica. Nei fonografi il solco veniva seguito da uno stilo collegato a un diaframma, le cui vibrazioni erano diffuse acusticamente. Questa tipologia racconta una fase della cultura sonora precedente al predominio commerciale del disco. L’articolo simulato presenta una base lignea e componenti in ghisa e ottone; è dichiarato da restaurare e privo della tromba acustica. Il registratore e la trasmissione richiedono un esame specialistico prima di qualsiasi impiego. La descrizione non attesta completezza, compatibilità con cilindri specifici o capacità di registrazione.'
  },
  {
    id: 7, code: 'ADT-007', name: 'Fotocamera pieghevole a soffietto', category: 'Fotografia',
    period: 'Primo Novecento, circa 1915', approximateYear: 1915,
    materials: ['Metallo', 'Pelle', 'Vetro'], condition: 'Buono', price: 240, available: true, images: [
      { src: '/vue/images/adt-007-1.jpg', thumbnail: '/vue/images/adt-007-1-thumb.jpg',
        alt: "Fotocamera pieghevole Beier Beirax a soffietto",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Fotocamera pieghevole Beier Beirax a soffietto. LoMit - CC BY-SA 4.0." }
    ],
    notes: 'La fotocamera pieghevole rispondeva al desiderio di portare la fotografia fuori dallo studio senza trasportare un apparecchio sempre esteso. Lo sportello ribaltabile consentiva di avanzare il gruppo ottico, mentre il soffietto creava il collegamento oscurato con il corpo destinato al rullo. Per il modello simulato, collocato intorno al 1915, sono indicati metallo, pelle e vetro, con conservazione generale buona. Le pieghe del soffietto risultano marcate e l’otturatore resta da verificare: non è garantita la tenuta alla luce. L’interesse collezionistico riguarda la soluzione costruttiva compatta; formato del negativo, prestazioni dell’obiettivo e possibilità di uso fotografico non sono certificati.'
  },
  {
    id: 10, code: 'ADT-010', name: 'Macchina da scrivere portatile con valigia', category: 'Scrittura',
    period: 'Fine anni Trenta, circa 1938', approximateYear: 1938,
    materials: ['Acciaio', 'Gomma', 'Tessuto rivestito'], condition: 'Buono', price: 260, available: true, images: [
      { src: '/vue/images/adt-010-1.jpg', thumbnail: '/vue/images/adt-010-1-thumb.jpg',
        alt: "Macchina da scrivere portatile Remington",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Macchina da scrivere portatile Remington. Maksym Kozlenko - CC BY-SA 4.0." }
    ],
    notes: 'Alla fine degli anni Trenta la macchina da scrivere portatile accompagnava corrispondenza, studio e lavoro anche lontano dalla scrivania dell’ufficio. Il carrello compatto e la valigia proteggevano un meccanismo che trasferiva il colpo dei tasti sulla carta attraverso il nastro inchiostrato. La scheda di questo articolo simulato indica acciaio, gomma e rivestimento tessile, con tastiera completa e stato generale buono. Il rullo è però indurito, il nastro deve essere sostituito e la battitura richiede regolazione. Sono condizioni rilevanti per chi desidera consultare la meccanica oltre all’aspetto estetico, senza presumere una revisione già eseguita o un funzionamento immediatamente regolare.'
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
    notes: 'Nel secondo dopoguerra la macchina da scrivere entrò sempre più nel paesaggio domestico, accanto al suo impiego professionale. Le scocche dalle linee arrotondate e le finiture chiare attenuavano il carattere industriale del meccanismo, rendendolo adatto anche a uno scrittoio di casa. Questo articolo simulato, riferito a circa il 1955, combina metallo smaltato, acciaio e plastica; sono dichiarati tastiera completa, carro scorrevole e conservazione ottima. La finitura crema descrive l’aspetto del modello, senza identificarne il produttore. La scorrevolezza del carro non equivale a una verifica completa di allineamento, interlinea e trascinamento della carta, che non sono certificati nella scheda.'
  },
  {
    id: 13, code: 'ADT-013', name: 'Lampada da scrittoio in ottone', category: 'Illuminazione',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Vetro opalino'], condition: 'Buono', price: 320, available: true, images: [
      { src: '/vue/images/adt-013-1.jpg', thumbnail: '/vue/images/adt-013-1-thumb.jpg',
        alt: "Lampada da scrittoio in ottone con paralume in vetro verde",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Lampada da scrittoio in ottone con paralume in vetro verde. Axl0506 - CC BY-SA 3.0." }
    ],
    notes: 'La lampada da scrittoio degli anni Trenta concentrava la luce sul piano di lettura, accompagnando il lavoro negli studi professionali e negli ambienti domestici. Nella tipologia qui rappresentata la base zavorrata favorisce la stabilità e il paralume orientabile permette di dirigere l’illuminazione. Il catalogo simulato dichiara una costruzione in ottone e vetro opalino, con patina superficiale e piccoli segni sul vetro, entro uno stato generale buono. Il contrasto fra metallo e diffusore costituisce il principale motivo estetico, senza attribuzioni a manifatture o designer. L’impianto elettrico deve essere controllato prima dell’utilizzo: non sono dichiarati adeguamenti, isolamento verificato o sicurezza d’esercizio.'
  },
  {
    id: 16, code: 'ADT-016', name: 'Secretaire con ribalta e cassetti', category: 'Mobili',
    period: 'Secondo Ottocento, circa 1880', approximateYear: 1880,
    materials: ['Noce', 'Abete', 'Ottone'], condition: 'Buono', price: 1450, available: true, images: [
      { src: '/vue/images/adt-016-1.jpg', thumbnail: '/vue/images/adt-016-1-thumb.jpg',
        alt: "Secretaire storico con ribalta e cassetti",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Secretaire storico con ribalta e cassetti. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Il secretaire ottocentesco riuniva in un solo mobile un piano per la corrispondenza e vani destinati a carte, piccoli oggetti e documenti domestici. La ribalta consentiva di richiudere la superficie di lavoro, restituendo all’arredo un fronte ordinato. Il modello simulato, collocato intorno al 1880, è descritto con noce, abete e ferramenta in ottone, cassetti e scomparti interni. Sono dichiarate riprese della finitura e una serratura interna priva di chiave, pur con conservazione generale buona; non si attribuiscono tali riprese a restauri documentati. L’interesse della tipologia risiede nell’organizzazione dello spazio di scrittura e nell’accostamento fra superfici di rappresentanza e struttura di servizio.'
  },
  {
    id: 18, code: 'ADT-018', name: 'Comodino con piano in marmo', category: 'Mobili',
    period: 'Anni Venti, circa 1925', approximateYear: 1925,
    materials: ['Legno impiallacciato', 'Marmo', 'Ottone'], condition: 'Buono', price: 360, available: false, images: [
      { src: '/vue/images/adt-018-1.jpg', thumbnail: '/vue/images/adt-018-1-thumb.jpg',
        alt: "Comodino storico con piano in marmo",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Comodino storico con piano in marmo. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Nella camera domestica dei primi decenni del Novecento il comodino offriva un appoggio vicino al letto e uno spazio raccolto per gli oggetti personali. L’accostamento fra legno impiallacciato e marmo univa la presenza calda del mobile a una superficie più resistente al contatto con piccoli recipienti e all’umidità occasionale. Per l’articolo simulato, riferito a circa il 1925, sono dichiarati un’anta, un piccolo cassetto e componenti in ottone. Il marmo presenta macchie superficiali, l’impiallacciatura è ripresa su un fianco e la ferramenta è disomogenea. Queste condizioni rientrano nello stato buono indicato, senza attestare restauri o originalità di ogni elemento; non sono specificati cava, essenza o laboratorio.'
  },
  {
    id: 19, code: 'ADT-019', name: 'Bilancia da farmacia con vetrina', category: 'Strumenti scientifici',
    period: 'Primo Novecento, circa 1910', approximateYear: 1910,
    materials: ['Ottone', 'Legno', 'Vetro'], condition: 'Buono', price: 540, available: true, images: [
      { src: '/vue/images/adt-019-1.jpg', thumbnail: '/vue/images/adt-019-1-thumb.jpg',
        alt: "Bilancia a due piatti con vetrina protettiva",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Bilancia a due piatti con vetrina protettiva. Jeff Keyzer from Austin, TX, USA - CC BY-SA 2.0." }
    ],
    notes: 'Nelle farmacie del primo Novecento le pesate di precisione contribuivano alla preparazione di sostanze in quantità controllate. La bilancia a due piatti confrontava la massa del campione con quella dei pesi di riferimento; la vetrina limitava le correnti d’aria che potevano disturbare l’equilibrio. La scheda simulata descrive componenti in ottone entro una struttura in legno e vetro, con conservazione generale buona. La serie dei pesi è incompleta e la taratura non è verificata: non si dichiara una sensibilità strumentale né l’idoneità a impieghi farmaceutici attuali. L’interesse collezionistico riguarda la relazione fra meccanica, protezione ambientale e pratiche di misura, senza provenienza professionale certificata.'
  },
  {
    id: 20, code: 'ADT-020', name: 'Microscopio monoculare con specchio', category: 'Strumenti scientifici',
    period: 'Anni Trenta, circa 1930', approximateYear: 1930,
    materials: ['Ottone', 'Ghisa', 'Vetro ottico'], condition: 'Buono', price: 430, available: true, images: [
      { src: '/vue/images/adt-020-1.jpg', thumbnail: '/vue/images/adt-020-1-thumb.jpg',
        alt: "Microscopio monoculare storico con specchio",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Microscopio monoculare storico con specchio. Wellcome Collection / Wellcome Images - CC BY 4.0." }
    ],
    notes: 'Il microscopio monoculare con illuminazione a specchio appartiene a una lunga tradizione di osservazione didattica e di laboratorio, ancora diffusa negli anni Trenta. Lo specchio dirigeva la luce verso il preparato e la messa a fuoco meccanica regolava la distanza utile all’osservazione. Nell’articolo simulato sono dichiarati ottone, ghisa e vetro ottico, con usura della base e ottiche da pulire entro uno stato generale buono. La presenza dello specchio racconta un uso legato alla disponibilità e all’orientamento della sorgente luminosa. Non sono attestati ingrandimenti, qualità delle immagini o completezza degli accessori; il valore di consultazione è storico e collezionistico, senza prestazioni scientifiche garantite.'
  },
  {
    id: 21, code: 'ADT-021', name: 'Barometro aneroide da parete', category: 'Strumenti scientifici',
    period: 'Fine Ottocento, circa 1895', approximateYear: 1895,
    materials: ['Legno intagliato', 'Ottone', 'Vetro'], condition: 'Buono', price: 230, available: false, images: [
      { src: '/vue/images/adt-021-1.jpg', thumbnail: '/vue/images/adt-021-1-thumb.jpg',
        alt: "Barometro aneroide su supporto ligneo",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Barometro aneroide su supporto ligneo. Reconrabbit - CC0." }
    ],
    notes: 'Il barometro aneroide misura la pressione attraverso le piccole deformazioni di una capsula metallica chiusa, dalla quale è stata sottratta parte dell’aria; un sistema di leve trasmette il movimento all’indice. A fine Ottocento la tipologia trovava impiego nell’osservazione scientifica e nelle case, dove si seguivano le tendenze del tempo senza una colonna di mercurio. Il modello simulato presenta una cornice in legno intagliato, parti in ottone e vetro, con piccole perdite di finitura e stato generale buono. Indice e capsula non sono stati tarati: la lettura non è certificata e non basta, da sola, a formulare previsioni meteorologiche. La cornice conserva soprattutto una funzione di arredo e protezione.'
  },
  {
    id: 24, code: 'ADT-024', name: 'Cornice dorata con decoro a foglie', category: 'Oggetti decorativi',
    period: 'Fine Ottocento, circa 1885', approximateYear: 1885,
    materials: ['Legno', 'Gesso', 'Doratura'], condition: 'Da restaurare', price: 210, available: true, images: [
      { src: '/vue/images/adt-024-1.jpg', thumbnail: '/vue/images/adt-024-1-thumb.jpg',
        alt: "Cornice storica intagliata con motivi vegetali",
        caption: "Illustrazione di un esemplare analogo, non dell'articolo simulato. Cornice storica intagliata con motivi vegetali. The Metropolitan Museum of Art - CC0." }
    ],
    notes: 'Nell’arredo di fine Ottocento la cornice ornamentale raccordava il dipinto o lo specchio alla parete, contribuendo alla percezione dell’opera e all’unità della stanza. Foglie e motivi vegetali in rilievo potevano essere ottenuti mediante intaglio o decorazioni applicate; su preparazioni a gesso la doratura impiegava, secondo le lavorazioni, foglia metallica e differenti tecniche di adesione. Per l’articolo simulato sono dichiarati legno, gesso e doratura, senza identificarne la tecnica specifica. Le lacune agli angoli e le riprese della superficie dorata motivano lo stato da restaurare. La cornice è proposta senza opera e senza vetro; non sono attestati autore, bottega o interventi conservativi documentati.'
  }
];

export const createAntiqueItems = (): AntiqueItem[] => antiqueItems.map(item => ({
  ...item,
  materials: [...item.materials],
  images: item.images.map(image => ({ ...image }))
}));
