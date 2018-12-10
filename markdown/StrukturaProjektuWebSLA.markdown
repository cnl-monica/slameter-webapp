# Štruktúra projektu webovej aplikácie nástroja SLAmeter
--------------------

Pri využití koncepcie hrubého klienta vznikli vo webovej aplikácií dva projekty: projekt servera a klienta. Pri pohľade na štruktúru projektu webovej aplikácie vidíme tieto adresáre a súbory:


   *  _docs_ - adresár pre dokumentáciu generovanú zo zdrojových kódov
   *  **slaweb_api** - projekt webového servera
	   *  _configs_ - adresár so súbormi na konfiguráciu umiestnenia modulov v rozhraní webovej aplikácie
	   *  _core_ -- jadro webovej aplikácie. Tu sa nachádzajú jeho python moduly a tieto adresáre:
		   *  _framework_ - python balík obsahujúci triedy rámca pre tvorbu aplikácií s modulmi, akých príkladom je aplikácia _netstat_
		   *  _fixtures_ - inicializačné údaje pre databázu servera
		   *  _management_ - Django príkazy na spustenie projektu
	   *  _netstat_ - aplikácia sieťových štatistík
	   *  _slaweb_api_ - konfiguračné súbory Django projektu
	   *  _templates_ - šablóny upravujúce vzhľad generovaných django rozhraní, ako _Django admin_ a _Django REST Framework_
   *  **slaweb_app** - projekt webového klienta
	   *  _app_ - samotná aplikácia klienta
		   *  _components_ - komponenty klienta v zmysle komponentov aplikačného rámca Ember
		   *  _controllers_ - riadiče
		   *  _helpers_ - utility šablónového systému
		   *  _lib_ - knižničné triedy a funkcie pre klienta webovej aplikácie
		   *  _mixins_ - objekty pre rozširovanie tried definovanou funkcionalitou
		   *  _models_ - modely strany klienta
		   *  _routes_ - triedy _trás_
		   *  _styles_ - kaskádové štýly webového klienta v jazyku SASS
		   *  _templates_ - šablóny webového klienta v jazyku _Handlebars_
		   *  _views_ - pohľady aplikácie
		   *  _app.js_ - štartovací súbor Ember aplikácie
		   *  _index.html_ - jediný HTML súbor definujúci potrebné moduly jazyka !JavaScript, ktoré sa majú načítať do webovej stránky pre spustenie aplikácie
		   *  _router.js_ - smerovač Ember aplikácie
	   *  _config_ - súbory pre konfiguráciu aplikácie klienta. Obsahujú napríklad nastavenia adries servera, logovacie nastavenia rámca Ember, a iné inicializačné hodnoty,
	   *  _public_ - adresár obsahujúci súbory obrázkov alebo písem potrebných pre zobrazenie webových stránok aplikácie,
	   *  _tasks_ - úlohy spúšťača _Grunt_, ktorý slúži na predkompiláciu, zostavovanie a upravovanie súborov adresára _app_ do tvaru zrozumiteľného webovým prehliadačom,
	   *  _vendor_ - adresár pre načítanie knižníc pomocou utility _bower_.
		   *  __custom_plugins_ - knižnice vytvorené autorom práce
		   *  _loader.js_ - skript slúžiaci na načítavanie !JavaScript modulov počas behu aplikácie klienta
	   *  _bower.json_ - zoznam knižníc pod správou balíčkového nástoja pre web s názvom _bower_. Umožňuje jednoduché špecifikovanie potrebných knižníc, ako je rámec _Ember_, knižnica jQuery, Flot pre vykresľovanie grafických priebehov, a ďalších,
	   *  _Gruntfile.js_ - špecifikácia úloh pre spúšťač Grunt (http://gruntjs.com/)
	   *  _package.json_ - zoznam závislostí pre prostredie node.js, pod ktorým pracuje nástroj Grunt a balíčkový nástroj bower (http://bower.io/)
   *  **evaluator** - obsahuje zdrojové kódy vyhodnocujúcich procesov
	   *  acc_modules - obsahuje zdrojové kódy úloh aplikácie účtovania
	   *  app_modules - obsahuje zdrojové kódy úloh aplikácie aplikačných štatistík
	   *  celery.py - inicializačný súbor pre spustenie fronty úloh
	   *  email_generator.py - zdroj. kódy slúžiace na generovanie správ elektronickej pošty
	   *  evaluator.py - prepája webový server s frontou na vykonávanie úloh
	   *  mongo_client.py - súbor klienta pre databázu MongoDB, konfiguračné nastavenia pre MongoDB 
	   *  smtp_connection.py - súbor klienta pre SMTP server
	   *  smtpconfig.py - konfiguračné nastavenia SMTP klienta
   *  _dist.py_ - skript na prípravu distribučnej verzie projektu
   *  _LICENSE_ - licencia projektu
   *  _nginx.conf_ - konfiguračný súbor proxy servera nginx, ktorý je použitý pri nasadení projektu

Pre prácu na projekte je dôležité uviesť aj to, že klientská strana používajúca aplikačný rámec Ember bola skonštruovaná štartovacím balíčkom _ember-app-kit_.
Je potrebné oboznámiť sa aj s jeho dokumentáciou, najmä pre odlišnú mennú konvenciu, ktorá má významnú úlohu pri zostavovaní ako aj samotnej činnosti klientskej strany webovej aplikácie nástoja SLAmeter. Viď [http://iamstef.net/ember-app-kit/](iamstef.net/ember-app-kit/).

# Konfiguračné súbory webovej aplikácie nástroja SLAmeter
--------------------

   *  **slaweb_api/slaweb_api/settings/base.py**  - v dist. verzii tiež v umiestnení `server/slaweb_api/settings`, slúži na nastavenie konfiguračných nastavení webovej databázy a tiež na nastavenie úložiska výsledkov a sprostredkovateľa správ pre úlohovú frontu Celery (v našom prípade result backend a message broker tvorí Redis-server)
   *  **slaweb_api/evaluator/mongo_client.py**  - v dist. verzii tiež v umiestnení `server/evaluator/`, slúži na nastavenie konfiguračných nastavení databázy MongoDB, v ktorej sú uložené výsledky monitorovania ukladané zhromažďovačom.
   *  **slaweb_api/evaluator/smtpconfig.py**  - v dist. verzii tiež v umiestnení `server/evaluator/`, slúži na nastavenie konfiguračných nastavení SMTP servera a predvolených údajov v odosielaných správach v prípade podaplikácie účtovania vo webovej aplikácii.