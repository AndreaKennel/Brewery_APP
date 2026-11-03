/* Daten lesen: alle Daten */
SELECT * 
FROM user_tables;

SELECT *
FROM beer_v01;

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
SELECT JSON_VALUE(data, '$.name‘) …
FROM ..
WHERE ..

SELECT b.data.name..
FROM beer_v01 b
WHERE …
