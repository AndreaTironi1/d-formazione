import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Release {
  version: string
  date: string
  label?: string
  changes: { title: string; description: string }[]
}

const releases: Release[] = [
  {
    version: '0.7.0',
    date: '2026-04-16',
    changes: [
      {
        title: 'Menù: "Corsi" rinominato in "Corsi / Edizioni"',
        description: 'La voce di navigazione "Corsi" è stata rinominata in "Corsi / Edizioni" per chiarire che include anche la gestione delle sessioni/edizioni dei corsi.',
      },
      {
        title: 'Menù: voce "Servizi" nascosta',
        description: 'La voce "Servizi" è stata rimossa dalla barra di navigazione laterale. La pagina rimane accessibile via URL (/servizi) e i dati restano invariati.',
      },
      {
        title: 'CoE: import Excel dedicato',
        description: 'Nella pagina CoE sono stati aggiunti due nuovi bottoni: "Scarica template" genera un file .xlsx con le colonne IdCoe e Nome pronto da compilare; "Carica CoE da Excel" permette di importare nuovi CoE dal file compilato senza sovrascrivere quelli esistenti e senza usare la sezione "Importa dati".',
      },
    ],
  },
  {
    version: '0.6.6',
    date: '2026-04-12',
    changes: [
      {
        title: 'Sessioni: filtri corso allineati a pagina Corsi (Titolo, Ambito, Destinatari)',
        description:
          'Il filtro "Tutti i corsi" è stato sostituito con tre filtri identici a quelli della pagina Corsi: testo libero su Titolo, select su Ambito e select su Destinatari. Le sessioni mostrate sono quelle dei corsi che soddisfano i criteri selezionati.',
      },
    ],
  },
  {
    version: '0.6.5',
    date: '2026-04-12',
    changes: [
      {
        title: 'Sessioni: colonna "Finestra date" sostituita con i giorni sessione',
        description:
          'La colonna "Finestra date" è stata rimossa. Al suo posto compare "Giorni sessione": mostra le date dei giorni di erogazione inseriti, oppure il badge "Giorni mancanti" se non ne è stato aggiunto nessuno.',
      },
    ],
  },
  {
    version: '0.6.4',
    date: '2026-04-12',
    changes: [
      {
        title: 'Sessioni: orari limitati tra le 08:00 e le 19:00',
        description:
          'Gli input degli orari nei giorni di erogazione accettano solo valori compresi tra le 08:00 e le 19:00, sia tramite attributi HTML (min/max) sia tramite validazione lato form.',
      },
    ],
  },
  {
    version: '0.6.3',
    date: '2026-04-11',
    changes: [
      {
        title: 'Sessioni: form unificato (info + giorni in un\'unica schermata)',
        description:
          'Il modal di inserimento/modifica sessione non usa più tab separati per "Info sessione" e "Giorni erogazione". I due blocchi sono ora mostrati in un\'unica form scorrevole, con una sezione separata da un divisore orizzontale.',
      },
    ],
  },
  {
    version: '0.6.2',
    date: '2026-04-11',
    changes: [
      {
        title: 'Fix ricerca Sessioni: ora trova anche per titolo corso, ID corso e docente',
        description:
          'La ricerca nella pagina Sessioni cercava solo nel campo Tema. Ora copre anche il titolo del corso, l\'ID corso e i nomi dei docenti (aula e onboarding).',
      },
    ],
  },
  {
    version: '0.6.1',
    date: '2026-04-11',
    changes: [
      {
        title: 'Corsi: Owner mostra il CoE di riferimento nel menù',
        description:
          'Nel menù a tendina Owner, ogni responsabile CoE è ora mostrato con il proprio CoE di appartenenza (es. "Mario Rossi — CoE P&C") per facilitare la selezione.',
      },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-04-11',
    changes: [
      {
        title: 'Corsi: Owner scelto tra i Responsabili CoE',
        description:
          'Nel form del corso (tab Scheda), il campo Owner è ora un menù a tendina che mostra solo i dipendenti con ruolo "Responsabile CoE", eliminando la possibilità di inserire valori liberi.',
      },
      {
        title: 'Corsi: assegnazione automatica Owner dai corsi esistenti',
        description:
          'Il pulsante "Assegna owner (N)" compare in pagina quando ci sono corsi senza owner. Cliccandolo, ogni corso riceve come owner il responsabile del CoE associato; se il CoE manca o non ha responsabile, viene assegnata Donatella Passerini.',
      },
    ],
  },
  {
    version: '0.5.9',
    date: '2026-04-11',
    changes: [
      {
        title: 'Corsi: filtri su unica riga, Priorità come menù a tendina',
        description:
          'I cinque filtri della pagina Corsi (Titolo, Ambito, Destinatari, Anno, Priorità) sono ora allineati su un\'unica riga. Il filtro Priorità è diventato un menù a tendina coerente con gli altri.',
      },
    ],
  },
  {
    version: '0.5.8',
    date: '2026-04-11',
    changes: [
      {
        title: 'Corsi: filtri specifici per Titolo, Ambito e Destinatari',
        description:
          'Nella pagina Corsi sono stati aggiunti tre filtri dedicati: un campo testo per filtrare per titolo (ricerca parziale), un menù a tendina per l\'ambito (valori dalla tabella Ambiti) e uno per i destinatari (valori presenti nei corsi). I filtri si combinano tra loro e con i filtri Anno e Priorità già esistenti. Il contatore in alto mostra quanti corsi sono visibili rispetto al totale. Il bottone "Azzera filtri" compare solo quando almeno un filtro è attivo.',
      },
    ],
  },
  {
    version: '0.5.7',
    date: '2026-04-11',
    changes: [
      {
        title: 'Fix esportazione Excel: colonna Ambito ora mostra il valore corretto',
        description:
          'Il foglio Corsi del file Excel esportato mostrava la colonna Ambito vuota dopo la migrazione al nuovo sistema. Ora viene letta correttamente dalla tabella Ambiti.',
      },
      {
        title: 'Dashboard: aggiunta statistica Ambiti',
        description: 'Il riquadro delle statistiche in home page mostra ora anche il numero di ambiti presenti nel sistema.',
      },
    ],
  },
  {
    version: '0.5.6',
    date: '2026-04-11',
    changes: [
      {
        title: 'Tabella Ambiti — gestione CRUD',
        description:
          'Aggiunta nuova sezione "Ambiti" nella sidebar (sezione Dati) con tabella CRUD completa: creazione, modifica ed eliminazione degli ambiti formativi con nome e descrizione opzionale.',
      },
      {
        title: 'Migrazione ambito testuale → relazione strutturata',
        description:
          'Il campo "Ambito" dei corsi è ora una relazione alla tabella Ambiti invece di un testo libero. Nella pagina Ambiti è disponibile il pulsante "Migra da corsi esistenti" che legge i valori unici già presenti nel database e li struttura automaticamente.',
      },
      {
        title: 'Dropdown Ambito nel form Corsi',
        description:
          'Il campo Ambito nel form di creazione/modifica di un corso è ora un menù a tendina popolato dalla tabella Ambiti, garantendo coerenza dei dati.',
      },
      {
        title: 'Import Excel: ambiti estratti automaticamente',
        description:
          'Durante l\'importazione da file Excel, i valori unici della colonna Ambito vengono estratti automaticamente e inseriti nella tabella Ambiti. Il conteggio ambiti è visibile nel riepilogo di anteprima.',
      },
    ],
  },
  {
    version: '0.5.5',
    date: '2026-03-29',
    changes: [
      {
        title: 'Report Dipendenti: timeline mostra i giorni reali, non il range completo',
        description:
          'La barra Gantt ora mostra un segno verticale per ogni singolo giorno di erogazione inserito nella sessione, invece di colorare l\'intero intervallo tra data inizio e fine. Se la sessione non ha giorni espliciti ma solo una finestra di date, viene mostrata la barra continua come prima.',
      },
      {
        title: 'Dashboard: aggiunta statistica Sessioni',
        description:
          'Il riquadro delle statistiche in home page mostra ora anche il numero di sessioni presenti nel sistema, tra "Corsi" e "Iscrizioni".',
      },
      {
        title: 'Report Mensile: colori celle basati sugli orari reali',
        description:
          'Nelle celle della griglia mensile, una fascia (mattina o pomeriggio) viene colorata solo se ha orari valorizzati in quella giornata. Se un giorno è presente nella sessione ma non ha orari mattina, la metà superiore della cella rimane vuota; stessa cosa per il pomeriggio.',
      },
      {
        title: 'Report Mensile: dettaglio sessioni accorpato e colonne uniformi',
        description:
          'Nel riquadro "Dettaglio sessioni" in fondo al report mensile, le righe della stessa sessione sono ora accorpate in un\'unica riga. I giorni del mese con i relativi orari (mattina M e pomeriggio P) sono elencati nella colonna "Giorni & Orari". Le larghezze delle colonne sono ora fisse e uniformi per tutti i dipendenti.',
      },
    ],
  },
  {
    version: '0.5.4',
    date: '2026-03-29',
    changes: [
      {
        title: 'Report Mensile: celle divise in mattina e pomeriggio',
        description:
          'Ogni cella della griglia è ora divisa in due metà: la metà superiore rappresenta la mattina e quella inferiore il pomeriggio. Se una sessione ha giorni con orari espliciti, viene colorata solo la metà pertinente (solo mattina, solo pomeriggio o entrambe). Se la sessione ha solo una finestra di date generica, entrambe le metà vengono colorate.',
      },
      {
        title: 'Report Mensile: dettaglio sessioni come tabella strutturata',
        description:
          'Il riquadro "Dettaglio sessioni" in fondo al report mensile è stato trasformato in una vera tabella per ogni dipendente. Le colonne mostrano: Corso, Sessione, Livello di priorità (P1–P5), Destinatari, Fascia (Mattina/Pomeriggio), Modalità (TOJ/Aula), Data e Orari di inizio e fine. Le righe sono ordinate per data e poi per fascia.',
      },
      {
        title: 'Report Dipendenti: barra Gantt derivata dai giorni effettivi',
        description:
          'Se una sessione non ha una finestra di date (dataInizio/dataFine), la barra Gantt viene ora calcolata automaticamente dal primo e dall\'ultimo giorno di erogazione effettivamente inseriti, così le sessioni con soli giorni puntuali appaiono correttamente nella timeline.',
      },
    ],
  },
  {
    version: '0.5.3',
    date: '2026-03-29',
    changes: [
      {
        title: 'Corsi: campo Anno per associare il corso a un anno specifico',
        description:
          'Ogni corso può ora avere un anno di riferimento (es. 2026, 2027…). Il campo è visibile nella lista corsi come colonna e può essere usato come filtro per visualizzare solo i corsi di un determinato anno.',
      },
      {
        title: 'Report Dipendenti: timeline e intestazioni aggiornate per le sessioni',
        description:
          'La colonna "Corso" nella scheda del dipendente è diventata "Sessione" e mostra il tema della sessione come titolo principale con il titolo del corso come sottotitolo. Le sessioni sono ordinate per data. La barra Gantt usa i colori della priorità del corso associato alla sessione. La pagina mostra ora "Sessioni iscritte" al posto di "Corsi iscritti".',
      },
      {
        title: 'Report Mensile: celle e dettaglio aggiornati per le sessioni',
        description:
          'Le celle della griglia ora mostrano il tema della sessione (di default le etichette sono nascoste — si attivano con "Mostra tema sessione nelle celle"). Il dettaglio in fondo alla pagina elenca le sessioni del mese per ogni dipendente, con tema, titolo del corso e giorni effettivi di svolgimento. Il modale di dettaglio si chiama ora "Dettagli sessione".',
      },
    ],
  },
  {
    version: '0.5.2',
    date: '2026-03-29',
    changes: [
      {
        title: 'Fix: "Crea" sessione non funzionava dalla tab Giorni erogazione',
        description:
          'Se si compilavano prima i giorni di erogazione e poi si cliccava "Crea" senza essere tornati sulla tab "Info sessione", il salvataggio veniva bloccato silenziosamente senza alcun messaggio. Ora l\'applicazione torna automaticamente alla tab "Info sessione" per far completare i campi obbligatori (Corso e Tema).',
      },
    ],
  },
  {
    version: '0.5.1',
    date: '2026-03-29',
    changes: [
      {
        title: 'Giorni di erogazione: modalità separata per mattina e pomeriggio',
        description:
          'Per ogni giorno di erogazione è ora possibile scegliere separatamente se la mattina si svolge in Aula o in TOJ e se il pomeriggio si svolge in Aula o in TOJ. In precedenza era prevista un\'unica modalità per l\'intera giornata.',
      },
      {
        title: 'Validazione automatica degli orari',
        description:
          'Il sistema verifica che gli orari inseriti per ogni giorno siano coerenti: fine mattina dopo inizio mattina, inizio pomeriggio dopo fine mattina, fine pomeriggio dopo inizio pomeriggio. Se si inserisce un orario non valido compare subito un messaggio di errore sotto la riga, e il salvataggio viene bloccato finché non si corregge.',
      },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-03-29',
    label: 'Sessioni di formazione',
    changes: [
      {
        title: 'Sessioni: livello intermedio tra corsi e iscrizioni',
        description:
          'Ogni corso può ora avere più sessioni (es. "Prompting avanzato" come sessione del corso "AI"). Ogni sessione ha un proprio tema, una finestra di date (inizio e fine), docenti e note. I dipendenti si iscrivono alla singola sessione, non più al corso generico.',
      },
      {
        title: 'Giorni di erogazione con orari mattina e pomeriggio',
        description:
          'Per ogni sessione è possibile aggiungere i giorni esatti di svolgimento, indicando la modalità (Aula o TOJ) e gli orari separati per mattina e pomeriggio. Un controllo automatico segnala subito se un giorno inserito cade fuori dalla finestra della sessione.',
      },
      {
        title: 'Iscrizioni: si seleziona direttamente la sessione',
        description:
          'Il modulo per creare una nuova iscrizione mostra ora direttamente l\'elenco delle sessioni disponibili (con tema e titolo del corso), eliminando il passaggio intermedio di scelta del corso.',
      },
      {
        title: 'Report Dipendenti: date e orari reali nel piano formativo',
        description:
          'Nella scheda di ogni dipendente, la colonna "Date" mostra ora i giorni effettivi di erogazione con la modalità (Aula/TOJ) e gli orari mattina/pomeriggio. Se i giorni non sono ancora definiti, viene mostrata la finestra di date della sessione.',
      },
      {
        title: 'Report Mensile: aggiornato per le sessioni',
        description:
          'La griglia mensile ora si basa sulle sessioni e sui loro giorni di erogazione: un dipendente appare nel mese solo se ha effettivamente una sessione in quel periodo.',
      },
      {
        title: 'Cancella dati: reset completo con doppia conferma',
        description:
          'Nella sezione Utilità è disponibile la nuova pagina "Cancella dati". Per evitare cancellazioni accidentali, l\'operazione richiede di confermare l\'intenzione digitando una frase specifica. Al termine viene mostrato il riepilogo di quanti record sono stati eliminati per ogni tabella.',
      },
    ],
  },
  {
    version: '0.4.5',
    date: '2026-03-21',
    changes: [
      {
        title: 'Iscrizioni: destinatari visibili accanto al titolo del corso',
        description:
          'Nella lista iscrizioni, accanto al nome del corso compare ora un\'etichetta colorata con i destinatari (ad esempio "J/M" o "Senior"), così si capisce subito a chi è rivolto il corso senza dover aprire la scheda.',
      },
      {
        title: 'Nuova iscrizione: destinatari nel menu di selezione corso',
        description:
          'Nel modulo per creare una nuova iscrizione, ogni corso nel menu a tendina mostra in coda i destinatari (es. "— J/M"), rendendo più facile scegliere il corso giusto.',
      },
      {
        title: 'Riepilogo iscrizioni: destinatari nel messaggio di conferma',
        description:
          'Dopo il salvataggio di un\'iscrizione, il riepilogo a video mostra l\'etichetta con i destinatari accanto al nome del corso, in modo da confermare che si è selezionato il corso corretto.',
      },
      {
        title: 'Report Dipendenti: destinatari e layout a due righe nel Gantt',
        description:
          'Nella timeline del Report Dipendenti, ogni corso mostra ora in una riga il titolo, i destinatari, la priorità, le ore e le date. La barra colorata del Gantt si trova nella riga sotto, occupando tutta la larghezza disponibile per una lettura più chiara del calendario.',
      },
    ],
  },
  {
    version: '0.4.4',
    date: '2026-03-21',
    changes: [
      {
        title: 'Report Dipendenti: date di inizio e fine corso',
        description:
          'Nella riga di ogni corso del Report Dipendenti, accanto alle ore compare ora anche il periodo del corso nel formato "gg/mm → gg/mm", così si vede subito quando si svolge.',
      },
      {
        title: 'Report Dipendenti: esporta scheda in PDF',
        description:
          'Ogni scheda dipendente ha ora un pulsante "Scarica PDF" che genera un file PDF con tutte le informazioni della scheda, inclusa la timeline Gantt. In fondo al PDF compare la data e ora di esportazione.',
      },
      {
        title: 'Report Mensile: esporta la tabella in PDF',
        description:
          'In cima al Report Mensile compare il pulsante "Scarica PDF". Il PDF generato riporta in testa mese, anno, CoE e Sede selezionati, quindi la tabella completa con dipendenti e giorni, e in fondo la data e ora di esportazione.',
      },
    ],
  },
  {
    version: '0.4.3',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Dipendenti: totale corsi e ore per ogni persona',
        description:
          'Nella scheda di ogni dipendente nel Report Dipendenti compaiono ora due contatori: il numero totale di corsi a cui è iscritto e il totale delle ore di formazione previste. I valori tengono conto di tutti i corsi indipendentemente dall\'anno visualizzato nel Gantt.',
      },
    ],
  },
  {
    version: '0.4.2',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Mensile: visibili solo i dipendenti con corsi nel mese',
        description:
          'Nel Report Mensile, la griglia ora mostra solo i dipendenti che hanno almeno un corso attivo nel mese e nell\'anno selezionati. In precedenza comparivano tutti i dipendenti, rendendo la lista difficile da leggere. Chi non ha corsi in quel periodo semplicemente non appare.',
      },
    ],
  },
  {
    version: '0.4.1',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Mensile',
        description:
          'Nuova pagina di report raggiungibile dal menu sotto "Report Dipendenti". Mostra una griglia con i dipendenti sulle righe e i giorni del mese sulle colonne: ogni cella colorata indica un corso attivo in quel giorno per quel dipendente. Il colore segue la priorità del corso. Cliccando su una cella si aprono i dettagli completi del corso. In alto si può scegliere mese e anno (di default il mese corrente), e filtrare per CoE e/o Sede per ridurre i dipendenti visualizzati.',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-03-20',
    changes: [
      {
        title: 'Iscrizione di più persone a un corso in un solo passaggio',
        description:
          'Nella pagina Iscrizioni, il modulo "Nuova Iscrizione" ora permette di selezionare un corso e poi spuntare più dipendenti dalla lista. Con un solo clic vengono create tutte le iscrizioni. Se qualcuno era già iscritto al corso, viene ignorato automaticamente senza errori, e a fine operazione compare un riepilogo di quante iscrizioni sono state create e quante erano già presenti.',
      },
    ],
  },
  {
    version: '0.3.9',
    date: '2026-03-18',
    changes: [
      {
        title: 'Menu rinominati: Anagrafiche → Dati, Dati → Utilità',
        description:
          'Le sezioni del menu laterale sono state rinominate per riflettere meglio il loro contenuto: la sezione con CoE, Sedi, Dipendenti ecc. si chiama ora "Dati", mentre la sezione con Importa ed Esporta si chiama "Utilità".',
      },
    ],
  },
  {
    version: '0.3.8',
    date: '2026-03-18',
    changes: [
      {
        title: 'Pagina Changelog',
        description:
          'Cliccando sul numero di versione in fondo al menu laterale si accede a questa pagina, che racconta tutte le novità dell\'applicazione in linguaggio semplice.',
      },
    ],
  },
  {
    version: '0.3.7',
    date: '2026-03-18',
    changes: [
      {
        title: 'Statistiche dashboard su riga unica',
        description:
          'I 6 contatori (CoE, Sedi, Dipendenti, Servizi, Corsi, Iscrizioni) sono ora affiancati su una sola riga per una lettura immediata.',
      },
    ],
  },
  {
    version: '0.3.6',
    date: '2026-03-18',
    changes: [
      {
        title: 'Anno selezionabile dal 2026 al 2030 nel Report Dipendenti',
        description:
          'Il selettore anno nel Report Dipendenti copre ora il periodo 2026–2030, in linea con l\'orizzonte del piano formativo.',
      },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-03-18',
    changes: [
      {
        title: 'Contatore Servizi nell\'esportazione',
        description:
          'Il riepilogo nella pagina Esporta dati mostrava correttamente tutti i fogli tranne Servizi. Il contatore è stato aggiunto.',
      },
    ],
  },
  {
    version: '0.3.4',
    date: '2026-03-18',
    label: 'Rilascio principale',
    changes: [
      {
        title: 'Menu laterale organizzato in sezioni',
        description:
          'La barra di navigazione è ora divisa in tre sezioni collassabili: Report (Dashboard e Report Dipendenti), Anagrafiche (CoE, Sedi, Dipendenti, Servizi, Corsi, Iscrizioni) e Dati (Importa ed Esporta).',
      },
      {
        title: 'Dashboard — Responsabili CoE e Sede',
        description:
          'Due nuovi riquadri mostrano in un colpo d\'occhio chi è il responsabile di ogni CoE e di ogni Sede.',
      },
      {
        title: 'Pagina Esporta dati',
        description:
          'Con un singolo clic è ora possibile scaricare un file Excel con tutti i dati del piano formativo: un foglio per CoE, Sedi, Dipendenti, Servizi, Corsi e Iscrizioni.',
      },
      {
        title: 'Report Dipendenti',
        description:
          'Nuova pagina che mostra, per ogni dipendente, i corsi a cui è iscritto con un diagramma di Gantt per anno. È possibile filtrare per nome e selezionare l\'anno di riferimento.',
      },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-03-18',
    changes: [
      {
        title: 'Niente doppioni nella selezione CoE e Sede',
        description:
          'Nell\'editor del dipendente non è più possibile selezionare lo stesso CoE o la stessa Sede due volte: le opzioni già scelte vengono escluse automaticamente.',
      },
    ],
  },
  {
    version: '0.3.2',
    date: '2026-03-18',
    changes: [
      {
        title: 'Editor multi-CoE e multi-Sede per i dipendenti',
        description:
          'La scheda dipendente ha ora una scheda "CoE & Sedi" che permette di assegnare più CoE e più Sedi con le relative percentuali di appartenenza.',
      },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-03-18',
    changes: [
      {
        title: 'Supporto dipendenti su più sedi',
        description:
          'Introdotta la gestione dei dipendenti assegnati a più sedi geografiche con ripartizione percentuale (es. 50% Liguria, 50% Lombardia).',
      },
      {
        title: 'Versione visibile nella barra laterale',
        description:
          'Il numero di versione dell\'applicazione è ora visibile in fondo al menu, sopra il pulsante account.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-03-18',
    changes: [
      {
        title: 'Scheda corso estesa',
        description:
          'Aggiunti 13 nuovi campi opzionali a ogni corso: owner, tutor, tipo di docenza, docenti (aula e onboarding), durata in ore, date di inizio e fine, modalità di erogazione, ore di onboarding, competenze e output tipici.',
      },
    ],
  },
]

export default function Changelog() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Changelog</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tutte le novità e le correzioni dell'applicazione Piano Formazione Dasein.
        </p>
      </div>

      {/* Releases */}
      <div className="space-y-6">
        {releases.map((r) => (
          <div key={r.version} className="card p-6 space-y-4">
            {/* Release header */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                v{r.version}
              </span>
              <span className="text-sm text-slate-400">{r.date}</span>
              {r.label && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {r.label}
                </span>
              )}
            </div>

            {/* Changes */}
            <ul className="space-y-3">
              {r.changes.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
