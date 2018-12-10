# Inštalácia webovej aplikácie nástroja SLAmeter
----------------------------------------------------------

V nasledujúcom texte je opísaný postup pre prípravu prostredia na ďalší vývoj aplikácie a pre nasadenie webovej aplikácie na server.


# Príprava prostredia pre vývoj webovej aplikácie nástroja SLAmeter
----------------

## A. Požiadavky na technické prostriedky
--------------------

Pre vývoj webovej aplikácie je odporúčaná nasledovná hardvérová konfigurácia:

   * CPU Intel Pentium Core 2 Duo 2GHz a novšie
   * operačná pamäť 2GB
   * pevný disk s 1GB dostupnej kapacity
   * sieťová karta 100Mbit/s.


## B. Náväznosť na iné programové produkty
-----------------

Pre možnosť plnohodnotného vývoja webovej aplikácie nástroja SLAmeter je vhodné mať k dispozícií aj funkčné inštalácie ostatných častí tohto nástroja.

Zároveň nasledujúci návod predpokladá tieto prerekvizity:
* 64bit verzia Ubuntu 14.04 LTS, alebo novšia,
* aktualizovaný systém,
* nainštalovaný Python v2.7.x
* pripojenie k internetu.

## C. Programové prostredie pre vývoj
---------------------------------

Projekt webovej aplikácie pozostáva zo servera v technológií Python a JavaScript klienta.
Štruktúra projektu už bola v tejto príručke uvedená.

Postup prípravy prostredia pre vývoj je nasledovný:

**Krok 1 - Inštalácia vyžadovaných softvérových balíkov**
```bash
sudo apt-get install python-pip postgresql-9.3 git libpq-dev python-dev python-software-properties redis-server 
```

**Krok 2 -  Nastavenie prístupu k databáze**
```bash
sudo -u postgres psql postgres
```
V príkazovom riadku postgresql zadajte:
```bash
\password postgres
\q
```
Po prvom príkaze budete vyzvaný k zadaniu nového hesla pre používateľa _postgres_. (Príklad hesla: databaza)

**Krok 3 -  Vytvorenie používateľa pre prístup k databáze webového servera**
```bash
sudo -u postgres createuser -D -A -P slawebuser 
```

Po vyzvaní zadajte heslo `slaweb`. 
```bash
sudo -u postgres createdb slaweb -O slawebuser
```

**Krok 4 -  pridanie potrebného repozitára**

```bash
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update 
```

**Krok 5 -  Inštalácia prostredia node.js a ruby**

```bash
sudo apt-get install nodejs ruby1.9.1-dev ruby
```
V prípade, že po nainštalovaní týchto balíkov nebude v systéme rozpoznávaný príkaz `gem`, vykonajte nasledovný príkaz: 
```bash
sudo apt-get install rubygems
```

**Krok 6 -  Inštalácia potrebných node.js globálnych balíčkov**

```bash
sudo npm install grunt-cli bower -g 
```

**Krok 7 -  Inštalácia potrebných ruby balíčkov**

```bash
sudo gem install sass compass 
```

**Krok 8 -  Získanie vývojovej verzie webovej aplikácie nástroja SLAmeter**

Nasledovný postup je pre získanie aktuálnej vývojovej verzie webovej aplikácie z GIT repozitára:
```bash
git clone https://git.cnl.sk/monica/slameter_web.git -c http.sslVerify=false
```
Týmto budú do aktuálneho adresára stiahnuté obe časti webovej aplikácie.
   

**Krok 9 - Inštalácia závislostí servera**

```bash
cd slameter_web/slaweb_api/
sudo pip install -r requirements.txt 
```

**Krok 10 -  Inicializácia databázy**

```bash
python manage.py syncdb 
```
Budete vyzvaní na vytvorenie používateľa, ktorý bude potrebný pre prihlásenie do aplikácie.
Zadajte požadovanú emailovú adresu a heslo (napr. admin@slameter.sk a heslo monica).

**Krok 11 -  Nainštalujte závislosti klienta**

```bash
cd ../slaweb_app
sudo npm install
bower install 
```

