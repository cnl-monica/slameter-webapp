# Podaplikácie účtovania a aplikačných štatistík vo webovej aplikácii 
---------------------------------------------------------------------------

  * **Stav verzie**:  vyvíjaná 
  * **Autor**:  Matúš Husovský
  * **Licencia**: GNU GPLv3
  * [Používateťská príručka PDF](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_pp.pdf)
  * [Systémová príručka PDF](https://git.cnl.sk/matus.husovsky/doc/raw/master/web_sp.pdf)

Moduly týchto podaplikácii boli implementované v obidvoch častiach webovej aplikácie (server, klient). Pre vyhodnocovanie údajov získaných pri
monitorovaní sieťovej prevádzky sa používajú vyhodnocovacie procesy (angl. Celery workers). Úlohy ktoré sa vykonávajú pre potreby týchto modulov
vo webovej aplikácii sú napísané v jazyku Python, rovnako ako časť servera webovej aplikácie. Tieto procesy sa spúšťajú ako skripty jazyka Python
ktoré bežia na pozadí. Ich spustenie je opísané v časti [InstalaciaWebSLA](https://git.cnl.sk/monica/slameter_web/wikis/InstalaciaWebSLA).



##  Popis činnosti 
----------------

Webový klient odosiela požiadavky v podobe REST služieb webovému serveru. Webový server ich po prijatí zaradí do fronty vykonávaných úloh. Následne jeden z vyhodnocovacích
procesov  vyberie požadovanú úlohu a vykoná ju. Výsledky sú späť odoslané do webového klienta v podobe odpovede volanej REST služby. Na vykonávanie týchto úloh bola použitá distribuovaná úlohová fronta Celery. Pre účely sprostredkovateľa správ (message broker) a pre účely úložiska výsledkov (result backend) bolo použité Redis úložisko, tiež nazývané Redis-server.

## Špecifikácia požiadavok
--------------

   * Modulárna architektúra
   * Aplikácia účtovania a fakturácie a tiež aplikácia aplikačných štatistík musia byť samostatné podaplikácie
   * Tieto aplikácie musia byť rozdelené do modulov, pre ktoré sú poskytované
   * Samostatné služby
   * Každý modul musí byť samostatný a nezávislý od iných modulov, s výnimkou modulu navigácie
   * Musí byť zabezpečené zadávanie požiadaviek z modulov a ich realizácia
   * Je potrebné vytvoriť programové riešenie na vyhodnocovanie údajov z databázy pre tieto moduly 

 
## Architektúra  implementácie podaplikácii účtovania a aplikačných štatistík 
----------------------
Táto architektúra je špecifikovaná  [tu...](accapparch)


## Návrh podaplikácii účtovania a aplikačných štatistík
----------------------
Návrh je špecifikovaný [tu...](accappdesign)
