import { useState, useEffect } from 'react'
import { X, Save, Printer, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Shield, Calendar } from 'lucide-react'
import {
  getVerzija,
  getSveVerzije,
  getAktivnaVerzija,
  getInitialAnalizaRizika,
  AKTIVNA_VERZIJA,
  VRSTA_POSLA_OPCIJE,
  VRSTA_STRANKE_OPCIJE,
  KATEGORIJA_RIZIKA_OPCIJE,
  RADNJE_MERE_OPCIJE,
  UCESTALOST_PRACENJA_OPCIJE
} from '../constants/indikatori-rizika'

// Re-exportujemo za korišćenje u drugim komponentama
export { getInitialAnalizaRizika } from '../constants/indikatori-rizika'

export default function RizikAnalizaModal({ vlasnik, vlasnikIndex, onSave, onClose }) {
  // Odredi početnu verziju - ako postoji sačuvana analiza, koristi tu verziju, inače aktivnu
  const pocetnaVerzija = vlasnik.analiza_rizika?.verzija || AKTIVNA_VERZIJA
  
  const [selectedVerzija, setSelectedVerzija] = useState(pocetnaVerzija)
  const [verzija, setVerzija] = useState(() => getVerzija(pocetnaVerzija))
  const [sveVerzije] = useState(() => getSveVerzije())
  
  const [analizaRizika, setAnalizaRizika] = useState(() => {
    if (vlasnik.analiza_rizika) {
      return { ...vlasnik.analiza_rizika, verzija: pocetnaVerzija }
    }
    return getInitialAnalizaRizika(pocetnaVerzija)
  })
  
  const [openSections, setOpenSections] = useState({
    geografski: true,
    stranke: false,
    transakcije: false,
    usluge: false,
    ocena: true
  })

  // Kada se promeni verzija, resetuj indikatore ali zadrži ostale podatke
  const handleVerzijaChange = (novaVerzija) => {
    setSelectedVerzija(novaVerzija)
    const novaVerzijaData = getVerzija(novaVerzija)
    setVerzija(novaVerzijaData)
    
    // Resetuj indikatore za novu verziju, ali zadrži opšte podatke
    setAnalizaRizika(prev => ({
      ...getInitialAnalizaRizika(novaVerzija),
      datum_analize: prev.datum_analize,
      vrsilac_analize: prev.vrsilac_analize,
      vrsta_posla: prev.vrsta_posla,
      vrsta_stranke: prev.vrsta_stranke,
      ukupna_ocena: prev.ukupna_ocena
    }))
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleIndikatorChange = (kategorija, id, value) => {
    setAnalizaRizika(prev => ({
      ...prev,
      [kategorija]: {
        ...prev[kategorija],
        [id]: value
      }
    }))
  }

  const handleOcenaChange = (field, value) => {
    setAnalizaRizika(prev => ({
      ...prev,
      ukupna_ocena: {
        ...prev.ukupna_ocena,
        [field]: value
      }
    }))
  }

  const handleFieldChange = (field, value) => {
    setAnalizaRizika(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onSave(vlasnikIndex, analizaRizika)
    onClose()
  }

  // Helper za dobijanje vrednosti polja (podržava oba formata - vlasnik i nalogodavac)
  const getField = (field) => {
    const fieldMap = {
      jmbg: vlasnik.jmbg || vlasnik.matbrojjmbg || '',
      tel: vlasnik.tel || vlasnik.brojtel || '',
      lk: vlasnik.lk || '',
      pib: vlasnik.pib || '',
      ime: vlasnik.ime || '',
      prezime: vlasnik.prezime || '',
      adresa: vlasnik.adresa || ''
    }
    return fieldMap[field] || vlasnik[field] || ''
  }

  // Broji označene indikatore
  const countMarked = (kategorija) => {
    const data = analizaRizika[kategorija]
    if (!data) return 0
    return Object.values(data).filter(v => v === true).length
  }

  // Štampa obrazac
  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    
    const generateIndikatorRows = (indikatori, kategorija) => {
      return indikatori.map((ind, idx) => {
        const isMarked = analizaRizika[kategorija]?.[ind.id] === true
        return `
          <tr>
            <td class="col-rbr">${idx + 1}.</td>
            <td class="col-tekst">${ind.tekst}</td>
            <td class="col-da">${isMarked ? 'X' : ''}</td>
            <td class="col-ne">${!isMarked ? 'X' : ''}</td>
          </tr>
        `
      }).join('')
    }

    const getOcenaLabel = (value) => {
      return KATEGORIJA_RIZIKA_OPCIJE.find(o => o.value === value)?.label || '-'
    }

    const getMereLabel = (value) => {
      return RADNJE_MERE_OPCIJE.find(o => o.value === value)?.label || '-'
    }

    const getPracenjeLabel = (value) => {
      return UCESTALOST_PRACENJA_OPCIJE.find(o => o.value === value)?.label || '-'
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analiza rizika stranke - ${getField('ime')} ${getField('prezime')}</title>
        <style>
          @page { size: portrait; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 9px; line-height: 1.3; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header h1 { font-size: 14px; margin: 0 0 5px 0; }
          .header h2 { font-size: 11px; margin: 0; font-weight: normal; }
          .verzija-info { font-size: 8px; color: #666; margin-top: 5px; }
          
          .info-section { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .info-box { border: 1px solid #000; padding: 8px; width: 48%; }
          .info-box h3 { font-size: 10px; margin: 0 0 5px 0; border-bottom: 1px solid #000; padding-bottom: 3px; }
          .info-row { display: flex; margin-bottom: 3px; }
          .info-label { font-weight: bold; width: 120px; }
          
          .checkbox-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px; }
          .checkbox-item { display: flex; align-items: center; gap: 3px; }
          .checkbox-box { width: 12px; height: 12px; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
          
          .section-title { background: #f0f0f0; padding: 5px 8px; font-weight: bold; font-size: 10px; margin: 10px 0 5px 0; border: 1px solid #000; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: top; }
          th { background-color: #f0f0f0; font-size: 8px; text-align: center; }
          .col-rbr { width: 25px; text-align: center; }
          .col-tekst { }
          .col-da { width: 30px; text-align: center; }
          .col-ne { width: 30px; text-align: center; }
          
          .summary-table { margin-top: 15px; }
          .summary-table th, .summary-table td { text-align: center; padding: 6px; }
          
          .signature { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; }
          .signature-line { width: 150px; border-top: 1px solid #000; margin-top: 40px; padding-top: 5px; }
          
          @media print {
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ANALIZA (PROCENA) RIZIKA STRANKE (POSLOVNOG ODNOSA)</h1>
          <h2>OD PN/FT/FŠOMU</h2>
          <p style="font-size: 8px;">(prema članu 6. stav 3. tačka 2. Zakona o SPN/FT)</p>
          <p class="verzija-info">Verzija liste indikatora: ${verzija.naziv} (${selectedVerzija})</p>
        </div>
        
        <div class="info-section">
          <div class="info-box">
            <h3>NAZIV STRANKE</h3>
            <div class="info-row"><span class="info-label">Ime i prezime:</span> ${getField('ime')} ${getField('prezime')}</div>
            <div class="info-row"><span class="info-label">JMBG:</span> ${getField('jmbg') || '-'}</div>
            <div class="info-row"><span class="info-label">Br. LK ili pasoša:</span> ${getField('lk') || '-'}</div>
            <div class="info-row"><span class="info-label">PIB/MB:</span> ${getField('pib') || '-'}</div>
            <div class="info-row"><span class="info-label">Adresa:</span> ${getField('adresa') || '-'}</div>
          </div>
          <div class="info-box">
            <h3>Vrsta poslovnog odnosa/stranke</h3>
            <div class="checkbox-row">
              ${VRSTA_POSLA_OPCIJE.map(o => `
                <div class="checkbox-item">
                  <div class="checkbox-box">${analizaRizika.vrsta_posla === o.value ? 'X' : ''}</div>
                  <span>${o.label}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 10px;">
              ${VRSTA_STRANKE_OPCIJE.map(o => `
                <div class="checkbox-item" style="margin-bottom: 3px;">
                  <div class="checkbox-box">${analizaRizika.vrsta_stranke === o.value ? 'X' : ''}</div>
                  <span>${o.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="section-title">GEOGRAFSKI RIZIK / INDIKATORI (${countMarked('geografski_rizici')}/${verzija.geografski_rizici.length})</div>
        <table>
          <thead>
            <tr>
              <th class="col-rbr">R.br.</th>
              <th class="col-tekst">Indikator</th>
              <th class="col-da">DA</th>
              <th class="col-ne">NE</th>
            </tr>
          </thead>
          <tbody>
            ${generateIndikatorRows(verzija.geografski_rizici, 'geografski_rizici')}
          </tbody>
        </table>
        
        <div class="section-title">RIZICI STRANAKA / INDIKATORI (${countMarked('rizici_stranaka')}/${verzija.rizici_stranaka.length})</div>
        <table>
          <thead>
            <tr>
              <th class="col-rbr">R.br.</th>
              <th class="col-tekst">Indikator</th>
              <th class="col-da">DA</th>
              <th class="col-ne">NE</th>
            </tr>
          </thead>
          <tbody>
            ${generateIndikatorRows(verzija.rizici_stranaka, 'rizici_stranaka')}
          </tbody>
        </table>
        
        <div class="page-break"></div>
        
        <div class="section-title">RIZICI TRANSAKCIJE / INDIKATORI (${countMarked('rizici_transakcije')}/${verzija.rizici_transakcije.length})</div>
        <table>
          <thead>
            <tr>
              <th class="col-rbr">R.br.</th>
              <th class="col-tekst">Indikator</th>
              <th class="col-da">DA</th>
              <th class="col-ne">NE</th>
            </tr>
          </thead>
          <tbody>
            ${generateIndikatorRows(verzija.rizici_transakcije, 'rizici_transakcije')}
          </tbody>
        </table>
        
        <div class="section-title">RIZIK USLUGE / INDIKATORI (${countMarked('rizici_usluga')}/${verzija.rizici_usluga.length})</div>
        <table>
          <thead>
            <tr>
              <th class="col-rbr">R.br.</th>
              <th class="col-tekst">Indikator</th>
              <th class="col-da">DA</th>
              <th class="col-ne">NE</th>
            </tr>
          </thead>
          <tbody>
            ${generateIndikatorRows(verzija.rizici_usluga, 'rizici_usluga')}
          </tbody>
        </table>
        
        <div class="section-title">UKUPNA OCENA RIZIKA STRANKE I POSLOVNOG ODNOSA, PREDUZETE RADNJE I MERE I PERIOD PRAĆENJA</div>
        <table class="summary-table">
          <thead>
            <tr>
              <th>Geografski rizik</th>
              <th>Rizik stranke</th>
              <th>Rizik transakcije</th>
              <th>Rizik usluge</th>
              <th>Finalna kateg. rizika stranke</th>
              <th>Radnje i mere</th>
              <th>Učestalost praćenja</th>
              <th>Datum</th>
              <th>Vršilac procene</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${getOcenaLabel(analizaRizika.ukupna_ocena.geografski)}</td>
              <td>${getOcenaLabel(analizaRizika.ukupna_ocena.stranke)}</td>
              <td>${getOcenaLabel(analizaRizika.ukupna_ocena.transakcije)}</td>
              <td>${getOcenaLabel(analizaRizika.ukupna_ocena.usluge)}</td>
              <td><strong>${getOcenaLabel(analizaRizika.ukupna_ocena.finalna)}</strong></td>
              <td>${getMereLabel(analizaRizika.ukupna_ocena.radnje_mere)}</td>
              <td>${getPracenjeLabel(analizaRizika.ukupna_ocena.ucestalost_pracenja)}</td>
              <td>${analizaRizika.datum_analize || '-'}</td>
              <td>${analizaRizika.vrsilac_analize || '-'}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="signature">
          <div class="signature-box">
            <div>U Beogradu, ${analizaRizika.datum_analize || '_________________'}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Direktor</div>
          </div>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  // Renderovanje sekcije sa indikatorima
  const renderIndikatorSection = (title, indikatori, kategorija, color) => {
    const markedCount = countMarked(kategorija)
    const totalCount = indikatori.length
    const sectionKey = kategorija.replace('rizici_', '').replace('_rizici', '')
    const isOpen = openSections[sectionKey]
    
    return (
      <div className="mb-4">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            markedCount > 0 
              ? 'bg-amber-50 border-amber-300' 
              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield className={`w-5 h-5 ${markedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="font-semibold text-slate-800">{title}</span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              markedCount > 0 
                ? 'bg-amber-200 text-amber-800' 
                : 'bg-slate-200 text-slate-600'
            }`}>
              {markedCount}/{totalCount}
            </span>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {isOpen && (
          <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="w-12 px-3 py-2 text-left font-medium text-slate-600">R.br.</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Indikator</th>
                  <th className="w-16 px-3 py-2 text-center font-medium text-slate-600">DA</th>
                  <th className="w-16 px-3 py-2 text-center font-medium text-slate-600">NE</th>
                </tr>
              </thead>
              <tbody>
                {indikatori.map((ind, idx) => {
                  const isMarked = analizaRizika[kategorija]?.[ind.id] === true
                  return (
                    <tr key={ind.id} className={`border-t border-slate-100 ${isMarked ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-3 py-2 text-slate-500">{idx + 1}.</td>
                      <td className="px-3 py-2 text-slate-700">{ind.tekst}</td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleIndikatorChange(kategorija, ind.id, true)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            isMarked 
                              ? 'bg-amber-500 border-amber-500 text-white' 
                              : 'border-slate-300 hover:border-amber-400'
                          }`}
                        >
                          {isMarked && <CheckCircle className="w-5 h-5 mx-auto" />}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleIndikatorChange(kategorija, ind.id, false)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            !isMarked 
                              ? 'bg-slate-500 border-slate-500 text-white' 
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {!isMarked && <X className="w-4 h-4 mx-auto" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Analiza rizika stranke</h3>
              <p className="text-slate-400 text-xs">
                {getField('ime') || 'Nepoznato'} {getField('prezime')} 
                {getField('jmbg') && ` | JMBG: ${getField('jmbg')}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col max-h-[calc(100vh-200px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            
            {/* Izbor verzije liste indikatora */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Verzija liste indikatora
              </h4>
              <div className="flex items-center gap-4">
                <select
                  value={selectedVerzija}
                  onChange={(e) => handleVerzijaChange(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border-2 border-indigo-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {sveVerzije.map(v => (
                    <option key={v.datum} value={v.datum}>
                      {v.naziv} ({v.datum})
                    </option>
                  ))}
                </select>
                <div className="text-sm text-indigo-600">
                  <span className="font-medium">{verzija.geografski_rizici.length + verzija.rizici_stranaka.length + verzija.rizici_transakcije.length + verzija.rizici_usluga.length}</span> indikatora
                </div>
              </div>
              {vlasnik.analiza_rizika?.verzija && vlasnik.analiza_rizika.verzija !== selectedVerzija && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Promenili ste verziju liste. Prethodna analiza je bila rađena sa verzijom {vlasnik.analiza_rizika.verzija}.
                </p>
              )}
            </div>

            {/* Osnovni podaci */}
            <div className="bg-slate-50 rounded-2xl p-5">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span> Podaci o analizi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Vrsta posla</label>
                  <select
                    value={analizaRizika.vrsta_posla}
                    onChange={(e) => handleFieldChange('vrsta_posla', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberite --</option>
                    {VRSTA_POSLA_OPCIJE.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Vrsta stranke</label>
                  <select
                    value={analizaRizika.vrsta_stranke}
                    onChange={(e) => handleFieldChange('vrsta_stranke', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="">-- Izaberite --</option>
                    {VRSTA_STRANKE_OPCIJE.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Datum analize</label>
                  <input
                    type="date"
                    value={analizaRizika.datum_analize}
                    onChange={(e) => handleFieldChange('datum_analize', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Vršilac analize</label>
                  <input
                    type="text"
                    value={analizaRizika.vrsilac_analize}
                    onChange={(e) => handleFieldChange('vrsilac_analize', e.target.value)}
                    placeholder="Ime i prezime"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Indikatori po kategorijama */}
            {renderIndikatorSection('GEOGRAFSKI RIZIK / INDIKATORI', verzija.geografski_rizici, 'geografski_rizici')}
            {renderIndikatorSection('RIZICI STRANAKA / INDIKATORI', verzija.rizici_stranaka, 'rizici_stranaka')}
            {renderIndikatorSection('RIZICI TRANSAKCIJE / INDIKATORI', verzija.rizici_transakcije, 'rizici_transakcije')}
            {renderIndikatorSection('RIZIK USLUGE / INDIKATORI', verzija.rizici_usluga, 'rizici_usluga')}

            {/* Ukupna ocena */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl p-5 border-2 border-slate-200">
              <button
                type="button"
                onClick={() => toggleSection('ocena')}
                className="w-full flex items-center justify-between mb-4"
              >
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">⚖️</span> UKUPNA OCENA RIZIKA
                </h4>
                {openSections.ocena ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {openSections.ocena && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Geografski rizik</label>
                    <select
                      value={analizaRizika.ukupna_ocena.geografski}
                      onChange={(e) => handleOcenaChange('geografski', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {KATEGORIJA_RIZIKA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rizik stranke</label>
                    <select
                      value={analizaRizika.ukupna_ocena.stranke}
                      onChange={(e) => handleOcenaChange('stranke', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {KATEGORIJA_RIZIKA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rizik transakcije</label>
                    <select
                      value={analizaRizika.ukupna_ocena.transakcije}
                      onChange={(e) => handleOcenaChange('transakcije', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {KATEGORIJA_RIZIKA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rizik usluge</label>
                    <select
                      value={analizaRizika.ukupna_ocena.usluge}
                      onChange={(e) => handleOcenaChange('usluge', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {KATEGORIJA_RIZIKA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1 font-bold">Finalna kategorija</label>
                    <select
                      value={analizaRizika.ukupna_ocena.finalna}
                      onChange={(e) => handleOcenaChange('finalna', e.target.value)}
                      className="w-full px-2 py-2 bg-amber-50 border-2 border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 font-semibold"
                    >
                      <option value="">-</option>
                      {KATEGORIJA_RIZIKA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Radnje i mere</label>
                    <select
                      value={analizaRizika.ukupna_ocena.radnje_mere}
                      onChange={(e) => handleOcenaChange('radnje_mere', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {RADNJE_MERE_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Učestalost praćenja</label>
                    <select
                      value={analizaRizika.ukupna_ocena.ucestalost_pracenja}
                      onChange={(e) => handleOcenaChange('ucestalost_pracenja', e.target.value)}
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">-</option>
                      {UCESTALOST_PRACENJA_OPCIJE.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 pt-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              Otkaži
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                <Printer className="w-5 h-5" />
                Štampaj
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-semibold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg"
              >
                <Save className="w-5 h-5" />
                Sačuvaj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