Pri používaní IDE, ktoré poskytuje inšpekciu zdrojových kódov, je potrebné skontrolovať podporu pre pripravovanú verziu jazyka JavaScript s názvom _ECMAScript 6_, keďže využívanie syntaxe pre import a export modulov v projekte inak môže viesť k zobrazovaniu falošných syntaktických chýb.


## D. Spúšťanie projektu
---------------------

Pre spustenie servera zadajte nasledovný príkaz v adresári `slaweb_api`: 

```bash
python manage.py runserver_socketio
```

Tento príkaz je potrebné nakonfigurovať aj vo vývojových prostrediach, ktoré podporujú aplikačný rámec Django, pretože štandardný príkaz `runserver` nepodporuje funkcionalitu vyžadovanú protokolom WebSocket.
Pre spustenie klienta zadajte príkaz v adresári `slaweb_app`: 

```bash
grunt server 
```

Server budete mať následne dostupný na adrese `http://localhost:8000/` a súbory klienta budú poskytované z adresy `http://localhost:9000/`.
Obe projekty, takto spustené vo vývojovom režime, sú nastavené na sledovanie zmien v zdrojových súboroch. Pri detekovaní zmien budú tieto zmeny načítané do bežiaceho programu. 

Upozornenie pre prácu s klientom: pri detekcii zmazania súboru nástroj grunt často neodstráni tento súbor zo spustenej verzie programu, čo môže viesť k neočakávanému správaniu. V takom prípade príkaz reštartujte.

## E. Spúšťanie vyhodnocovacích procesov webovej aplikácie nástroja SLAmeter
-----------------------

Tieto procesy sú potrebné pre funkcie účtovania a aplikačného monitorovania vo webovej aplikácii nástroja SLAmeter (podaplikácie accounting, applications).
V prípade vývoja spúšťame Celery procesy z adresára `slaweb_api/` pomocou príkazu:  

```bash
celery -A evaluator  worker --loglevel=info
```

V prípade vývoja spúšťame Celery Beat plánovač z adresára `slaweb_api/` pomocou príkazu (len pre potreby fakturačných plánov): 

```bash
celery -A evaluator beat -S djcelery.schedulers.DatabaseScheduler
```

Odporúčania a konfigurácia v prípade distribučnej verzie: 

* Ak sú tieto vyhodnocovacie procesy a webová aplikácia nasadené na rôznych uzloch, je potrebné nastaviť konfiguráciu týchto uzlov v umiestnení `server/slaweb_api/settings/base.py` pre rovnaký Redis-server (sprostredkovateľ správ v angl. message broker, úložisko výsledkov v angl. result backend) a rovnakú webovú databázu, aká je nastavená vo webovej aplikácii. 

* Pre spustenie týchto procesov je potrebné mať na hostiteľskom zariadení stiahnuté súbory servera webovej aplikácie a taktiež je potrebné mať nainštalované závislosti servera.


## F. Vytvorenie distribučnej verzie projektu
------------------

Pre vytvorenie distribučnej verzie webovej aplikácie bol vytvorený skript `dist.py` umiestnený v koreňovom adresári projektu. Jeho argumentom má byť cieľový adresár, kam chcete vytvoriť distribučnú verziu. 

```bash
python dist.py ~/slameter_web_dist 
```

# Nasadenie distribučnej verzie webovej aplikácie
------------------

Webová aplikácia nástroja SLAmeter sa nasadzuje na webový server _nginx_, ktorý slúži ako reverzný proxy server pre poskytované webové služby a klientskú aplikáciu poskytuje ako statické súbory.


## A. Požiadavky na technické prostriedky
--------------------

Pre používanie webovej aplikácie nástroja SLAmeter na serveri je požadovaná nasledovná hardvérová konfigurácia:
* Minimálna hardvérová konfigurácia
      * CPU Intel Pentium IV 1GHz, alebo ekvivalent,
      * operačná pamäť o veľkosti 512MB,
      * pevný disk s dostupnou kapacitou 100MB,
      * sieťová karta 100Mbit/s.
