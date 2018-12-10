# Webová aplikácia
-----------------
Webová aplikácia nástroja SLAmeter predstavuje používateľské rozhranie nástroja, ktoré umožňuje prístup k zaznamenaným a vyhodnoteným údajom nižších vrstiev architektúry. Koncepčne je táto aplikácia tvorená 

* serverom, poskytujúcim služby v podobe REST webových služieb alebo udalostí na WebSocket komunikačnom kanáli, ktorými sprístupňuje údaje z iných častí nástroja SLAmeter, a
* klientom, ktorý tieto služby využíva na vytvorenie používateľského rozhrania, ktoré získané údaje zobrazí a poskytne nástroje na ovplyvňovanie získavaných údajov. 

Webová aplikácia je tvorená v prvom rade modulmi, ktoré sprístupňujú výsledky meraní nástroja. Tieto moduly sú podľa typu zoskupené do samostatných aplikácií a tieto aplikácie je možné ďalej deliť na sekcie so špecifickou úlohou.

## Informácie o projekte
---------------------

* **Stav**: vyvíjaný
* **Autori**:        
    *  **Ján Juhár** - architektúra, historické štatistické moduly
    *  **Pavol Beňko** - historické štatistické moduly
    *  **Matúš Husovský** - moduly účtovania a aplikačných štatistík
    *  **Ladislav Berta** - moduly pre IDS
* Licencia: GNU GPLv3
* Implemetačné prostredie:
    * **server**: Python 2.7.x, aplikačný rámec Django 1.6
    * **klient**: JavaScript, aplikačný rámec Ember 1.8.0
    * **Štrutkúra projektu**: [StrukturaProjektuWebSLA](StrukturaProjektuWebSLA)
