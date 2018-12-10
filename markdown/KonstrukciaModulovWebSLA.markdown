# Konštrukcia modulov v klientovi webovej aplikácie nástroja SLAmeter
-----------------------

Nasledujúci text opisuje spôsob konštrukcie modulov a sekcií modulov v klientovi webovej aplikácie.

## Definícia sekcií
--------------------

Sekcie modulov webovej aplikácie sú definované v konfiguračných súboroch uložených v adresári [configs](https://git.cnl.sk/monica/slameter_web/tree/master/slaweb_api/configs) v projekte **servera**. V tomto adresári existujú súbory `json` s názvom jednotlivých aplikácií s modulmi a súborom `core.json`, ktorý obsahuje všeobecné konfigurácie webového klienta.

Každý takýto konfiguračný súbor pozostáva z troch sekcií:
   * _common_ - konfigurácia spoločná pre obe typy používateľov,
   * _provider_ - špecifická konfigurácia pre používateľov typu _provider_ (používatelia modelovaní Django modelom `User`, ktorí majú nastavený príznak `is_staff`,
   * _client_ -  špecifická konfigurácia pre požívateľov typu _client_ (používatelia modelovaní Django modelom `Client`).

Pri čítaní týchto konfiguračných súborov je najskôr načítaná sekcia _common_ a následne sekcia _provider_ alebo _client_, podľa prihláseného používateľa. Táto sekcia hĺbkovo modifikuje sekciu _common_ a výsledok je odoslaný klientovi. Na základe takto získanej konfigurácie aplikácie s modulmi klient zostavuje sekcie tejto aplikácie a jej moduly. 

Sekcie aplikácie sú v konfiguračnom súbore špecifikované pod kľúčom _secitons_. Príklad z konfigurácie sekcií pre aplikáciu sieťových štatistík s interným pomenovaním =netstat= je nasledovný: 

```javascript
"sections": [
            {
                "name": "history",
                "title": "History",
                "modules": {
                    "wall": [
                        "BandwidthHistory",
                        "BandwidthHistoryPackets",
                        "FlowHistory"
                    ],
                    "summary": [
                        "TransferredData",
                        "TransferredPackets",
                        "AverageDataSpeed",
                        "AveragePacketSpeed",
                        "MaximumSpeed",
                        "NumberOfFlows"
                    ],
                    "navigation": [
                        "exporters"
                    ]
                }
            },
            ... ďalšie sekcie ...
        ] 
```

V tejto konfigurácií je vidieť, že jednotlivé sekcie sú definované ako objekty v poli, kde ich interné meno je definované v hodnotu kľúča `name`, názov zobrazený v rozhraní hodnotou kľúča `title`. Okrem toho je možné definovať kľúč `path`, ktorý bude použitý na reprezentáciu sekcie v rámci URL adresy (ak definovaný nie je, časť URL identifikujúca sekciu bude rovná názvu `name`).

Zoznam modulov sekcie je definovaný pod kľúčom `modules`. Je to objekt, v rámci ktorého sú podporované hodnoty `wall`, `summary` a `navigation`, ktoré zodpovedajú častiam rozhrania sekcie. každý z týchto kľúčov musí byť definovaný ako pole so zoznamom modulov. Názov modulu predstavuje názov triedy modulu priradenej aplikácií, pre ktorú je vytváraný daný konfiguračný súbor.
Polia `wall` a `summary` môžu obsahovať aj vnorené polia, ktorými budú zoskupené viaceré mená modulov. To sa odzrkadlí vo vytváranom rozhraní spojením daných modulov do jedného bloku, v prípade časti `wall`, teda hlavného panelu, to znamená aj umiestnenie týchto modulov do jednej "tehly" pluginu `brickLayout`.

Pre umožnenie konfigurácie šírky modulov v časti `wall` je umožnená dodatočná konfigurácia. Na miesto hodnoty poľa v časti `wall` je možné uviesť objekt s kľúčmi `modules`, ktorý obsahuje moduly, ktoré majú byť umiestnené v "tehle" a `brickSizes` - pole veľkostí "tehly" pri rôznych rozloženiach vytvorených pluginom `brickLayout`. Zapísaním nasledovnej konfigurácie: 

```javascript
..
"wall": [
	{
		"modules": ["BandwidthHistory"],
		"brickSizes": ["wide-3", "narrow-2"]
	}
],
... 
```

sa docieli umiestnenie jedného modulu do "tehly", pričom táto tehla by bola široká 3 stĺpce v rozložení definovanom pre `brickLayout` zásuvný modul s názvom `wide` a šírku 2 stĺpce v rozložení s názvom `narrow`. Neuvedenie šírky "tehly" pre určité (alebo žiadne) rozloženie znamená použitie defaultnej šírky modulu, ktorú je možné nastaviť v rámci vytváranie rozložení pluginu `brickLayout`.

Rozloženia sú definované v súbore [slaweb_app/config/environment.js](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_app/config/environment.js) a sú použité v rámci pohľadu konštruujúceho hlavný panel `slameter/views/wall`.


## Koštrukcia modulu
------------------

Konštrukcia modulov je implementovaná v triede trasy v [slaweb_app/app/routes/base-app/base-section.js](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_app/app/routes/base-app/base-section.js) za pomoci riadiča [slaweb_app/app/controllers/module-builder.js](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_app/app/controllers/module-builder.js).

Metóda `buildModules` v spomenutej trase vykonáva parsovanie vyššie opísanej konfigurácie načítanej zo servera. Pracuje na základe vyššie opísaných možností definícií zoznamu modulov a pre bližšie detaily je odporúčané pozrieť priamo komentovaný zdrojový kód tejto metódy. Táto metóda volá pre každý nájdený modul jeho konštrukciu za pomoci spomenutého riadiča `slameter/controllers/module-builder`.

Riadič `moduleBuilder` obsahuje hlavnú metódu `buildModule`, ktorá zostavuje modul nasledovným postupom:
   1. vyhľadaný je pohľad modulu nasledovným spôsobom:
      Predpokladajme zostavovanie modulu NumberOfFlows pre aplikáciu netstat. Hľadajú sa nasledovné JS moduly pohľadov:
      1. `view:$app.modules.NumberOfFlows` -> `slameter/views/netstat/modules/number-of-flows`
      1. `view:modules.NumberOfFlows` -> `slameter/views/modules/number-of-flows`
      1. `view:$app.baseModule` -> `slameter/views/netstat/base-module`
      1. `view:baseModule` -> `slameter/views/base-module`


      Prvý nájdený modul je použitý ako pohľad konštruovaného modulu.
   1. vyhľadaný je riadič modulu rovnakým spôsobom ako pohľad.
   1. Nájdený pohľad a riadič je inštanciovaný a referencia na riadič je nastavená v pohľade.

Šablóny, ktoré má modul obsahovať podľa schémy zobrazenej na obrázku _Šablóny bázového modulu_ vo [slameter_web/wikis/home](https://git.cnl.sk/monica/slameter_web/wikis/home) sú definované v JS module [slaweb_app/app/mixins/auto-module-templates.js](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_app/app/mixins/auto-module-templates.js), ktorý je použitý v module [slaweb_app/app/controllers/base-module.js](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_app/app/controllers/base-module.js). Od tohto riadiča by mali dediť všetky moduly, a prinajmenšom by mali použiť spomenutý mixin, aby boli šablóny automaticky pripojené k modulu.
