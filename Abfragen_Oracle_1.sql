/* Daten lesen: alle Daten */
SELECT * 
FROM user_tables;

SELECT *
FROM beer_v01;

/* Daten einfügen */
INSERT INTO beer_v01
VALUES (7, 
 '{
    name: "Double CC IPA",
    style: "IPA",
    abv: 6.8
  }');

/* Daten lesen: style = IPA */
SELECT JSON_VALUE(data, '$.name')
FROM beer_v01
WHERE JSON_VALUE(data, '$.style') = 'IPA‘;

SELECT b.data.name
FROM beer_v01 b
WHERE b.data.style = 'IPA';

/* Daten lesen: style beinhaltet Ale */
SELECT JSON_VALUE(data, '$.name'), JSON_VALUE(data, '$.style')
FROM beer_v01
WHERE JSON_VALUE(data, '$.style') LIKE '%Ale%‘;


SELECT b.data.name, b.data.style
FROM beer_v01 b
WHERE b.data.style LIKE '%Ale%';

/* Daten lesen: Schnitt und Maximum von abv der IPA  */
SELECT 
    b.data.style, 
    avg(b.data.abv) avg_abv, 
    max(b.data.abv) max_abv
FROM beer_v01 b
WHERE b.data.style = 'IPA'
GROUP BY b.data.style;
