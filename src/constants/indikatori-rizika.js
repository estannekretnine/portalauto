// ============================================
// VERZIJE LISTE INDIKATORA ZA ANALIZU RIZIKA
// Prema Zakonu o sprečavanju pranja novca i finansiranja terorizma
// ============================================

// Verzija od 19.09.2025 - Lista indikatora septembar 2025
const VERZIJA_2025_09_19 = {
  naziv: 'Lista indikatora - septembar 2025',
  datum: '2025-09-19',
  
  geografski_rizici: [
    { id: 'g1', tekst: 'Stranka insistira na elektronskom zaključivanju ugovora i elektronskom izdavanju narudžbenice, a dolazi iz zemlje poznate po proizvodnji i distribuciji opojnih droga, zemlje koja nema uređen sistem identifikacije i sprečavanja pranja novca i zemlje sa takozvane „crne liste", odnosno zemlje osumnjičene za podsticanje aktivnosti i finansiranje terorizma' },
    { id: 'g2', tekst: 'Transakcije koje potiču iz zemalja/teritorija koje se nalaze na „crnoj listi", u kojima se ne primenjuju propisi protiv pranja novca i gde postoji visok geografski rizik od pranja novca (bez obzira da li klijent dolazi sa tih teritorija)' },
    { id: 'g3', tekst: 'Stranka pristupa sa IP adrese (adresa internet protokola) iz zemlje i/ili regiona koji se nalazi na takozvanoj „crnoj listi"' },
    { id: 'g4', tekst: 'Stranka je državljanin zemlje koja ne poštuje standarde za sprečavanje pranja novca, finansiranja terorizma ili finansiranja širenja oružja za masovno uništenje' },
    { id: 'g5', tekst: 'Stranke su iz različitih zemalja/teritorija/područja u kojima se nalaze migrantski centri i centri za azil, poseduju dokumente RS dobijene po osnovu privremenog boravka i kupuju/zakupljuju nekretnine ili daju dozvolu za kupovinu domaćim licima' },
    { id: 'g6', tekst: 'Stranka dolazi iz zemlje koja ne poštuje međunarodne standarde u vezi sa pranjem novca, finansiranjem terorizma ili finansiranjem širenja oružja za masovno uništenje i/ili to čini u nedovoljnoj meri, a poznata je po proizvodnji droge' },
    { id: 'g7', tekst: 'Transakcija uključuje stranku iz zemlje za koju se zna ili se sumnja da pomaže u pranju novca, finansiranju terorizma ili aktivnostima finansiranja širenja oružja za masovno uništenje' },
    { id: 'g8', tekst: 'Poslovni odnos stranke uključuje učešće lica iz zemalja koje ne poštuju međunarodne standarde za sprečavanje pranja novca i finansiranja terorizma ili finansiranju oružja ili to čine u nedovoljnom obimu, a poznate su po proizvodnji droge' },
    { id: 'g9', tekst: 'Stranka potiče iz države prema kojima su Ujedinjene nacije, Savet Evrope ili druge međunarodne organizacije primenile sankcije, embargo ili slične mere' },
    { id: 'g10', tekst: 'Stranka potiče iz države koje su od strane kredibilnih institucija (npr. Svetska banka, MMF) označene kao države s visokim stepenom korupcije i kriminala' },
    { id: 'g11', tekst: 'Verodostojni izvori pokazali da ne dostavljaju informacije o stvarnom vlasništvu nadležnim organima, što se može utvrditi iz izveštaja o uzajamnoj proceni FATF ili izveštaja organizacija koje takođe razmatraju različite nivoe saradnje, kao što su izveštaji Globalnog foruma OECD o poštovanju međunarodnih standarda poreske transparentnosti' },
  ],

  rizici_stranaka: [
    { id: 's1', tekst: 'Ugovorne strane ne nastupaju u svoje ime i pokušavaju da prikriju identitet stvarne stranke' },
    { id: 's2', tekst: 'Stranka pokušava da se identifikuje drugim dokumentima osim ličnim dokumentima' },
    { id: 's3', tekst: 'Stranka dostavlja na uvid samo fotokopije ličnih dokumenata ili neusaglašenih dokumenata' },
    { id: 's4', tekst: 'Odbijanje stranke da pruži podatke koji se uobičajeno prikupljaju u praksi (lični podaci, adresa, zanimanje) i/ili nedoslednosti u priloženoj dokumentaciji (datumi, potpisi i drugi podaci)' },
    { id: 's5', tekst: 'Stranka/pravno lice daje adresu koja predstavlja broj poštanskog faha za komunikaciju sa posrednikom, ili adresa na kojoj je stranka/pravno lice registrovana ne postoji' },
    { id: 's6', tekst: 'Stranka je javnosti poznata, prema tvrdnjama medija, kao lice koje se bavi nedozvoljenim poslovanjem (siva zona) i/ili kriminalnim radnjama' },
    { id: 's7', tekst: 'Stranka u poslednjem trenutku, pre sprovođenja ugovora, menja ugovorne strane (dovodi novo lice i predstavlja ga kao fiktivno lice), bez davanja obrazloženja za takvo postupanje, a poznata je po svojim nelegalnim aktivnostima' },
    { id: 's8', tekst: 'Stranka nastoji da uspostavi dobre i prijateljske odnose sa osobljem posrednika, a prema javnom saznanju potiče iz kriminalne pozadine' },
    { id: 's9', tekst: 'Stranka za koju se sumnja da je povezana sa terorističkim aktivnostima i/ili navedena na sankcionoj listi UN 1267 zainteresovana je za uspostavljanje poslovnih odnosa i ulaganja u nekretnine' },
    { id: 's10', tekst: 'Stranka je veoma „pričljiva" u vezi sa temama koje se odnose na pranje novca, finansiranje terorizma ili finansiranje širenja oružja za masovno uništenje' },
    { id: 's11', tekst: 'Stranka je neobično upoznata sa zakonskom regulativom u vezi sa prijavljivanjem sumnjivih transakcija, brzo potvrđuje posredniku da su sredstva „čista" i da nisu oprana' },
    { id: 's12', tekst: 'Stranka pokušava da dokaže svoj identitet na drugi način osim dostavljanjem traženog ličnog dokumenta' },
    { id: 's13', tekst: 'Stranka neočekivano pokazuje veliko interesovanje za mehanizme i metode funkcionisanja sistema za sprečavanje pranja novca, finansiranja terorizma ili finansiranja širenja oružja za masovno uništenje' },
    { id: 's14', tekst: 'Stvarni vlasnik stranke je privredno društvo ili fizičko lice registrovano u državi „poreskog raja" preko koje se vrši trgovina drogom, odnosno državi u kojoj nije pravno regulisana oblast sprečavanja pranja novca, finansiranja terorizma ili finansiranja širenja oružja za masovno uništenje, dok se iz opšteg poslovanja stiče utisak da je stvarni vlasnik domaće fizičko lice' },
    { id: 's15', tekst: 'Posrednik ima saznanja da je stranka kažnjena za neka krivična dela' },
    { id: 's16', tekst: 'Stranka je u medijima povezana sa terorizmom/finansiranjem terorizma/ekstremizmom i fundamentalizmom/verskim radikalizmom' },
    { id: 's17', tekst: 'Postoje informacije da stranka ima lošu reputaciju ili da postoji sumnja u izvore i poreklo sredstava, koristi virtuelne valute u svom poslovanju (npr. bitkoin ili lajtkoin) ili koristi alternativne kanale plaćanja (npr. havala, hundi), u cilju izbegavanja redovnih transakcija' },
    { id: 's18', tekst: 'Stranka često menja adresu' },
    { id: 's19', tekst: 'Stranka je bila predmet gonjenja za krivična dela čijim izvršenjem može biti pribavljena imovinska korist' },
    { id: 's20', tekst: 'Stranka obavlja delatnost koja se smatra visokorizičnom u skladu sa Nacionalnom procenom rizika' },
    { id: 's21', tekst: 'Stranka je neobično zainteresovana za sistem organizacije, kontrole i nadzora poslovanja posrednika, nakon čega odustaje od kupovine i prodaje nekretnina' },
    { id: 's22', tekst: 'Stranka nije prisutna kada je zaključen ugovor o posredovanju, odnosno nema ličnog kontakta' },
    { id: 's23', tekst: 'Neovlašćeno lice pokušava da stupi u ugovorni odnos' },
    { id: 's24', tekst: 'Stranka daje sumnjive informacije ili dokumenta' },
    { id: 's25', tekst: 'Stranka pokazuje sumnjivo ponašanje tokom poslovnog odnosa, kao što je stalno ispravljanje informacija o identitetu druge strane, stvarnom vlasniku ili načinima plaćanja' },
    { id: 's26', tekst: 'Kupac/prodavac želi da proda imovinu koju je prethodno stekao na aukciji za naplatu imovine' },
    { id: 's27', tekst: 'Stranka je politički izložena osoba (PEP) koja nije identifikovana kao takva ili odbija da pruži identifikaciju na osnovu političkog imuniteta' },
    { id: 's28', tekst: 'Kod stranke postoji značajna razlika između finansijske situacije (potencijalnog kupca) i osnovne transakcije nekretninama' },
    { id: 's29', tekst: 'Stranka povlači svoju ponudu ili interesovanje zaključenja poslovnog odnosa nakon što sazna da su potrebna dalja istraživanja ili informacije, ili nakon što je upitan o izvoru sredstava' },
    { id: 's30', tekst: 'Stranka pristaje na identifikaciju, ali tvrdi da je zaboravio svoj identifikacioni dokument tokom sastanka licem u lice sa obveznikom (neposredno pre gledanja dokumenta) i ne daje je odmah' },
    { id: 's31', tekst: 'Stranka učestvuje u stranom (obično EU) programu Golden Visa koji se odnosi na nekretnine' },
    { id: 's32', tekst: 'Bogatstvo stranke potiče iz potencijalno rizične industrije ili industrije koja zahteva veliku količinu novca, kao što su kockanje, sportsko klađenje, organizovanje smeštaja za veće događaje, obezbeđenje, zabava za odrasle, trgovina oružjem ili trgovina robom visoke vrednosti, naftom, plemenitim metalima ili duvanskim proizvodima' },
    { id: 's33', tekst: 'Pravna lica ili pravni aranžmani se koriste kao privatna sredstva za upravljanje bogatstvom' },
    { id: 's34', tekst: 'Vlasničke strukture koje izgledaju neuobičajeno za vrstu poslovne aktivnosti i neobične pravne forme za uporedive poslovne aktivnosti' },
    { id: 's35', tekst: 'Poslovna saradnja za promet nekretnina sa mnogo učesnika stranaka: veza između učesnika nije verovatna (dolaze iz različitih oblasti); stvarnog vlasnika je teško identifikovati; učesnike zastupaju treća lica, tzv. nepouzdane psihički slabe osobe, ili deluju preko punomoćja' },
    { id: 's36', tekst: 'Korišćenje nestabilnih/nepouzdanih lica: neverovatne informacije o finansijeru i/ili stvarnom vlasniku; različita lična dokumenta - sumnje u identitet; vršilac dužnosti je i direktor brojnih drugih preduzeća' },
    { id: 's37', tekst: 'Neuobičajeno/sumnjivo rukovanje: Neuobičajena pitanja o procesu prodaje nekretnine — izgleda da su pitanja usmerena na prikupljanje informacija; ugovori o privatnim zajmovima nisu obezbeđeni zemljišnim knjigama - zajmodavac i zajmoprimac su povezani sa visokorizičnom zemljom; transakcije sa nekretninama se zahtevaju za brzi završetak iako je to neobično za konkretan slučaj' },
    { id: 's38', tekst: 'Kupac/zakupac ne pokazuje naročit interes za karakteristike nepokretnosti (kvalitet izrade, lokaciju, datum završetka i primopredaje)' },
    { id: 's39', tekst: 'Kupac/zakupac nije posebno zainteresovan za prikupljanje boljih ponuda ili za postizanje povoljnijih uslova plaćanja; stranke pokazuju veliko interesovanje da brzo obave kupoprodajnu transakciju iako za to nema posebnog razloga, bez interesovanja da se saznaju bitni detalji ugovora' },
    { id: 's40', tekst: 'Stranka kupuje nepokretnost za gotovinu, a ubrzo zatim tu nepokretnost koristi kao sredstvo obezbeđenja za dobijanje kredita za kupovinu nove nepokretnosti' },
    { id: 's41', tekst: 'Stranka poklanja nepokretnost licu sa kojim nije u srodstvu ili drugim ličnim ili poslovnim odnosima' },
    { id: 's42', tekst: 'Građevinske firme — kao posebno rizične mogu se posmatrati firme sa nesrazmerno malim brojem zaposlenih u odnosu na obim poslova koje vrše, nemaju svoju infrastrukturu, poslovne prostorije, vlasnička struktura nije jasna' },
    { id: 's43', tekst: 'Stranka je domaći ili strani funkcioner (lica određena članom 3 stav 1. tač. 24) i 25) Zakona) i kao politički izložena ličnost predstavlja rizik, stoga Posrednik mora sprovesti analizu u svim slučajevima kada takva ličnost istupa kao stranka, pre sklapanja poslovnog odnosa ili izvršenja transakcije' },
    { id: 's44', tekst: 'Stranka koja se interesuje za nekretninu, a nije lično videla nekretninu, istu kupuje preko posrednika (advokata, zastupnika, bliskih osoba i dr), sumnja raste pošto postoje saznanja da stranka kupac obavlja razna poslovanja na ivici zakona' },
    { id: 's45', tekst: 'Kupoprodaja nepokretnosti odvija se istog dana ili u vrlo kratkom vremenskom periodu, naročito kada se uočava značajno odstupanje od tržišne cene a pretpostavlja se da su stranke povezana lica' },
    { id: 's46', tekst: 'Prema saznanjima, stranka raspolaže sa velikom količinom gotovine za kupovinu nepokretnosti i pretpostavlja se da će plaćanje vršiti gotovinom' },
    { id: 's47', tekst: 'Vrednost ponuđene nepokretnosti je visoka, a stranka daje nelogične odgovore o načinima plaćanja iste, odnosno raspituje se da se isključivo transakcije obave u gotovini ili kombinovano sa nepouzdanim izvorima plaćanja' },
    { id: 's48', tekst: 'Stranka insistira na elektronskom zaključivanju ugovora i elektronskom izdavanju narudžbenice, a dolazi iz zemlje poznate po proizvodnji i distribuciji opojnih droga, zemlje koja nema uređen sistem identifikacije i sprečavanja pranja novca i zemlje sa takozvane „crne liste", odnosno zemlje osumnjičene za podsticanje aktivnosti i finansiranje terorizma' },
    { id: 's49', tekst: 'Stranka koja je nedavno kupila nepokretnost, prodaje je za višestruko veću cenu od kupovne, što ukazuje na povezana lica zbog fiktivnog transfera novca i skrivanja porekla i raslojavanja sledeće stranke' },
    { id: 's50', tekst: 'Zbog strukture, pravne forme ili složenih i nejasnih odnosa, teško utvrditi identitet njihovih stvarnih vlasnika ili lica koja njima upravljaju, kao npr. of-šor pravna lica sa nejasnom vlasničkom strukturom koja nisu osnovana od strane privrednih društava iz zemlje koja primenjuje standarde u oblasti sprečavanja PN/FT/FŠOMU koji su na nivou standarda propisanih Zakonom' },
    { id: 's51', tekst: 'Fiducijarno ili drugo slično društvo stranog prava sa nepoznatim ili prikrivenim vlasnicima ili upravom (tu se radi o društvu stranog prava koje nudi obavljanje zastupničkih poslova za treće lice, tj. društva, osnovana zaključenim ugovorom između osnivača i upravljača, koji upravlja imovinom osnivača, u korist određenih lica korisnika ili beneficijara, ili za druge određene namene)' },
    { id: 's52', tekst: 'Složena statusna struktura ili složen lanac vlasništva (otežava ili ne omogućava utvrđivanje stvarnog vlasnika stranke, odnosno lica koja posredno obezbeđuju imovinska sredstva, na osnovu kojih imaju mogućnost nadzora, koje mogu usmeriti ili na drugi način značajno uticati na odluke uprave ili poslovodstva stranke pri odlučivanju o finansiranju i poslovanju, fondacije, trastovi ili slična lica stranog prava, dobrotvorne i neprofitne nevladine organizacije, zemljoradničke zadruge, ofšor pravna lica sa nejasnom vlasničkom strukturom odnosno „Paravan lica")' },
    { id: 's53', tekst: 'Strani trgovci oružjem i proizvođači oružja' },
    { id: 's54', tekst: 'Posrednik poseduje saznanje da stvarni vlasnik imovine podleže merama koje ograničavaju raspolaganje imovinom' },
    { id: 's55', tekst: 'Nerezidenti i stranci' },
    { id: 's56', tekst: 'Stranka koje zastupaju lica kojima je to delatnost (advokati, računovođe ili drugi profesionalni zastupnici), posebno kad je Posrednik u kontaktu samo sa zastupnicima' },
    { id: 's57', tekst: 'Privredna društva sa nesrazmerno malim brojem zaposlenih u odnosu na obim poslova koje obavljaju, koje nemaju svoju infrastrukturu i poslovne prostorije, kod kojih je nejasna vlasnička struktura itd' },
    { id: 's58', tekst: 'Stranka nudi novac, poklone ili druge pogodnosti kao protivuslugu za poslove za koje postoji sumnja da nisu u potpunosti u skladu sa propisima' },
    { id: 's59', tekst: 'Stranka često menja svoje posrednike' },
    { id: 's60', tekst: 'Stranke koje obavljaju delatnosti za koje je karakterističan veliki obrt ili uplate gotovine (restorani, pumpe, menjači, kazina, cvećare, trgovci plemenitim metalima, automobilima, umetničkim delima, prevoznici robe i putnika, sportska društva, građevinske firme)' },
    { id: 's61', tekst: 'Privatni investicioni fondovi' },
    { id: 's62', tekst: 'Stranke čiji je izvor sredstava nepoznat ili nejasan, odnosno koji stranka ne može dokazati' },
  ],

  rizici_transakcije: [
    { id: 't1', tekst: 'Kupoprodaja nepokretnosti se odvija istog dana ili u veoma kratkom vremenskom periodu, posebno kada se uoči značajno odstupanje od tržišne cene i pretpostavlja se da su stranke povezana lica' },
    { id: 't2', tekst: 'Prema informacijama, stranka ima na raspolaganju veliki iznos gotovine za kupovinu nepokretnosti i pretpostavlja se da će plaćanje biti izvršeno u gotovini' },
    { id: 't3', tekst: 'Vrednost ponuđene imovine je visoka, a stranka daje nelogične odgovore o načinima plaćanja za nju, odnosno traži da se transakcije obavljaju isključivo u gotovini ili u kombinaciji sa nepouzdanim izvorima plaćanja' },
    { id: 't4', tekst: 'Stranka pokazuje veliko interesovanje za brzo okončanje kupoprodajne transakcije, iako za to nema posebnog razloga, i zahteva brzu formalnu radnju za zaključenje ugovora i ističe nameru za složene i neuobičajene načine plaćanja' },
    { id: 't5', tekst: 'Transakcije u kojima stranka traži plaćanje koje se sastoji od višestrukih manjih plaćanja, koje zajedno čine ukupnu cenu imovine (fragmentacija), posebno ako je imovina velike vrednosti i za koje postoji saznanje da su ugovorne strane umešane u nezakonite ili kriminalne radnje' },
    { id: 't6', tekst: 'Stranka koja prema saznanjima posrednika, ima izvore sredstava u inostranstvu ili van finansijskog sistema i želi da organizuje plaćanja u više manjih iznosa, koristeći platne institucije za transfer novca (npr. Western Union)' },
    { id: 't7', tekst: 'Ne mogu se identifikovati kanali plaćanja preko raznih elektronskih transakcija kao što su kriptovalute, PayPal, Epay itd., koje se do sada nisu pojavile na tržištu prometa kod posrednika' },
    { id: 't8', tekst: 'Višestruke kupoprodajne transakcije nepokretnosti koje je izvršila grupa fizičkih i/ili pravnih lica (nevladina, humanitarna, verska ili druga neprofitna organizacija) za koje se pretpostavlja da su umešani u neke nezakonite radnje, a postoje indicije da izvori novca za plaćanje potiču od nepovezanih lica' },
    { id: 't9', tekst: 'Zahtevanje za obavljanje transakcije a da se ne sprovodi Zakon o sprečavanju pranja novca i finansiranja terorizma' },
    { id: 't10', tekst: 'Transakcija koju izvrši kupac nije u skladu sa njegovom uobičajenom poslovnom praksom i u kratkom vremenskom periodu vrši višestruke kupovine bez ekonomskih ili zakonski opravdanih razloga, sa ciljem očiglednog plasmana novca' },
    { id: 't11', tekst: 'Zakupnina u iznosu znatno većem od zakupnine za nekretninu sličnih karakteristika na istoj ili sličnoj lokaciji, koja se plaća unapred za duži vremenski period, kada postoji sumnja na krivičnu nameru i fiktivnu prirodu ugovora' },
    { id: 't12', tekst: 'Stranka koja je nedavno kupila nekretninu prodaje je po višestrukoj kupoprodajnoj ceni, što ukazuje na povezana lica za fiktivnih transfera novca i prikrivanju porekla i raslojavanja' },
    { id: 't13', tekst: 'Stranka zahteva da se transakcija izvrši hitno ili zahteva da se ona tretira kao poverljiva' },
    { id: 't14', tekst: 'Stranka obavlja delatnost koju karakteriše veliki promet ili gotovinska plaćanja (npr. restorani, kladionice, kazina, cvećare, prevoznici, investitori u izgradnji nekretnina, itd.)' },
    { id: 't15', tekst: 'Zahtev stranke da javni beležnik u predugovor unese nesrazmerno višu cenu od realne tržišne cene' },
    { id: 't16', tekst: 'Korišćenje trećih lica, stranih računa, pojedinaca ili kompanija iz jurisdikcija visokog rizika za slanje ili primanje sredstava u ime kupca ili prodavca' },
    { id: 't17', tekst: 'Upotreba složenih zajmova ili drugih neobičnih metoda finansiranja (posebno privatnih)' },
    { id: 't18', tekst: 'Upotreba nekonvencionalnih metoda plaćanja van finansijskog sistema (npr. menice)' },
    { id: 't19', tekst: 'Troškovi transakcije kupovine ili druge fakture stranaka, koje plaća treća strana bez ikakve veze sa strankama (neobični kanali)' },
    { id: 't20', tekst: 'Ranije prodata imovina se obnavlja u prodaji, preprodaje bez transparentnog izvora finansiranja (nepoznat izvor sredstava)' },
    { id: 't21', tekst: 'Transakcije koje nemaju očiglednog ekonomskog smisla, posebno u slučaju finansijskog gubitka stranke (potcenjivanje)' },
    { id: 't22', tekst: 'Iznenadne ili neobjašnjive promene kod stranke vlasništva nekretnine, blizu završetka transakcije' },
    { id: 't23', tekst: 'Stranka zahteva da se prihodi od transakcije prenesu u jurisdikciju visokog rizika ili na treću stranu, koja nije uključena u transakciju' },
    { id: 't24', tekst: 'Konverzija kriptovaluta u fiat novac (izvor akumuliranog bogatstva postaje neotkriven — istorija novčanika pokazuje kako je bogatstvo akumulirano)' },
    { id: 't25', tekst: 'Privatni zajmovi stranke (izvor bogatstva zajmodavca se ne može utvrditi, pošto oni nisu strana u ugovoru ili transakciji; zajam potiče, na primer, iz inostranstva; često je prikriven poklon i koristi se za balansiranje sredstava u havala sistemu)' },
    { id: 't26', tekst: 'Sumnja u lažna bankarska dokumenta (novac dolazi iz drugog izvora, na primer, trebalo bi da je na srpskom računu, ali uplate neočekivano dolaze iz inostranstva), falsifikovanje bankovnih izvoda ili akreditiva, kao što su neidentifikovani menadžeri računa, lažni memorandum ili memorandum koji nedostaje, ili netačna imena preduzeća' },
    { id: 't27', tekst: 'Ukupan iznos 100% kapitala stranke je prikriveno i teško proveriti verodostojnost izvora i akumulacije bogatstva' },
    { id: 't28', tekst: 'Saradnja stranke sa poreskim savetnicima ili advokatima kod obavljanja transakcija (ovi čuvari propisa mogu biti izmanipulisani od strane perača novca, tako da njihove potvrde mogu samo da daju privid legitimiteta, ali ne odražavaju stvarnost)' },
    { id: 't29', tekst: 'Značajno odstupanje početne cene (+/- 25%) (značajno odstupanje je kada početna cena premaši ili padne ispod tržišne vrednosti za najmanje 25%)' },
    { id: 't30', tekst: 'Postoji visok nivo rizika u fiksnim i flip transakcijama, jer ih često sprovode privatna lica i izvor sredstava je teško proveriti' },
    { id: 't31', tekst: 'Izvodi iz banke pokazuju depozite/transfere trećih lica koja nisu povezana sa strankom (npr. nisu članovi porodice)' },
    { id: 't32', tekst: 'Dokazi o kapitalu stranke i bankovni izvodi su nedosledni ili pokazuju nepravilnosti kao što su neuobičajeni tekstovi ili problemi sa formatiranjem/fontom' },
    { id: 't33', tekst: 'Dokazi ili izvori prihoda su iz netransparentnih poslovnih aktivnosti (uvoz/izvoz, e-trgovina, trgovina kriptovalutama, itd.)' },
    { id: 't34', tekst: 'Imovinski krediti stranke premašuju vrednost nekretnine' },
    { id: 't35', tekst: 'Kupovina nepokretnosti na ime trećih lica (dece, prijatelja, advokata, pravnih lica sa of-šor destinacija i drugih pravnih lica), bez logičnog razloga' },
    { id: 't36', tekst: 'Kupovina/zakupnina nepokretnosti je nesrazmerna kupovnoj moći kupca/zakupca, a gde isti daje nelogične odgovore o poreklu imovine' },
    { id: 't37', tekst: 'Više transakcija kupovine i prodaje jedne nepokretnosti koje vrši grupa fizičkih i/ili pravnih lica koja su međusobno povezana (porodične, poslovne veze, lica koja dele istu adresu ili zastupnike ili advokate itd.)' },
    { id: 't38', tekst: 'Transakcije koje izvršavaju zastupnici (advokati, punomoćnici i dr) koji deluju u interesu potencijalno povezanih fizičkih lica (porodična ili poslovna povezanost, lica koja žive na istoj adresi itd.)' },
    { id: 't39', tekst: 'Transakcije u kojima se kao učesnik pojavljuje novoosnovano pravno lice, sa malim osnivačkim kapitalom, a kupuje ili prodaje nekretnine visoke vrednosti' },
    { id: 't40', tekst: 'Obezbeđenje kredita za kupovinu nepokretnosti vrši se depozitom u iznosu od 100% iznosa traženog kredita' },
    { id: 't41', tekst: 'Transakcije koje dolaze sa teritorija koje ne primenjuju propise iz oblasti sprečavanja pranja novca i gde postoji visok geografski rizik od pranja novca, bez obzira na to da li stranka dolazi sa tih teritorija' },
    { id: 't42', tekst: 'Stranka obećava nerealno visoku posredničku naknadu za izvršeni posao (kupovinu/zakupninu nepokretnosti)' },
    { id: 't43', tekst: 'Transakcije koje su bile namenjene licima, odnosno subjektima protiv kojih su na snazi mere Ujedinjenih nacija ili Saveta Evrope, kao i transakcije koje bi stranka izvršila u ime i za račun lica ili subjekta protiv kojeg su na snazi mere Ujedinjenih nacija ili Saveta Evrope' },
  ],

  rizici_usluga: [
    { id: 'u1', tekst: 'Zainteresovano lice za nepokretnost, a koje nije lično videlo nekretninu, kupuje je preko posrednika (advokata, zastupnika, bliskog lica i sl.)' },
    { id: 'u2', tekst: 'Stranka je lice koje u kratkom vremenskom periodu proda više nekretnina' },
    { id: 'u3', tekst: 'Stranka daje ovlašćenje trećem licu, koje deluje u ime i za račun određenog lica ili po njegovom uputstvu u cilju prodaje ili davanja u zakup nepokretnosti' },
    { id: 'u4', tekst: 'Stranka preko ovlašćenog trećeg lica prodaje imovinu ispod tržišne vrednosti' },
    { id: 'u5', tekst: 'Stranka insistira na onlajn komunikaciji i zaključenju ugovora u elektronskom obliku' },
    { id: 'u6', tekst: 'Usluge koje su nove na tržištu, tj. nisu ranije nuđene u nefinansijskom sektoru i moraju se posebno pratiti radi utvrđivanja stvarnog stepena rizika' },
    { id: 'u7', tekst: 'Elektronsko ispostavljanje ugovora/naloga za trgovinu u slučajevima koje Posrednik predvidi svojom procedurom' },
    { id: 'u8', tekst: 'Pružanje onih vrsta usluga za koje je zaposleni kod Posrednika na osnovu svog iskustva procenio da nose visok stepen rizika' },
    { id: 'u9', tekst: 'Pružanje usluga otvaranjem tzv. zajedničkih računa za transakcije, koji mobilišu sredstva iz različitih izvora i od različitih stranaka, a koja se deponuju na jedan račun otvoren na jedno ime' },
    { id: 'u10', tekst: 'Usluge koje su međunarodno priznati izvori identifikovali kao visokorizične usluge u elektronskom poslovanju, kao što su međunarodne korespodentske bankarske usluge u realizaciji kupoprodajnih ugovora (i međunarodne) privatne bankarske aktivnosti kod transakcija' },
    { id: 'u11', tekst: 'Novi inovativni proizvodi ili usluge koje Posrednik ne pruža neposredno, već se za njihovo pružanje koriste različiti elektronski posrednici ili drugi kanali kod Posrednika (npr. u slučaju prijema naloga za trgovanje, veći je rizik od pranja novca prilikom ispostavljanja naloga elektronskim putem ili putem platformi za trgovanje ili korišćenjem mobilnih telefona, nego kada se ugovori/nalozi ispostavljaju neposredno)' },
    { id: 'u12', tekst: 'Stranka insistira na novim uslugama novčanog poslovanja digitalnim načinom, pri čemu postoji verovatnoća da ne mogu da se identifikuju realni tokovi novca ili učesnici plaćanja (Crypto currency, PayPal, Epay i dr.), koji se do sada nisu pojavljivali na tržištu kod posrednika, ili se koriste različiti elektronski ili drugi kanali plaćanja' },
    { id: 'u13', tekst: 'Stranka nudi visoku posredničku naknadu, sa ciljem potkupljivanja kako se ne bi vršile radnje i obaveze iz zakona' },
    { id: 'u14', tekst: 'Zakupnina u iznosu koji je značajno veći od zakupnine stana približnih karakteristika na istoj ili sličnoj lokaciji, koja se unapred plaća za duži vremenski period, kada postoji sumnja u kriminalnu nameru i fiktivnost ugovora' },
  ]
}

