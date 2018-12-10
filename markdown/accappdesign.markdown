# Návrh podaplikácii účtovania a aplikačných štatistík 
----------------------------

## Návrh v zhromažďovači 
----------------------

Prvým komponentom v ktorom sme vykonali menej rozsiahle ale potrebné zmeny je zhromažďovač  [JXColl](https://git.cnl.sk/monica/slameter_collector/wikis/jxcoll). V ňom boli
do procesu tvorby účtovacích záznamov pridané nové elementy. Medzi tieto elementy patria `sourceMacAddress`, `destinationMacAddress`, 
`applicationName`, `applicationId`. Ďalej bola vykonaných niekoľko menších úprav medzi ktoré patria:

   * Úprava hešovacej funkcie v procese tvorby účtovacích záznamov.
   * Zmena použitia elementov `octetTotalCount` na `octetDeltaCount` a tiež `packetTotalCount` na `packetDeltaCount` pri tvorbe účtovacích záznamov.

Princíp vytvárania účtovacích záznamov je zobrazený na Obrázku I.

![coll_svk](https://git.cnl.sk/uploads/monica/slameter_web/f74a759627/coll_svk.png)

Obrázok I: _Proces vytvárania účtovacích záznamov v programe JXColl_


## Návrh vyhodnocovacej časti
---------------------

Pre vyhodnocovanie údajov bolo zvolené použitie distribuovanej úlohovej fronty Celery, pričom [tu](accapparch) môžeme vidieť architektúru zameranú na tieto funkcie.
Pre potreby vyhodnocovania naších modulov vo webovej aplikácii nástroja SLAmeter boli vytvorené tieto úlohy vyhodnocovacích procesov:

   * Úloha pre porovnávanie spotreby údajov účtovacích entít - výsledky sú vo webovom rozhraní zobrazené prostredníctvom 2-stĺpcového grafu, kde 
     je zobrazené množstvo (odoslaných, prijatých) údajov pre tieto účtovacie entity.
   * Úloha fakturácie na základe kritérii - vyhodnotí údaje v databáze pre vybranú účtovaciu entitu a na základe jej kritérii vypočíta výsledky v procese fakturácie.
   * Úloha fakturácie založenej na 95-tom percentile - vyhodnotí údaje v databáze pre vybranú účtovaciu entitu metódou 95-teho percentilu na základe 
     zvoleného typu kalkulácie pre túto metódu. Vo webovom rozhraní sú dostupné výsledky v tabuľke a v grafe ktorý zobrazuje jednotlivé vzorky ktoré
     sa použili pri stanovení 95-teho percentilu.
   * Úloha fakturácie založenej na množstve prevádzky - vyhodnotí údaje v databáze pre vybranú účtovaciu entitu a vypočíta množstvo prenesených údajov v oboch 
     smeroch. Je to najjednoduchší typ fakturácie. 
   * Úloha vytvárania a odosielania faktúry - pre tri menované metódy účtovania vygeneruje alebo odošle faktúru vybranej účtovacej entity. Táto faktúra je odosielaná 
     na predvolený email ktorým sa používateľ prihlasuje, pokiaľ nie je stanovená špecifická emailová adresa. 
   * Úloha vyhodnotenia fakturačného plánu - podľa hodnôt vo fakturačnom pláne použije jednu z troch metód fakturácie a vytvorí faktúru ktorú odošle na email účtovacej entity,
     pre ktorý bol tento fakturačný plán vytvorený. Túto úlohu vykonáva plánovač v naplánovaných momentoch, ktoré sú definované pomocou CRON záznamov.
   * Úlohy modulov aplikačných štatistík - vyhodnotí údaje v databáze podľa vstupných parametrov (metóda modulu, zvolený interval). Táto úloha je všebecná úloha ktorú
     používajú všetky moduly aplikačných štatistík vo webovej aplikácii nástroja SLAmeter.
     aplikačných štatistík vo webovej aplikácii nástroja SLAmeter.


## Návrh vo webovej aplikácii
----------------

Pre potreby naších podaplikácii boli vytvorené dva typy modulov:

   *  Moduly pre vyhodnotenie údajov - tieto moduly komunikujú s vyhodnocovacími procesmi. Odosielajú požiadavky vyhodnocujúcim procesom (vykonanie úloh) a čakajú na
       výsledky týchto úloh (časovo náročné úlohy).
   *  Moduly pre manipuláciu s objektmi v databáze - v tomto prípade server webovej aplikácie priamo pracuje s objektami, ktoré sú uložené v databáze.

Zjednodušená architektúra vyhodnocovacej a webovej časti navrhovaného riešenia, spolu s opisovanými typmi modulov je zobrazená na Obrázku II.

![websla_appacc](https://git.cnl.sk/uploads/monica/slameter_web/b9c7c9dc7a/websla_appacc.png)

Obrázok II: _Zjednodušená architektúra vyhodnocovacej a webovej časti navrhovaného riešenia_

Pre vytvorenie faktúry vo webovom klientovi boli použité JavaScript knižnice `Filesaver.js` a `Blob.js`.

