# Architektúra implementácie podaplikácii účtovania a aplikačných štatistík 
--------------------

Pre potreby týchto podaplikácii bola navrhnutá táto architektúra v rámci nástroja SLAmeter.

![schema_wiki](https://git.cnl.sk/uploads/monica/slameter_web/eccccaf709/schema_wiki.png)

Obrázok I: _Zjednodušená architektúra webovej aplikácie a vyhodnocujúcich procesov_

Skladá sa z týchto častí:

   * **Klient webovej aplikácie** - aplikácia vytvorená pomocou MVC JavaScript aplikačného rámca Ember. Je to časť nástroja ktorá slúži na prezentáciu výsledkov, 
     získaných na základe vyhodnocovania údajov  o monitorovanej prevádzke. 
   * **Server webovej aplikácie** - aplikácia vytvorená pomocou aplikačného rámca Django. Je to časť nástroja ktorá poskytuje údaje klientovi webovej aplikácie 
     prostredníctvom REST služieb. Vyhodnotené údaje získava od komponentov nástroja SLAmeter (Celery workers,  [Vyhodnocovač v3](https://git.cnl.sk/monica/slameter_evaluator/wikis/home)).
   * **Redis úložisko (server, cache)** - v našom návrhu plní úlohy úložiska výsledkov a sprostredkovateľa správ pre distribuovanú úlohovú frontu Celery.
   * **Vyhodnocujúce procesy (Celery workers)** - vyhodnocujú údaje v databáze na základe definovaných úloh, ktoré sú napísane v programovacom jazyku Python. 
   * **Celery beat plánovač** - špeciálny proces pre vykonávanie úloh vo vyhodnocujúcich procesoch na základe periodických intervalov alebo záznamov CRON. 
   * **Webová databáza** - použitá pre potreby webovej aplikácie. V tejto databáze sú uložené špecifické údaje o používateľoch (login-y, heslá ...) a údaje potrebné pre beh
     naších podaplikácii (účtovacie entity, fakturačné plány, mapovania modulov aplikačných štatistík ...). 
   * **Databáza zhromažďovača** - v tejto databáze je uložené veľké množstvo údajov. Tieto údaje boli zozbierané prostredníctvom zhromažďovača pri monitorovaní sieťovej prevádzky. 