// ============================================
// REGISTAR SVIH VERZIJA
// ============================================

export const VERZIJE_INDIKATORA = {
  '2025-09-19': VERZIJA_2025_09_19,
  // Dodajte nove verzije ovde:
  // '2026-03-15': VERZIJA_2026_03_15,
}

// Koja verzija se koristi za NOVE analize
export const AKTIVNA_VERZIJA = '2025-09-19'

// Helper funkcije
export const getVerzija = (datumVerzije) => {
  return VERZIJE_INDIKATORA[datumVerzije] || VERZIJE_INDIKATORA[AKTIVNA_VERZIJA]
}

export const getSveVerzije = () => {
  return Object.entries(VERZIJE_INDIKATORA).map(([datum, verzija]) => ({
    datum,
    naziv: verzija.naziv
  })).sort((a, b) => b.datum.localeCompare(a.datum)) // Najnovija prva
}

export const getAktivnaVerzija = () => {
  return VERZIJE_INDIKATORA[AKTIVNA_VERZIJA]
}

// Opcije za dropdown-ove (ostaju iste za sve verzije)
export const VRSTA_POSLA_OPCIJE = [
  { value: 'posredovanje_prodavac', label: 'Posredovanje - Prodavac' },
  { value: 'posredovanje_kupac', label: 'Posredovanje - Kupac' },
  { value: 'posredovanje_zakupodavac', label: 'Posredovanje - Zakupodavac' },
  { value: 'posredovanje_zakupac', label: 'Posredovanje - Zakupac' },
]

