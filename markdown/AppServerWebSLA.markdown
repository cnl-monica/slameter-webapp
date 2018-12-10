# Vytvorenie aplikácie s modulmi na strane servera webovej aplikácie
-------------------------

Pre vytvorenie novej aplikácie je potrebné dodržať určitý sled krokov. V nasledujúcom bude ako príklad použitá aplikácia sieťových štatistík s interným názvom `netstat`.

Postup pri vytváraní aplikácie na serveri je nasledovný:

   * Vedľa balíka `core` vytvorte python balík s názvom, ktorý ste zvolili pre interný názov vytváranej aplikácie - v našom prípade to bude `netstat`.
   * Registrujte aplikáciu do premennej `SLAMETER_WEB_APPS` v súbore s Django nastaveniami [slaweb_api/settings/base.py](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_api/slaweb_api/settings/base.py).
   * Vytvorte inštanciu aplikácie priamo z triedy `BaseApp`, alebo jej podtriedy.
      Vhodným miestom pre vytvorenie tejto inštancie je súbor `__init__.py`, ktorý sa musí nachádzať v novovytvorenom python balíku vytváranej aplikácie netstat/__init__.py, ktorý je dostupný [tu](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_api/netstat/__init__.py): 

```python
from core.framework.base import BaseApp

netstat = BaseApp(name="netstat", title="Network Statistics")

# je tu potrebne importovat vsetky python moduly
# obsahujuce moduly tejto aplikacie
import modules

```

Potreba vytvorenia inštancie aplikácie v tomto súbore je vzhľadom na to, že tento súbor je Djangom automaticky importovaný pri spustení servera, keďže daná aplikácia (`netstat`) je registrovaná ako Django aplikácia. Takisto z toho dôvodu je tu potrebný import všetkých Python modulov, ktoré obsahujú moduly nástroja SLAmeter. Je ich totiž potrebné registrovať s vytvorenou aplikáciou.
   * V balíku aplikácie vytvorte python modul [api.py](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_api/netstat/api.py). Tento súbor musí obsahovať premennú `app_router` a `urlpatterns`, ako to je v nasledovnom príklade: 

```python
app_router = AppRouter(netstat, SLAmeterAppView)
app_router.register(r'modules', views.NetstatModuleViewSet, base_name='module')

urlpatterns = patterns('',
    url(r'^netstat/', include(app_router.urls))
) 
```

   * V adresári `configs` vytvorte json súbor s názvom aplikácie. Obsah súboru musí byť v korektnom JSON formáte.
   * Samotné moduly aplikácie sa môžu nachádzať napríklad v súbore [modules.py](https://git.cnl.sk/monica/slameter_web/blob/master/slaweb_api/netstat/modules.py), alebo v akomkoľvek inom súbore patriacom vytváranej aplikácie, pokiaľ bude tento súbor importovaný v rámci súboru `__init__.py`. Samotné moduly majú byť vytvárané ako triedy, s tým, že ich je potrebné registrovať s aplikáciou pomocou pripraveného dekorátora inštancie aplikácie:

```python
@netstat.module
class BandwidthHistory(DefaultNetstatModule):
    title = 'Bandwidth History'
    remote_name = 'BandwidthHistoryTrend' 
```

Dekorátor `@netstat.module`, kde `netstat` je názov vytváranej aplikácie, priradí túto triedu do zoznamu modulov aplikácie.

Budete potrebovať aj pohľad a serializér, ktoré poskytnú klientovi informácie o module v podobe REST webových služieb. Aj v prípade použitia protokolu !WebSocket na získavanie *údajov* modulu v klientovi, aplikácia a zoznam jej modulov musí byť získaná pomocou REST služieb. Predpokladá sa aj použitie doplnkových Django modelov, ktoré budú dopĺňať aplikáciu s modulmi o ďalšie informácie. Tieto modely budú taktiež sprístupnené cez REST služby.