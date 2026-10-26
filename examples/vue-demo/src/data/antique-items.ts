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
    id: 25, code: 'ADT-025', name: 'Telefono nero in bachelite a disco', category: 'Telefonia',
    period: 'Successivo al 1931; modello del 1931', approximateYear: 1931,
    materials: ['Bachelite', 'Metallo', 'Carbone'], condition: 'Buono', price: 185, available: true, images: [
      { src: '/vue/images/adt-025-1.jpg', thumbnail: '/vue/images/adt-025-1-thumb.jpg',
        alt: 'Telefono nero in bachelite con cornetta e disco, vista anteriore',
        caption: 'F.A.T.M.E.–Ericsson, modello 1931, esemplare IGB-10728: vista anteriore. Fotografia illustrativa, non dell’articolo simulato. Rodolfo Colombo / Museo Scienza Milano — CC BY-SA 4.0.' },
      { src: '/vue/images/adt-025-2.jpg', thumbnail: '/vue/images/adt-025-2-thumb.jpg',
        alt: 'Profilo laterale del telefono nero con cornetta appoggiata',
        caption: 'IGB-10728, profilo laterale dello stesso telefono museale. Fotografia illustrativa, non dell’articolo simulato. Rodolfo Colombo / Museo Scienza Milano — CC BY-SA 4.0.' },
      { src: '/vue/images/adt-025-3.jpg', thumbnail: '/vue/images/adt-025-3-thumb.jpg',
        alt: 'Fondo del telefono con aperture della suoneria e marcature',
        caption: 'IGB-10728, fondo e marcature dello stesso esemplare. Fotografia illustrativa, non dell’articolo simulato. Rodolfo Colombo / Museo Scienza Milano — CC BY-SA 4.0.' }
    ],
    notes: 'Negli anni Trenta il telefono a disco rese familiare la selezione automatica degli abbonati, mentre la bachelite permetteva di riunire suoneria e combinatore in una scocca compatta. Il modello illustrato è il F.A.T.M.E.–Ericsson del 1931: il museo data il proprio esemplare a un momento successivo, senza precisarne l’anno di produzione. La cornetta riunisce microfono a carbone e ricevitore; il ritorno del disco invia gli impulsi di selezione alla centrale. Nel catalogo commerciale simulato lo stato buono e il prezzo sono dati dimostrativi, non attestazioni relative al pezzo museale. La forma unitaria racconta il passaggio a un apparecchio da scrivania di uso quotidiano; collegamento e funzionamento non sono verificati.'
  },
  {
    id: 26, code: 'ADT-026', name: 'Radio a valvole da tavolo in legno', category: 'Radio',
    period: '1940–1941', approximateYear: 1940,
    materials: ['Legno impiallacciato', 'Metallo', 'Vetro', 'Bachelite'], condition: 'Buono', price: 420, available: true, images: [
      { src: '/vue/images/adt-026-1.jpg', thumbnail: '/vue/images/adt-026-1-thumb.jpg',
        alt: 'Radio DRECO in legno, frontale con scala di sintonia e tre manopole',
        caption: 'DRECO 513, 1940–1941, inventario 2017.121.1: frontale. Fotografia illustrativa, non dell’articolo simulato. Auckland Museum Tāmaki Paenga Hira — CC BY 4.0.' },
      { src: '/vue/images/adt-026-2.jpg', thumbnail: '/vue/images/adt-026-2-thumb.jpg',
        alt: 'Retro aperto della radio con valvole, telaio e targhetta',
        caption: '2017.121.1, retro con valvole dello stesso esemplare. Fotografia illustrativa, non dell’articolo simulato. Auckland Museum Tāmaki Paenga Hira — CC BY 4.0.' },
      { src: '/vue/images/adt-026-3.jpg', thumbnail: '/vue/images/adt-026-3-thumb.jpg',
        alt: 'Targhetta della radio con modello 513 e numero di serie 227',
        caption: '2017.121.1, targhetta modello 513 e seriale 227. Fotografia illustrativa, non dell’articolo simulato. Auckland Museum Tāmaki Paenga Hira — CC BY 4.0.' }
    ],
    notes: 'La radio da tavolo portò notiziari, musica e programmi parlati negli ambienti domestici, diventando un punto di ascolto condiviso. Il modello illustrato, DRECO 513 del 1940–1941, associa un mobile impiallacciato a una scala analogica di sintonia e tre manopole; i circuiti a valvole ricevono e amplificano il segnale destinato all’altoparlante. L’esemplare fotografato fu realizzato per il National Patriotic Fund Board neozelandese e reca una targhetta identificativa. Questa informazione documenta soltanto la fonte museale, non la provenienza dell’articolo simulato. Per il record dimostrativo si indica uno stato buono, senza certificare ricezione, sicurezza elettrica o revisione: l’interesse è nella relazione fra tecnica radiofonica e arredo.'
  },
  {
    id: 27, code: 'ADT-027', name: 'Registratore di cassa meccanico', category: 'Strumenti commerciali',
    period: '1912', approximateYear: 1912,
    materials: ['Metallo nichelato', 'Legno', 'Vetro', 'Celluloide'], condition: 'Buono', price: 720, available: false, images: [
      { src: '/vue/images/adt-027-1.jpg', thumbnail: '/vue/images/adt-027-1-thumb.jpg',
        alt: 'National 542, tre quarti anteriore con tastiera, indicatori e manovella',
        caption: 'National 542, 1912, inventario IGB-6854: tre quarti anteriore. Fotografia illustrativa, non dell’articolo simulato. Moira Ricci / Museo Scienza Milano — CC BY-SA 4.0.' },
      { src: '/vue/images/adt-027-2.jpg', thumbnail: '/vue/images/adt-027-2-thumb.jpg',
        alt: 'Retro del National 542 con decorazioni floreali e indicatori rivolti al cliente',
        caption: 'IGB-6854, vista posteriore dello stesso registratore. Fotografia illustrativa, non dell’articolo simulato. Moira Ricci / Museo Scienza Milano — CC BY-SA 4.0.' }
    ],
    notes: 'All’inizio del Novecento il registratore di cassa rese più controllabile la gestione degli incassi, collegando l’impostazione dell’importo alla registrazione della vendita. Nel National 542 del 1912 la tastiera meccanica seleziona i valori, gli indicatori li rendono visibili e la manovella aziona il ciclo di registrazione; il basamento ospita il cassetto del denaro. Metallo nichelato decorato, legno, vetro e coperture dei tasti in celluloide uniscono robustezza e rappresentanza commerciale. Le fotografie appartengono al solo esemplare museale identificato nella fonte. Lo stato buono del record è simulato e non garantisce integrità dei vetri, efficienza della stampa o precisione dei conteggi; la disponibilità è puramente dimostrativa.'
  },
  {
    id: 28, code: 'ADT-028', name: 'Registratore a bobine portatile', category: 'Audio',
    period: '1961–1965', approximateYear: 1963,
    materials: ['Plastica', 'Metallo'], condition: 'Buono', price: 190, available: true, images: [
      { src: '/vue/images/adt-028-1.jpg', thumbnail: '/vue/images/adt-028-1-thumb.jpg',
        alt: 'Geloso G.257, vista anteriore con altoparlante e bobine sotto il coperchio trasparente',
        caption: 'Geloso G.257, 1961–1965, inventario IGB-9270: tre quarti anteriore. Fotografia illustrativa, non dell’articolo simulato. Rodolfo Colombo / Museo Scienza Milano — CC BY-SA 4.0.' },
      { src: '/vue/images/adt-028-2.jpg', thumbnail: '/vue/images/adt-028-2-thumb.jpg',
        alt: 'Geloso G.257, vista posteriore con alimentazione, fusibile e comandi colorati',
        caption: 'IGB-9270, tre quarti posteriore dello stesso registratore. Fotografia illustrativa, non dell’articolo simulato. Rodolfo Colombo / Museo Scienza Milano — CC BY-SA 4.0.' }
    ],
    notes: 'Negli anni Sessanta il registratore portatile rese accessibile la conservazione di voci, conversazioni e musica anche fuori dagli studi professionali. Il Geloso G.257, documentato fra il 1961 e il 1965, impiega un nastro magnetico trasferito fra due bobine e un’amplificazione a valvole; i comandi colorati selezionano registrazione, ascolto e scorrimento. Il telaio in plastica e metallo raccoglie altoparlante e meccanica in dimensioni contenute, con bobine protette da un coperchio trasparente. La fonte fotografica riguarda un preciso esemplare museale e non attesta la proprietà del record commerciale simulato. Qui lo stato buono è indicativo: trascinamento, testine e alimentazione non sono collaudati, né si promette una revisione già eseguita.'
  }
];

export const createAntiqueItems = (): AntiqueItem[] => antiqueItems.map(item => ({
  ...item,
  materials: [...item.materials],
  images: item.images.map(image => ({ ...image }))
}));