export const VRSTA_STRANKE_OPCIJE = [
  { value: 'fizicko_lice', label: 'Fizičko lice' },
  { value: 'pravno_lice', label: 'Pravno lice' },
  { value: 'preduzetnik', label: 'Preduzetnik' },
  { value: 'lice_gradjanskog_prava', label: 'Lice građanskog prava' },
]

export const KATEGORIJA_RIZIKA_OPCIJE = [
  { value: 'nizak', label: 'Nizak' },
  { value: 'srednji', label: 'Srednji' },
  { value: 'visok', label: 'Visok' },
  { value: 'neprihvatljiv', label: 'Neprihvatljiv' },
]

export const RADNJE_MERE_OPCIJE = [
  { value: 'pojednostavljene', label: 'Pojednostavljene' },
  { value: 'opste', label: 'Opšte' },
  { value: 'pojacane', label: 'Pojačane' },
]

export const UCESTALOST_PRACENJA_OPCIJE = [
  { value: '6_meseci', label: '6 meseci' },
  { value: '2_meseca', label: '2 meseca' },
  { value: '1_mesec', label: '1 mesec' },
]

// Inicijalna struktura analize rizika
export const getInitialAnalizaRizika = (verzijaDatum = AKTIVNA_VERZIJA) => {
  const verzija = getVerzija(verzijaDatum)
  return {
    verzija: verzijaDatum,
    datum_analize: '',
    vrsilac_analize: '',
    vrsta_posla: '',
    vrsta_stranke: '',
    geografski_rizici: Object.fromEntries(verzija.geografski_rizici.map(i => [i.id, false])),
    rizici_stranaka: Object.fromEntries(verzija.rizici_stranaka.map(i => [i.id, false])),
    rizici_transakcije: Object.fromEntries(verzija.rizici_transakcije.map(i => [i.id, false])),
    rizici_usluga: Object.fromEntries(verzija.rizici_usluga.map(i => [i.id, false])),
    ukupna_ocena: {
      geografski: '',
      stranke: '',
      transakcije: '',
      usluge: '',
      finalna: '',
      radnje_mere: '',
      ucestalost_pracenja: '',
    }
  }
}
