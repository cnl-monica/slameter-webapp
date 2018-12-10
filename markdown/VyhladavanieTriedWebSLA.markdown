# Vyhľadávanie JavaScript tried a modulov v klientovi webovej aplikácie
-------------------------

V klientovi webovej aplikácie je dôležitý systém vkladania závislostí (dependency injection), ktorý bol oproti klasickej Ember implementácií mierne modifikovaný.

Webový klient používa modulárny systém z pripravovanej verzie jazyka JavaScript so štandardným označením ECMAScript 6, ktorý sa s použitím kompilátora transformuje do podoby podporovanej súčasnými verziami webových prehliadačov. Pri kompilácií je názov súboru, v ktorom sa modul nachádza, použitý ako názov modulu. Vzhľadom na proces vyhľadávania mien v aplikačnom rámci Ember, je potrebné pri zvolenom modulárnom systéme umiestňovať každú triedu implementovanú pomocou základných tried, ako `Ember.View`, `Ember.Controller`, `Ember.Route` a ďalších, do samostatných súborov. Hľadanie Ember mena (ktoré má vo všeobecnosti tvar `typ:nazov`) `route:myApp.section` tak znamená hľadanie JavaScript modulu s názvom `routes/my-app/section` a teda aj súboru `routes/my-app/section.js`.

Toľko k štandardnému vyhľadávaniu JavaScript modulov. Pre spôsob vyhľadávania, ktorý v prípade neúspechu pokračuje vo vyhľadávaní bázových komponentov je navrhnutý nižšie opísaný postup.

Definícia mien, ktoré Ember využíva interne v tvare `typ:nazov`, je rozšírená o premenné `$app` a `$section`, ktoré budú predstavovať názov aktívnej aplikácie, respektíve sekcie, ktorú má používateľ v danom čase zobrrazenú. Z toho vyplýva, že tieto premenné sú použiteľné len v rámci týchto aplikácií a sekcií a mimo nich ich použitie spôsobí výnimku. 

Predpokladajme, že sa vyhľadáva meno `controller:$app.$section` a klient je v stave, v ktorom zobrazuje aplikáciu `sampleApp` a sekciu `firstSection`.
Bude sa kontrolovať existencia nasledovných JavaScript modulov v uvedenom poradí:
   1. `controllers/sample-app/first-section` - konkrétna sekcia v konkrétnej aplikácií.
   1. `controllers/sample-app/base-section` - implementácia pre všetky sekcie konkrétnej aplikácie.
   1. `controllers/base-app/base-section` - bázová sekcia poskytnutá štandardnou implementáciou architektúry.
   1. `controllers/base-section` - bázová trieda mimo aplikácie. Predstavuje posledný krok vyhľadávania so štandardným Ember menom, ak sa nejedná o objekt patriaci určitej sekcii.

Vo všeobecnosti je tento proces znázornený na nižšie uvedenom obrázku.Po poslednom vyhľadávaní už ďalšiu kontrolu nie je potrebné vykonávať - JS modul sa buď našiel a teda bude vrátený vyhľadávacou metódou do programu, alebo nájdený nebol a táto situácia bude vyhodnotená v kontexte volajúcej metódy.


![ember-lookup](https://git.cnl.sk/uploads/monica/slameter_web/cbe0da20e7/ember-lookup.png)