* Odporúčaná hardvérová konfigurácia:
      * CPU Intel Pentium IV 2GHz, alebo ekvivalent,
      * operačná pamäť 2GB,
      * pevný disk s dostupnou kapacitou 200MB,
      * sieťová karta 1Gbit/s.

## B. Požiadavky na programové prostriedky
-----------------------

Program webovej aplikácie pre svoju funkčnosť požaduje nasledovné programové prerekvizity:
* operačný systém, ktorý podporuje Python Virtual Machine a webový server nginx,
* ostatné časti nástroja SLAmeter - [exportéry](https://git.cnl.sk/monica/slameter_exporter/wikis/home), [kolektor](https://git.cnl.sk/monica/slameter_collector/wikis/home), úložisko, [vyhodnocovač](https://git.cnl.sk/monica/slameter_evaluator/wikis/home), ktoré sú potrebné pre získavanie informácií zo sieťovej prevádzky.
* inštalácia bola testovaná v systéme Ubuntu 14.04 LTS, je však možné použiť inú linuxovú distribúciu avšak so zohľadnením potrebných závislostí

## C. Inštalácia webovej aplikácie nástroja SLAmeter
------------------------

Nasledujúci popis inštalácie je určený pre operačný systém Ubuntu Server 14.04 LTS. Popisuje inštaláciu distribučnej verzie webovej aplikácie.

Postup nasadenia:

**Krok 1 - Pridanie repozitára pre aktuálne verzie serveru _nginx_ a aktualizácia systému**

```bash
sudo add-apt-repository ppa:nginx/stable
sudo apt-get update
sudo apt-get upgrade %ENDCODE% %BR%
```

**Krok 2 - Inštalácia požadovaných softvérových balíkov**

```bash
sudo apt-get install python-pip postgresql-9.3 libpq-dev python-dev nginx 
```

**Krok 3 - Nastavenie prístupu k PostgreSQL databáze**

```bash
sudo -u postgres psql postgres
```
Nasledovný príkaz slúži na vytvorenie hesla používateľa _postgres_. Po vyzvaní zadajte zvolené heslo. 

```bash
\password postgres
\q 
```

**Krok 4 - Vytvorenie používateľa a databázy pre API webový server**

Vytvorte používateľa v PostgreSQL. Pri žiadosti zvoľte heslo pre používateľa, alebo zadajte východzie heslo _slaweb_. 

```bash
sudo -u postgres createuser -D -A -P slawebuser 
```

Vytvorenie databázy s novým používateľom ako vlastníkom: 

```bash
sudo -u postgres createdb slaweb -O slawebuser 
```

**Krok 5 - Príprava distribučnej verzie súborov webovej aplikácie nástroja SLAmeter**

Súbory distribučnej verzie programu tvoria archív `slameter_web_1.1.tar.bz2`. Tento archív môžeme stiahnúť priamo z GIT-u príkazom:

```bash
wget https://git.cnl.sk/monica/slameter_web/raw/master/production/slameter_web_1.1.tar --no-check-certificate
```

V prípade potreby je možné vytvoriť distribučnú verziu aj z vývojovej vetvy webovej aplikácie, ktorá je dostupná prostredníctvom príkazu: 

```bash
git clone https://git.cnl.sk/monica/slameter_web.git -c http.sslVerify=false 
```

V takomto prípade ale je potrebné vykonať úplnú inštaláciu programových závislostí a vygenerovať distribučnú verziu. Tento proces je opísaný [tu](https://git.cnl.sk/monica/slameter_web/wikis/InstalaciaWebSLA#f-vytvorenie-distribu-nej-verzie-projektu).
   
**Krok 6 - Rozbalenie archívu a umiestnenie súborov distribučnej verzie**

Súbory distribučnej verzie programu rozbaľte a umiestnite do zvoleného adresára, napríklad: `/var/www/slameter_web` a prejdite do tohto adresára. Tieto operácie vykonáme nasledovne:  

```bash
sudo mkdir /var/www
sudo tar -xvf slameter_web_1.1.tar -C /var/www
cd /var/www/slameter_web
```

**Krok 7 - Generovanie SSL certifikátu**

Pre potreby využitia HTTPS protokolu na komunikáciu s webovým serverom je potrebný súbor s kľúčom a certifikátom. Pre vytvorenie samo-podpísaného certifikátu je postup nasledovný: 

```bash
sudo openssl genrsa -des3 -out slameter.key 2048
sudo openssl req -new -key slameter.key -out slameter.csr

sudo cp -v slameter.{key,original}
sudo openssl rsa -in slameter.original -out slameter.key
sudo rm -v slameter.original

sudo openssl x509 -req -days 365 -in slameter.csr -signkey slameter.key -out slameter.crt 
```

Jednotlivé príkazy môžu vyžadovať zadanie dodatočných informácií. Postupujte podľa pokynov na obrazovke. Tieto súbory by mali byť umiestnené v adresári `slameter_web` vytvorenom v predchádzajúcom kroku.

**Krok 8 - Úprava nginx konfigurácie**

V súboroch distribučnej verzie sa nachádza súbor `nginx.conf`. Ak ste používali iné názvy adresárov ako tie uvedené v tomto návode, bude potrebné ich v tomto konfiguračnom súbore patrične upraviť. Potrebné je prispôsobiť minimálne tieto direktívy: 

* static alias - statické súbory servera (Django admin rozhrania)
* assets alias - aplikácia klienta
* server_name - meno servera pre HTTP a HTTPS server.

**Krok 9 - Konfigurácia aplikačného rámca Django**

V súbore `server/slaweb_api/settings/production.py` je potrebné od do zoznamu adries v premennej `ALLOWED_HOSTS` pridať mená servera, na ktorých mu bude umožnené prijímať požiadavky. 

```bash
ALLOWED_HOSTS=['127.0.0.1', 'localhost', '<úplné meno servera>'] 
```
      
Príklad -> Virtuálny server monica s ip 147.232.241.142 a DNS záznamom monica-mid.monica.cnl.tuke.sk 

_ALLOWED_HOSTS=['127.0.0.1', 'localhost', '147.232.241.142', 'monica-mid.monica.cnl.tuke.sk']_
   
**Krok 10 - Inštalácia Python balíčkov servera** 

```bash
cd /var/www/slameter_web/server/
sudo pip install -r requirements.txt  
```

**Krok 11 - Inicializácia databázy servera**

```bash
cd /var/www/slameter_web/server/
python manage.py syncdb
```

Skript si vyžiada vytvorenie _superpoužívateľa_. Zadajte požadovanú emailovú adresu a heslo (napr. admin@slameter.sk a heslo monica).

**Krok 12 - Vytvorenie adresárov pre logovacie súbory**

```bash
sudo mkdir -p /var/log/slameter_web/ /var/log/celery/
```

**Krok 13 - Spustenie servera**

```bash
sudo nginx -s quit
sudo nginx -c /var/www/slameter_web/nginx.conf
sudo gunicorn -c /var/www/slameter_web/server/gunicorn.py slaweb_api.wsgi:application 
```

V prípade chyby môže byť potrebné namiesto príkazu  `sudo nginx -s quit` použit príkaz: `service nginx stop`

**Krok 14 - Spustenie vyhodnocovacích procesov webovej aplikácie nástroja SLAmeter (pre potreby aplikácii účtovania a aplikačného monitorovania)**

Tento príkaz musí byť spúšťaný bez superpoužívateľských práv:
* Spustenie vyhodnocovacieho procesu (Celery worker-a): 

```bash
nohup celery -A evaluator --workdir=/var/www/slameter_web/server/ worker &
```
* Spustenie plánovača (Celery beat scheduler) - len pre potreby používania fakturačných plánov:  

```bash
sudo nohup celery -A evaluator --workdir=/var/www/slameter_web/server/ beat -S djcelery.schedulers.DatabaseScheduler --logfile=/var/log/celery/beat.log &
```

V tomto stave by mala byť webová aplikácia nástroja SLAmeter prístupná na adrese inštalovaného servera.