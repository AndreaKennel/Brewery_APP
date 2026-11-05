/* Daten lesen: alle Daten */
SELECT *
FROM beer_v02;

/* Daten lesen: welche Biere verweden Cascade als Hopfen */
SELECT b.data.name, b.data.style, b.data.recipe.hops.name
FROM beer_v02 b;
WHERE b.data.recipe.hops.name = 'Cascade';

SELECT b.data.name, b.data.style, b.data.recipe.hops.name
FROM beer_v02 b
WHERE JSON_EXISTS(
    b.data.recipe.hops,
    '$[*]?(@.name == "Cascade")'
);

SELECT 
    b.data.name,
    b.data.style,
    b.data.recipe.hops.name,
    h.hop_name
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$.recipe.hops[*]'
         COLUMNS (
             hop_name VARCHAR2(100) PATH '$.name'
         )
     ) h;

SELECT DISTINCT
    b.data.name,
    b.data.style
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$.recipe.hops[*]'
         COLUMNS (
             hop_name VARCHAR2(100) PATH '$.name'
         )
     ) h
WHERE h.hop_name = 'Cascade';

/* Daten lesen: Gesamte Malzmenge je Bier */
SELECT
    b.data.name,
    m.name malt_name,
    m.amountKg amountKg
FROM beer_v02v b,
     JSON_TABLE(
         b.data,
         '$.recipe.malts[*]'
         COLUMNS (
             amountKg NUMBER PATH '$.amountKg',
             name VARCHAR2(100) PATH '$.name'
         )
     ) m;

SELECT
    b.data.name,
    SUM(m.amountKg) totalMaltKg
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$.recipe.malts[*]'
         COLUMNS (
             amountKg NUMBER PATH '$.amountKg'
         )
     ) m
GROUP BY b.data.name;

/* Daten lesen: Anzahl Malzsorten je Bier */

SELECT
    JSON_VALUE(data, '$.name') name,
    JSON_VALUE(data, '$.recipe.malts.size()') anzahl_malze
FROM beer_v02;

SELECT
    b.data.name,
    JSON_VALUE(data, '$.recipe.malts.size()') AS anzahl_malze
FROM beer_v02 b;

SELECT
    jt.name,
    COUNT(DISTINCT jt.malz_name) AS verschiedene_malze
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$'
         COLUMNS (
             name VARCHAR2(100) PATH '$.name',
             NESTED PATH '$.recipe.malts[*]'
             COLUMNS (
                 malz_name VARCHAR2(100) PATH '$.name'
             )
         )
     ) jt
GROUP BY jt.name;

SELECT
    jt.*
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$'
         COLUMNS (
             name VARCHAR2(100) PATH '$.name',
             NESTED PATH '$.recipe.malts[*]'
             COLUMNS (
                 malz_name VARCHAR2(100) PATH '$.name'
             )
         )
     ) jt;

SELECT
    jt.*
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$'
         COLUMNS (
             name VARCHAR2(100) PATH '$.name',
             NESTED PATH '$.recipe.malts[*]'
             COLUMNS (
                 malz_name VARCHAR2(100) PATH '$.name'
             ),
             NESTED PATH '$.recipe.hops[*]'
             COLUMNS (
                 hope_name VARCHAR2(100) PATH '$.name'
             )
         )
     ) jt;

SELECT
    jt.name,
    COUNT(DISTINCT jt.malz_name) AS verschiedene_malze,
    COUNT(DISTINCT jt.hope_name) AS verschiedene_hopfen
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$'
         COLUMNS (
             name VARCHAR2(100) PATH '$.name',
             NESTED PATH '$.recipe.malts[*]'
             COLUMNS (
                 malz_name VARCHAR2(100) PATH '$.name'
             ),
             NESTED PATH '$.recipe.hops[*]'
             COLUMNS (
                 hope_name VARCHAR2(100) PATH '$.name'
             )
         )
     ) jt
GROUP BY jt.name;

/* Daten lesen: Wie viel Malz benötige ich für alle IPA?  */
SELECT
    jt.malz_name, sum(jt.malz_amountKg) gesamtMengeKg
FROM beer_v02 b,
     JSON_TABLE(
         b.data,
         '$'
         COLUMNS (
             name VARCHAR2(100) PATH '$.name',
             NESTED PATH '$.recipe.malts[*]'
             COLUMNS (
                 malz_name VARCHAR2(100) PATH '$.name',
                 malz_amountKg NUMBER PATH '$.amountKg'
             )
         )
     ) jt
WHERE b.data.style = 'IPA'
GROUP BY jt.malz_name
ORDER BY gesamtMengeKg desc;

