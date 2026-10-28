read_me_brewery_app

Dieses Projekt dient dazu mit JSON in Mongo-DB und in Oracle zu experimentieren.
Gleichzeitig soll mit KI eine App für die Brauerei schrittweise aufgebaut werden.
Damit das Resultat an Konferenzen genutzt werden kann, wird bewusst schrittweise gearbeitet.

Erster Versuch: App mit ChatGPT: nano-brewery-app_schrottvonKI
Zweiter Versuch mit ChatGPT und dann Copilot: beer-app

Erfahrungen daraus: ChatGPT liefert zu vielen unvollständigen Code.
Copilot generiert den Code direkt in VS Code, der auch läuft.

28.10.26
Mit diesen Erfahrungen kann neu gestartet werden.
Hier der Plan:
Die Versionen V01 bis Vnn zeigen schrittweise, wie die App entwickelt und erweitert wird.
Je Version gibt es zwei Ausführungen:
Vnn_M: Daten sind in Mongo
Vnn_O: Daten sind in Oracle
V01: Eine erste Version nutzt einfache Dokumente.
     Daten sind in beer_step1
     Diese sollen in der App dargestellt und gesucht werden können.
     
V01 mit Mongo klappt: http://localhost:5173/
Nun sind die Daten in Oracle in den User BREW_APP geladen werden.
V01O wird nun erstellt und mit Copilot so umgebaut, dass die Daten aus Oracle gelesen werden.


