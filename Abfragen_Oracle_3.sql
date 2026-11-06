/* Daten lesen: alle Daten */
SELECT *
FROM beer_dv;

/* Daten lesen: welche Biere verweden Cascade als Hopfen */
SELECT b.name, b.style, h.name
FROM 
    beer b JOIN 
    recipe r ON (b.beer_id = r.beer_id) JOIN 
    hop h ON (r.recipe_id = h.recipe_id)
WHERE h.name = 'Cascade';

/* Daten lesen: Gesamte Malzmenge je Bier */
SELECT b.name, sum(m.amount_kg)
FROM 
    beer b JOIN 
    recipe r ON (b.beer_id = r.beer_id) JOIN 
    malt m ON (r.recipe_id = m.recipe_id)
GROUP BY b.name;

/* Daten lesen: Anzahl Malzsorten je Bier */
SELECT b.name, count(m.malt_id)
FROM 
    beer b JOIN 
    recipe r ON (b.beer_id = r.beer_id) JOIN 
    malt m ON (r.recipe_id = m.recipe_id)
GROUP BY b.name;

/* Daten lesen: Anzahl verschiedene Malzsorten und Hopfen je Bier */
SELECT 
    b.name,
    m.anzahl anzahl_malz, m.verschiedene verschiedene_malz,
    h.anzahl anzahl_hopfen, h.verschiedene verschiedene_hopfen
FROM
    beer b JOIN 
    recipe r ON (b.beer_id = r.beer_id) JOIN 
    (SELECT recipe_id, count(*) anzahl, 
		count(distinct name) verschiedene
     FROM malt
     GROUP BY recipe_id) m ON (r.recipe_id = m.recipe_id) JOIN 
    (SELECT recipe_id, count(*) anzahl, 
    	count(distinct name) verschiedene
     FROM hop
     GROUP BY recipe_id) h ON (r.recipe_id = h.recipe_id);

/* Daten lesen: Wie viel Malz benötige ich für alle IPA?  */
SELECT b.name, sum(m.amount_kg) gesamtMengeKg
FROM 
    beer b JOIN 
    recipe r ON (b.beer_id = r.beer_id) JOIN 
    malt m ON (r.recipe_id = m.recipe_id)
GROUP BY b.name
ORDER BY gesamtMengeKg desc;
