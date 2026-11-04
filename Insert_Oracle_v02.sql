-- Tabelle und Daten für V02
-- drop table beer_v02;
CREATE TABLE beer_v02 (
	id     NUMBER GENERATED ALWAYS AS IDENTITY,
	data   JSON);

-- erste 6 Datensätze
INSERT INTO beer_v02 (data)
VALUES (
  '{
  	name: "IPA Sommerhopfen",
  	style: "IPA",
  	abv: 6.2,
  	recipe: {
      	batchSize: "20L",
    	malts: [
      		{ name: "Pilsner Malz", amountKg: 5 },
      		{ name: "Carahell", amountKg: 0.5 }
    	],
    	hops: [
      		{ name: "Citra", amountG: 50 },
      		{ name: "Mosaic", amountG: 30 }
    	],
    	yeast: "US-05",
      	boilTime: "60 min"
  	}
  }')
, (
  '{
    name: "Alpine Pale Ale",
    style: "Pale Ale",
    abv: 5.4,
    recipe: {
      	batchSize: "20L",
      	malts: [
      		{ name: "Pilsner Malz", amountKg: 4.5 },
      		{ name: "CaraMunich", amountKg: 0.3 }
      	],
      	hops: [
      		{ name: "Cascade", amountG: 20, minutes: 60 },
      		{ name: "Citra", amountG: 25, minutes: 15 },
      		{ name: "Cascade", amountG: 30, minutes: 0 }
      	],
      	yeast: "US-05",
      	ibu: 38,
      	boilTime: "60 min",
      	fermentation: "18-20°C for 10 days"
    }
  }')
, (
  '{
    name: "Midnight Stout",
    style: "Stout",
    abv: 6.8,
    recipe: {
      	batchSize: "20L",
      	malts: [
      		{ name: "Maris Otter", amountKg: 4.0 },
      		{ name: "Roasted Barley", amountKg: 0.5 },
      		{ name: "Chocolate Malt", amountKg: 0.3 },
      		{ name: "Flaked Oats", amountKg: 0.2 }
      	],
      	hops: [
      		{ name: "East Kent Goldings", amountG: 35, minutes: 60 }
      	],
      	yeast: "SafAle S-04",
      	ibu: 42,
      	boilTime: "60 min",
      	fermentation: "19°C for 12 days"
    }
  }')
, (
  '{
    name: "Golden Wheat",
    style: "Hefeweizen",
    abv: 5.1,
    recipe: {
      	batchSize: "20L",
      	malts: [
      		{ name: "Wheat Malt", amountKg: 2.5 },
      		{ name: "Pilsner Malz", amountKg: 2.0 }
      	],
      	hops: [
      		{ name: "Hallertau Mittelfruh", amountG: 15, minutes: 60 },
      		{ name: "Tettnang", amountG: 10, minutes: 15 }
      	],
      	yeast: "WB-06",
      	ibu: 18,
      	boilTime: "60 min",
      	fermentation: "20-22°C for 8 days"
    }
  }')
, (
  '{
    name: "Hop Storm IPA",
    style: "IPA",
    abv: 6.9,
    recipe: {
      	batchSize: "20L",
      	malts: [
      		{ name: "Pilsner Malz", amountKg: 5.2 },
      		{ name: "Vienna Malt", amountKg: 0.4 }
      	],
      	hops: [
      		{ name: "Magnum", amountG: 25, minutes: 60 },
      		{ name: "Mosaic", amountG: 30, minutes: 15 },
      		{ name: "Citra", amountG: 40, minutes: 5 },
      		{ name: "Mosaic", amountG: 50, minutes: 0 }
      	],
      	yeast: "US-05",
      	ibu: 62,
      	boilTime: "60 min",
      	fermentation: "18°C for 10 days"
    }
  }')
, (
  '{
    name: "Copper Trail Amber",
    style: "Amber Ale",
    abv: 5.8,
    recipe: {
      	batchSize: "20L",
      	malts: [
      		{ name: "Pilsner Malz", amountKg: 4.3 },
      		{ name: "Crystal Malt", amountKg: 0.5 },
      		{ name: "CaraMunich", amountKg: 0.2 }
      	],
      	hops: [
      		{ name: "Northern Brewer", amountG: 20, minutes: 60 },
      		{ name: "Cascade", amountG: 20, minutes: 15 }
      	],
      	yeast: "SafAle S-04",
      	ibu: 30,
      	boilTime: "60 min",
      	fermentation: "19°C for 10 days"
    }
  }'
);