* [Používateťská príručka PDF (Jadro+Architektúra+Podaplikácia sieť. štatistík)](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_base_pp.pdf)
* [Systémová príručka PDF (Jadro+Architektúra+Podaplikácia sieť. štatistík)](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_base_sp.pdf)
* [Používateťská príručka PDF (Podaplikácie - účtovanie, aplikačné štatistiky)](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_pp.pdf)
* [Systémová príručka PDF (Podaplikácie - účtovanie, aplikačné štatistiky](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_sp.pdf)

## Inštalácia
-------------
Postup inštalácie je popísaný v [InstalaciaWebSLA](InstalaciaWebSLA)


## Server webovej aplikácie
-------------
Hlavnou úlohou servera je získanie údajov spracovaných v iných častiach nástroja SLAmeter a ich poskytnutie webovému klientovi.

### Požiadavky
-------------

Na funkcionalitu servera sú kladené tieto požiadavky:

* **Modulárna architektúra.** Úlohou jednotlivých modulov je získavanie údajov z nižších častí nástroja SLAmeter.
* **Zoskupovanie modulov do pod-aplikácií.**
* **Distribúcia údajov modulov webovému klientovi.** Údaje modulov musí byť možné individuálne vyžiadať zo strany klienta.
* **Správa používateľov.**
* **Možnosť reálno-časovej komunikácie.**

### Architektúra servera
-------------

Pri architektúre servera je dôležitá štruktúra aplikácie s modulmi a jadra, ktoré tieto aplikácie prepája, pričom poskytuje ďalšie prvky potrebné v rámci všetkých aplikácií.


#### Aplikácia s modulmi
-------------

Takáto aplikácia je realizovaná ako Django aplikácia.

Každá aplikácia v rámci servera bude obsahovať iný typ modulov. Preto aj jej špecifické požiadavky vzhľadom na tieto moduly sa môžu odlišovať. Všeobecná architektúra, ktorú by mali takéto aplikácie s modulmi dodržiavať, je zobrazená na nasledovnom obrázku.

![architektúra servera](https://git.cnl.sk/uploads/monica/slameter_web/b65607b86b/server-architektura-01.png)

Obrázok I: _Architektúra všeobecnej aplikácie s modulmi_

Jednotlivé triedy rámca, ktoré sú vyznačené na obrázku, sú už v projekte webového servera implementované a majú slúžiť ako základ pri vytváraní konkrétnej aplikácie pre moduly. Tieto triedy je možné nájsť v rámci Python balíka `core.framework`.


Význam blokov zobrazeného diagramu je nasledovný:

* **Údajový konektor** tvorí spojovací článok medzi zdrojom údajov a modulmi, ktoré ho využívajú. Jeho úlohou je vytvoriť spojenie so zdrojom údajov, odoslať cez neho požiadavku, alebo vykonať vzdialenú operáciu požadovanú modulom, a získanú odpoveď sprístupniť dopytujúcemu sa modulu.

* **Moduly** predstavujú hlavnú súčasť aplikácie. Informácie o každom z nich sú sprístupnené klientom prostredníctvom REST služby tvorenej pohľadom _Služba modulu_. Úlohou modulu je prijať požiadavku o údaje od webového klienta, spracovať ju do tvaru požadovaného zdrojom údajov, získať údaje pomocou údajového konektora a odoslať ich späť klientovi. Nad získanými údajmi môže vykonať jednoduchú transformáciu do tvaru vyhovujúceho klientovi, no je potrebné sa tu vyhnúť výpočtovo náročným procesom. Každý z týchto modulov by mal byť implementovaný vo vlastnej triede, ktorá by mala rozširovať triedu rámca _Abstraktný modul_.

* **Aplikácia** reprezentuje navzájom súvisiacu množinu modulov. Podobne ako moduly, aj tá je zverejnená v podobe služby. Uchováva zoznam prislúchajúcich modulov a figuruje vo vytváraní URL adries služieb za pomoci smerovača.

* **Serializátory** modulov a aplikácie sú podtriedy serializátorov poskytnutých aplikáciou DRF (Django REST Framework). Slúžia na transformáciu medzi internými údajovými štruktúrami a formátom JSON používanom pri prenose údajov.

* **Smerovač aplikácie** je koncepcia inšpirovaná DRF smerovačom. Úlohou smerovača je automatizácia konštrukcie regulárnych výrazov, ktoré Django používa pre určenie pohľadu, ktorý má obslúžiť požiadavku prichádzajúcu na konkrétnu URL adresu. Smerovač je práve to miesto, kde je potrebné registrovať všetky pohľady služieb aplikácie, ako sú moduly, či doplnkové modely (v zmysle vzoru MVC) vyžadované aplikáciou.

* **WebSocket** je trieda obsluhujúca spojenie s klientom pomocou rovnomenného protokolu. V nej bude možné vytvoriť udalosti komunikačného kanála, ktorými bude možné získavať údaje modulov aplikácie. To môže byť použité ako alternatíva k získavaniu údajov cez HTTP protokol, alebo pre moduly vyžadujúce reálno-časovú komunikáciu.

* **Pohľady služieb** sú založené na pohľadoch DRF, odvodených od Django pohľadov založených na triedach. Umožňujú jednoduché sprístupnenie CRUD operácií  nad požadovanými objektami. Ich _bázové_ varianty, prítomné v _rámci_, sú upravené pre použitie s modulmi a aplikáciami webovej aplikácie nástroja SLAmeter.

Základný postup vytvorenia novej aplikácie s modulmi je opísaný v [AppServerWebSLA](AppServerWebSLA).

#### Jadro
-------------

![architektúra servera jadro](https://git.cnl.sk/uploads/monica/slameter_web/7852cdfa97/server-architektura-02.png)


Obrázok II: _Architektúra jadra webovej aplikácie na strane servera_ 

Jadro webového servera je tvorené jednoduchou Django aplikáciou s názvom `core`, ktorej hlavnou úlohou je poskytovať správu používateľov a prepájať REST webové služby jednotlivých aplikácií s modulmi. Štruktúra tejto Django aplikácie je na nasledovnom obrázku.

Navrhnuté sú dva typy používateľov - _Používateľ_ a _Klient_.
* Trieda **Používateľ** predstavuje všeobecného používateľa, ku ktorému postačujú len základné informácie, ako:
      * e-mailová adresu,
      * prístupové heslo, a
      * prístupové oprávnenia.
* Trieda **Klient** rozširuje triedu _Používateľ_ o informácie, ktoré je potrebné uchovávať o klientoch v nástroji SLAmeter. Sú to predovšetkým informácie o prípojke k sieti, na základe ktorých bude možné filtrovať záznamy z meraní pre daného používateľa. Vzhľadom na aktuálnu realizáciu monitorovacích vrstiev nástroja SLAmeter týmito informáciami sú:
      * IP adresa prípojky používateľa, a
      * identifikátora Exportéra, ktorý zaznamenáva prevádzku z tejto adresy.

Pre Exportéry je tiež vytvorený model, ktorý umožní priradiť k ich identifikátorom aj názov alebo stručný popis, ktorý je použitý v rozhraní na lepšiu identifikáciu jednotlivých exporétrov.

Pri vývojovej verzii webovej aplikácie je možné vo webovom prehliadači otvoriť adresu `http://localhost:8000/api/`, kde je možné prehliadať existujúce webové služby.


## Klient webovej aplikácie
--------------------------

Klient webovej aplikácie vytvára používateľské rozhranie nástroja SLAmeter. Realizovaný je pomocou JavaScript MVC frameworku [Ember](http://emberjs.com). Primárny spôsob návrhu architektúry aplikácie týmto frameworkom je pomocou definície hierarchie trás (angl. routes), ktoré zodpovedajú  URL adresám, a hierarchie pohľadov, ktoré trasám prislúchajú.
Trasy vo frameworku Ember predstavujú špeciálny typ riadičov (controller), ktorých úlohou je riadiť prechody medzi hierarchiami pohľadov a zaznamenávať aktuálne zobrazený stav aplikácie do URL adresy.

Dôležitým aspektom pri tvorbe Ember aplikácie sú menné konvencie. Tie určujú mená/umiestnenia JavaScript modulov, ktoré, ak sú dodržané, sú automaticky vložené na požadované miesta technikou zvanou _vkladanie závislostí_ (angl. dependency injection). Tieto konvencie sú pre klienta webovej aplikácie nástroja SLAmeter ďalej rozšírené, ako to opisuje [VyhladavanieTriedWebSLA](VyhladavanieTriedWebSLA).

Vzhľadom na relatívne rozsiahlu API základňu frameworku Ember a na konvencie, ktorých dodržiavanie výrazne uľahčuje prácu s týmto frameworkom, dôrazne je odporúčané oboznámenie sa s týmto frameworkom z jeho oficiálnej dokumentácie v prípade, že plánujete ďalší vývoj webovej aplikácie.

Veľmi užitočným nástrojom pri vývoji klienta webovej aplikácie je doplnok _Ember Inspector_, ktorý je dostupný pre prehliadač [Google Chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi) a [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/) a umožní zobraziť štruktúru aplikácie (pohľady, riadiče, šablóny, generované trasy), používané mená a takisto aktuálne hodnoty jednotlivých objektov tvoriacich aplikáciu. Spolu s vývojárskymi nástrojmi týchto prehliadačov je možné aj plné _debugovanie_ aplikácie. Jedna z výhod, ktoré tu ponúka _Chrome_, je možnosť zobrazenia jednotlivých správ poslaných protokolom WebSocket (prinajmenšom, táto funkcionalita nie je prítomná v prehliadači Firefox verzie 32).

### Požiadavky
--------------

* Modulárna architektúra
* Rozdelenie modulov do aplikácií a ďalej do sekcií (hierarchia modulov)
* Individuálne získavanie údajov modulov.
* Podpora používateľskej modifikácie požiadaviek na zdroje údajov modulov, na úrovni jednotlivých modulov ako aj na úrovni sekcie modulov

### Hierarchia trás a pohľadov
-----------------------------

Základná štruktúra pohľadov a ich pomenovaní je zobrazená na obrázku _Hierarchia pohľadov_. Názvy pohľadov sú uvádzané v obyčajných zátvorkách a názvy "outletov" alebo "partial" šablón, ktoré sú použité pre konkrétne pohľady sú v {{ a }} zátvorkách používaných v šablónovom systéme Handlebars, ktorý Ember využíva. 

Celá konštrukcia sekcie aplikácie je realizovaná v trase sekcie `/slameter/routes/base-app/base-section`. Ak teda sekcia konkrétnej aplikácie nevyžaduje žiadne modifikácie oproti tej bázovej, nie je trasu pre túto sekciu potrebné vytvárať. V prípade potreby prispôsobenia ja možné od bázovej sekcie dediť.

Moduly, ktoré sú zobrazované v rozhraní, pozostávajú z viacerých šablón, aby bola dosiahnutá čo najväčšia flexibilita v prispôsobovaní sa požiadavkám modulov rôznych aplikácií.
Táto štruktúra je zobrazená na obrázku.

![hierarchia pohladov](https://git.cnl.sk/uploads/monica/slameter_web/286de6b80b/nova-struktura-stranky-popis-sablon-01.png)

Obrázok III: _Hierarchia pohľadov_

![štruktúra bázového modulu](https://git.cnl.sk/uploads/monica/slameter_web/acef70dd81/nova-struktura-stranky-popis-sablon-02.png)

Obrázok IV: _Šablóny bázového modulu_ 

Na obrázku _Šablóny bázového modulu_ sú zobrazené šablóny použité pri zostavovaní modulu. Každý modul má už na serveri určený v rámci aplikácie jedinečný názov, ktorý je použitý aj v klientovi. Názvy šablón, ktoré sú uvedené na obrázku, sú automaticky vyhľadané a použité na danom mieste základnej šablóny `base-module-layout`. Zostavenie modulu zo šablón je preto možné dosiahnuť bez dodatočnej konfigurácie, prostým vytvorení Handlebars šablón s názvom/umiestnením podľa uvedených konvencií. V prípade potreby použitia iných šablón je všetky názvy možné prispôsobiť na riadiči konkrétneho modulu. Pri module s vysoko špecifickými požiadavkami, ktoré nie je možné splniť s touto štruktúrou, je možné nastaviť názov šablóny rozloženia modulu na jeho riadiči vo vlastnosti `layoutTemplate`. Zmenou tejto šablóny prestávajú platiť všetky uvedené menné konvencie a zobrazenie modulu je plne v kontrole tejto novej šablóny.

V rámci Ember smerovača je pre každú aplikáciu s modulmi vygenerovaná:
* jedna trasa pre aplikáciu
* v rámci nej trasa pre každú sekciu aplikácie.

Pri vyhľadávaní JavaScript modulov pohľadov alebo šablón sa používa upravený algoritmus vyhľadávania (oproti štandardnému Ember postupu), ktorý umožňuje nahradenie nenájdených pohľadov ich bázovými variantami implementovanými pre SLAmeter namiesto štandardných Ember tried. Tento algoritmus je popísaný v [VyhladavanieTriedWebSLA](VyhladavanieTriedWebSLA).

### Architektúra strany klienta
----------------------------

Pri aktívnej sekcii aplikácie s modulmi sa vytvorí štruktúra zobrazená na obrázku _Architektúra bázovej sekcie klienta_. Zobrazená štruktúra je štruktúra bázovej sekcie, ktorá môže byť pre konkrétne sekcie prispôsobená implementovaním JavaScript modulov podľa pomenovávacích konvencií aplikačného rámca Ember. Každý blok označený ako _modul_ má štandardne štruktúru, ktorá je zobrazená na obrázku _Štruktúra bázového modulu_. Aj túto je možné ďalej prispôsobovať.

![architektúra sekcie klienta](https://git.cnl.sk/uploads/monica/slameter_web/933afd81e0/klient-architektura-01.png)

Obrázok V: _Architektúra bázovej sekcie klienta_


![architektúra modulu](https://git.cnl.sk/uploads/monica/slameter_web/cd3cfc2553/klient-architektura-02.png)

Obrázok VI: _Štruktúra bázového modulu_ 


Základná konštrukcia sekcie do už prezentovanej podoby sa realizuje v JavaScript module trasy s názvom `slameter/routes/base-app/base-section`. Štandardná Ember metóda trasy `setupController` obsahuje prípravu riadičov pre panely _hlavný panel_, _sumárny panel_ a _navigačný panel_. Ich príprava pozostáva predovšetkým z naplnenia ich `model` (alias pre `content`) vlastnosti skonštruovanými modulmi. Konštrukcia týchto modulov prebieha pomocou riadiča `slameter/controllers/module-builder` a pomocou zoznamu modulov a konfigurácie sekcií načítaných z webového servera. Tento proces je bližšie opísaný v [KonstrukciaModulovWebSLA](KonstrukciaModulovWebSLA).

Pohľady a riadiče jednotlivých panelov slúžia predovšetkým ako _kontainery_ pre moduly v nich umiestnených a nemajú implementovanú ďalšiu funkcionalitu. Čiastočnú výnimku tvorí pohľad _hlavného panelu_, ktorý využíva jQuery plugin `brickLayout` na vytovrenie `tehlovitého` rozloženia modulov a teda obsahuje logiku pre inicializáciu tohto pluginu.

## Aplikácie s modulmi

### Sieťové štatistiky
--------------------
Implementovaná je aplikácia sieťových štatistík. Jej moduly získavajú údaje z [Vyhodnocovača](https://git.cnl.sk/monica/slameter_evaluator/wikis/home) a poskytujú ich používateľovi v podobe grafických priebehov alebo sumarizovaných údajov.

### Účtovanie a fakturácia
--------------------
Táto aplikácia umožňuje vyhodnotiť údaje pre vybranú účtovaciu entitu prostredníctvom troch metód:

* Účtovanie na základe kritérii
* Účtovanie na základe 95-teho percentilu
* Účtovanie na základe množstva prevádzky

Výsledky vyhodnotenia sú použité ako vstup do fakturačného procesu. Výstupom fakturačného procesu sú finančné ohodnotenia 
príslušných výsledných parametrov z ktorých je generovaná faktúra. Tá môže byť odoslaná príslušnej účtovacej entite.
Celý proces (vyhodnotenie, generovanie faktúry, odoslanie faktúry) môže byť zautomatizovaný použitím fakturačných plánov, ktoré sú tiež podporované. 
[Podrobnosti o aplikácii](AccAppWeb)

### Aplikačné štatistiky
--------------------
Zobrazuje aplikačné štatistiky účtovacích entít resp. používateľov v podobe kruhových grafov. Okrem vyhodnotenia pre rôznych používateľov podporuje aj sumárne vyhodnotenie. Obsahuje 4 moduly, ktoré vyhodnocujú prevádzku podľa rôznych parametrov (DPI, transportné protokoly, porty, DSCP triedy).
[Podrobnosti o aplikácii](AccAppWeb)



