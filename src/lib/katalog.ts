// Produktkatalog – Verkaufskatalog Kanzlei Adler und Sohn (Bestandsliste 13.07.2026)
export type Produkt = {
  pos: number;
  artikel: string;
  name: string;
  beschreibung: string;
  einzelpreis: number; // EUR netto
  einheit: string;
  kategorie: string;
};

export const KATEGORIEN = [
  "I. Kombidämpfer & Heißluft-Kombidämpfer",
  "II. Spül- & Reinigungstechnik",
  "III. Kühl- & Tiefkühltechnik",
  "IV. Lüftungstechnik",
  "V. Koch- & Brattechnik",
  "VI. Nutzfahrzeugaufbauten & Kommunaltechnik",
  "VII. Container & Behälter",
  "VIII. Tanktechnik & Betriebsstoffe",
  "IX. Flurförderzeuge & Stapler",
  "X. LKW-Reifen",
  "XI. Lager-, Verpackungs- & Betriebsbedarf",
  "XII. Elektronik & IT-Hardware",
] as const;

export const PRODUKTE: Produkt[] = [
  // I. Kombidämpfer
  { pos: 1, artikel: "10051", name: "RATIONAL iCombi Pro 20-2/1 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 11572.40, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 2, artikel: "10052", name: "Eloma Genius MT 20-21 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 11509.60, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 3, artikel: "10053", name: "MKN FlexiCombi MagicPilot 20.2 MAXI (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 11298.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 4, artikel: "10054", name: "Convotherm 4 deluxe easyTouch 20.20 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 10964.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 5, artikel: "10055", name: "Unox ChefTop Mind.Maps BIG PLUS 20x GN 2/1", beschreibung: "Heißluft-Kombidämpfer", einzelpreis: 10108.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 6, artikel: "10056", name: "MKN FlexiCombi MagicPilot Team 6.2-10.2 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 10312.80, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 7, artikel: "10057", name: "RATIONAL iCombi Pro 20-2/1 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 10242.40, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 8, artikel: "10058", name: "Eloma Multimax 20-21 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 9627.60, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 9, artikel: "10059", name: "MKN FlexiCombi MagicPilot Team 6.1-10.2 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 9115.20, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 10, artikel: "10060", name: "Eloma Genius MT 20-11 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 8327.20, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 11, artikel: "10061", name: "Convotherm 4 deluxe easyTouch 20.10 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 8237.60, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 12, artikel: "10062", name: "RATIONAL iCombi Pro 20-1/1 (Gas)", beschreibung: "Kombidämpfer, Gas", einzelpreis: 8072.40, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 13, artikel: "10063", name: "Unox CHEFTOP MIND.Maps PLUS BIG 20x GN 1/1", beschreibung: "Kombidämpfer", einzelpreis: 7600.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 14, artikel: "10064", name: "Unox BakerTop Mind.Maps BIG PLUS 16x 600x400", beschreibung: "Heißluft-Kombidämpfer", einzelpreis: 7600.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 15, artikel: "10065", name: "Convotherm maxx pro easyTouch 10.20 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 6310.40, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 16, artikel: "10066", name: "RATIONAL iCombi Classic 20-1/1 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 5839.60, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 17, artikel: "10067", name: "MKN FlexiCombi MagicPilot 10.2 MAXI (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 5336.40, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 18, artikel: "10068", name: "RATIONAL iCombi Classic 10-2/1 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 4799.20, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 19, artikel: "10069", name: "Unox CHEFTOP MIND.Maps PLUS COUNTERTOP 10x GN 1/1", beschreibung: "Kombidämpfer", einzelpreis: 4028.00, einheit: "Stk.", kategorie: KATEGORIEN[0] },
  { pos: 20, artikel: "10070", name: "MKN FlexiCombi MagicPilot 10.1 (Elektro)", beschreibung: "Kombidämpfer, Elektro", einzelpreis: 4205.60, einheit: "Stk.", kategorie: KATEGORIEN[0] },

  // II. Spül- & Reinigungstechnik
  { pos: 21, artikel: "10072", name: "Winterhalter UC-M Geschirrspüler 230V", beschreibung: "Geschirrspüler", einzelpreis: 2500.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 22, artikel: "10073", name: "Rhima DR 51TS Frontlader 400V", beschreibung: "Geschirrspüler mit Wasserenthärter", einzelpreis: 1922.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 23, artikel: "10074", name: "Rhima DR 165E PLUS Pfannenwaschmaschine", beschreibung: "Grundkorb 550 x 665 mm", einzelpreis: 4308.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 24, artikel: "10081", name: "Hobart PROFI FX 10C", beschreibung: "Geschirrspülmaschine", einzelpreis: 2074.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 25, artikel: "10082", name: "Hobart ecomax F515-11C plus", beschreibung: "Geschirrspülmaschine", einzelpreis: 1547.60, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 26, artikel: "10083", name: "Hobart ecomax F504-12B", beschreibung: "Geschirrspülmaschine", einzelpreis: 1038.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 27, artikel: "10084", name: "Hobart care mit Wasserenthärtung", beschreibung: "Geschirrspülmaschine", einzelpreis: 2318.40, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 28, artikel: "10088", name: "Winterhalter UF-XL Universal", beschreibung: "Gerätespülmaschine", einzelpreis: 8553.60, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 29, artikel: "10089", name: "Winterhalter UF-L Energy (Bäcker/Metzger)", beschreibung: "Gerätespülmaschine", einzelpreis: 6406.00, einheit: "Stk.", kategorie: KATEGORIEN[1] },
  { pos: 30, artikel: "10090", name: "Hobart Profi UXS-10B Universalspülmaschine", beschreibung: "mit Wasserenthärter", einzelpreis: 5660.40, einheit: "Stk.", kategorie: KATEGORIEN[1] },

  // III. Kühl- & Tiefkühltechnik
  { pos: 31, artikel: "10075", name: "Hoshizaki IM-45CNE-HC-25 Eiswürfelbereiter", beschreibung: "Eiswürfelbereiter", einzelpreis: 1610.00, einheit: "Stk.", kategorie: KATEGORIEN[2] },
  { pos: 32, artikel: "10077", name: "Hoshizaki IM-100CNE-HC-32 Eiswürfelbereiter", beschreibung: "Eiswürfelbereiter", einzelpreis: 1840.00, einheit: "Stk.", kategorie: KATEGORIEN[2] },
  { pos: 33, artikel: "10078", name: "Liebherr FFPSvh 1402 Perfection Tiefkühlschrank", beschreibung: "NoFrost", einzelpreis: 2026.00, einheit: "Stk.", kategorie: KATEGORIEN[2] },
  { pos: 34, artikel: "10079", name: "Hoshizaki PREMIER F 140 L Tiefkühlschrank", beschreibung: "Tiefkühlschrank", einzelpreis: 1851.20, einheit: "Stk.", kategorie: KATEGORIEN[2] },
  { pos: 35, artikel: "10080", name: "Liebherr GKPv 1470-43 ProfiLine Kühlschrank", beschreibung: "Kühlschrank", einzelpreis: 1758.00, einheit: "Stk.", kategorie: KATEGORIEN[2] },
  { pos: 36, artikel: "10091", name: "NordCap Z 290-260 K-K-HEG Kühlzelle", beschreibung: "Mit Paneelboden, steckerfertig", einzelpreis: 3367.20, einheit: "Stk.", kategorie: KATEGORIEN[2] },

  // IV. Lüftungstechnik
  { pos: 37, artikel: "10085", name: "Rational UltraVent Plus Typ 6-2/1 und 10-2/1", beschreibung: "Kondensationshaube, Elektro", einzelpreis: 2203.20, einheit: "Stk.", kategorie: KATEGORIEN[3] },
  { pos: 38, artikel: "10087", name: "Rational UltraVent PLUS Typ 6-1/1, 10-1/1", beschreibung: "Kondensationshaube", einzelpreis: 1779.60, einheit: "Stk.", kategorie: KATEGORIEN[3] },

  // V. Koch- & Brattechnik
  { pos: 39, artikel: "10092", name: "Baron QUEEN9 Q90FT/E1225 Grillplatte", beschreibung: "Grillplatte, Elektro", einzelpreis: 2500.00, einheit: "Stk.", kategorie: KATEGORIEN[4] },
  { pos: 40, artikel: "10093", name: "MKN PowerBlock 2/1 GN Kippbratpfanne", beschreibung: "MK – Optima 700, Elektro", einzelpreis: 4500.00, einheit: "Stk.", kategorie: KATEGORIEN[4] },
  { pos: 41, artikel: "10094", name: "MKN Optima 700 Vapro Kochkessel 60 l", beschreibung: "Kochkessel, Elektro", einzelpreis: 5400.00, einheit: "Stk.", kategorie: KATEGORIEN[4] },

  // VI. Nutzfahrzeugaufbauten
  { pos: 42, artikel: "P042", name: "HYVA 20-47 S Abrollanlage (2013)", beschreibung: "Für Container bis 5,7 m", einzelpreis: 7735.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 43, artikel: "P043", name: "Schmidt Stratos B50-36 Salzstreuer ~5m³ (2001)", beschreibung: "Aufbau Kommunalfahrzeug", einzelpreis: 3835.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 44, artikel: "P044", name: "HYVA T20-47-S Abrollanlage (Neu)", beschreibung: "20t Abrollanlage 3,8–5,7 m", einzelpreis: 18135.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 45, artikel: "P045", name: "Küpper-Weisser STA 95 E40HFV Salzstreuer ~4m³", beschreibung: "mit 2x Laugentank", einzelpreis: 2925.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 46, artikel: "P046", name: "Küpper-Weisser IMSSN E2940HFA Salzstreuer ~4m³", beschreibung: "Demontage MAN LE 18.280", einzelpreis: 2925.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 47, artikel: "P047", name: "Boschung MF 2.4 Schneeräumschild (2004)", beschreibung: "Räumbreite 2.546 mm", einzelpreis: 1885.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 48, artikel: "P048", name: "Meiller 3-Seiten-Kippaufbau (2007)", beschreibung: "3.600 x 2.320 x 400 mm, 4.500 kg", einzelpreis: 5337.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 49, artikel: "P049", name: "Palfinger PH T20 SLD 5 Abrollanlage (2021)", beschreibung: "20t, für Container bis 7 m", einzelpreis: 16185.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 50, artikel: "P050", name: "GMEINER STA 1500 TC FS Salzstreuer ~1,5m³ (2009)", beschreibung: "Aufbaustreuer", einzelpreis: 2535.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 51, artikel: "P051", name: "Palfinger PST 18 TEC Tele-Absetzanlage (Neu)", beschreibung: "Funk, Containerverriegelung", einzelpreis: 22685.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 52, artikel: "P052", name: "Getränkekoffer (2015)", beschreibung: "4.190 x 2.440 x 2.130 mm", einzelpreis: 5900.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 53, artikel: "P053", name: "Meiller AK Absetzanlage auf Abrollrahmen (2007)", beschreibung: "13.000 kg zGG", einzelpreis: 6435.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 54, artikel: "P054", name: "Meiller AK 10 MT Tele-Absetzvorrichtung (2016)", beschreibung: "10.000 kg zGG, funkfähig", einzelpreis: 16730.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 55, artikel: "P055", name: "Abrollrahmen mit Hydraulikstation (1995)", beschreibung: "Mercedes Benz V8 Motor", einzelpreis: 11830.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 56, artikel: "P056", name: "Meiller 3-Seiten-Kippaufbau ~11m³ (Neu)", beschreibung: "Alu-Bordwände, 4.900x2.410x1.000 mm", einzelpreis: 17430.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },
  { pos: 57, artikel: "P057", name: "HALLER M19X2C Müllaufbau mit Terberg Schüttung", beschreibung: "Müllsammelfahrzeug-Aufbau (2006)", einzelpreis: 4900.00, einheit: "Stk.", kategorie: KATEGORIEN[5] },

  // VII. Container & Behälter
  { pos: 58, artikel: "P058", name: "Abrollplattform mit Stirnwand", beschreibung: "obere Abrollplattform", einzelpreis: 2145.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 59, artikel: "P059", name: "METACON Abrollcontainer ~22m³ mit Kran Penz 13200 HL", beschreibung: "22.000 kg zGG, 5.200x2.300x1.950", einzelpreis: 10400.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 60, artikel: "P060", name: "ALU STAHL City-Abrollcontainer ~4,7m³ (1994)", beschreibung: "4.500 x 2.100 x 500 mm", einzelpreis: 780.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 61, artikel: "P061", name: "ALU STAHL L27 City-Abrollcontainer ~9,5m³ (1994)", beschreibung: "4.500 x 2.100 x 1.000 mm", einzelpreis: 715.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 62, artikel: "P062", name: "20'-Container mit Glasfenstern", beschreibung: "Aufbauten Wechselbrücken", einzelpreis: 5200.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 63, artikel: "P063", name: "Materialcontainer 6 Fuß", beschreibung: "1.980 x 1.950 x 1.910 mm, 2.000 kg", einzelpreis: 1175.73, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 64, artikel: "P064", name: "GASSMANN Abrollcontainer / Schrottcontainer", beschreibung: "Schrottcontainer", einzelpreis: 1235.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 65, artikel: "P065", name: "Garant City-Abrollcontainer AMR 40/40 ~4m³ (2014)", beschreibung: "6.000 kg zGG, Flügeltür", einzelpreis: 1268.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 66, artikel: "P066", name: "Abrollcontainer mit Flügeltüren ~12m³", beschreibung: "5.300 x 2.280 x 1.000 mm", einzelpreis: 1625.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 67, artikel: "P067", name: "SIRCH U 7 K Absetzcontainer ~7m³ (2015)", beschreibung: "Asymmetrisch mit Einfahrklappe", einzelpreis: 1235.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 68, artikel: "P068", name: "Abrollcontainer Hakenaufnahme DIN 30722", beschreibung: "Tränenblech 5 mm, 15.000 kg", einzelpreis: 3705.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 69, artikel: "P069", name: "GASSMANN Wassertank-Abrollcontainer ~18m³ (Neu)", beschreibung: "6.900 x 2.500 x 1.250 mm", einzelpreis: 9035.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 70, artikel: "P070", name: "City-Abrollcontainer ~14m³ mit Türen & Plane", beschreibung: "3.400 x 2.050 x 1.600 mm", einzelpreis: 2520.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 71, artikel: "P071", name: "GASSMANN Abrollcontainer Flügeltür ~37m³ (Neu)", beschreibung: "6.500 x 2.380 x 2.400 mm", einzelpreis: 5320.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 72, artikel: "P072", name: "GASSMANN Abrollcontainer Klappe ~9m³ (Neu)", beschreibung: "überfahrbar, 5.000 x 2.380 x 750", einzelpreis: 4200.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 73, artikel: "P073", name: "Abrollcontainer ABPR ~12m³ (Neu)", beschreibung: "6.000 x 2.420 x 800 mm, Pendelklappe", einzelpreis: 5880.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 74, artikel: "P074", name: "Absetzcontainer ~7m³ (1990)", beschreibung: "Absetzcontainer", einzelpreis: 560.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 75, artikel: "P075", name: "GASSMANN Absetzcontainer ~7m³ (2023)", beschreibung: "10.000 kg zGG, asymmetrisch/offen", einzelpreis: 1225.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 76, artikel: "P076", name: "TIEK Presscontainer HSC 10 AK ~10m³ (1988)", beschreibung: "Papier-Selbstpresscontainer 380 V", einzelpreis: 5530.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 77, artikel: "P077", name: "GREIS Abrollcontainer mit Kran HMF 1144 K1 TS", beschreibung: "21m³, Flügeltüren (1997)", einzelpreis: 10150.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 78, artikel: "P078", name: "Abrollcontainer Plattform mit Rungen (2016)", beschreibung: "4.500 x 2.500 x 1.000 mm", einzelpreis: 2310.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 79, artikel: "P079", name: "Abrollcontainer mit Flügeltüren ~13m³ (2016)", beschreibung: "4.500 x 2.400 x 1.200 mm", einzelpreis: 2660.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 80, artikel: "P080", name: "GASSMANN Abrollcontainer Flügeltür ~20m³ (Neu)", beschreibung: "15.000 kg zGG, 5.500 x 2.380 x 1.500", einzelpreis: 4830.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 81, artikel: "P081", name: "GASSMANN Bayernbox Flügeltür ~11m³ (Neu)", beschreibung: "5.500 x 2.350 x 800 mm", einzelpreis: 6100.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 82, artikel: "P082", name: "GASSMANN Abrollcontainer Flügeltür ~20m³ (Neu)", beschreibung: "15.000 kg zGG, 5.500 x 2.380 x 1.500", einzelpreis: 6900.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 83, artikel: "P083", name: "GFK Streugutbehälter 550 l (Neu)", beschreibung: "Behälter grau, Deckel orange", einzelpreis: 399.00, einheit: "Stk.", kategorie: KATEGORIEN[6] },
  { pos: 84, artikel: "P084", name: "Allpress RIES Presscontainer SP 60 – 10 cbm (2023)", beschreibung: "Neu, voll funktionsfähig", einzelpreis: 3677.90, einheit: "Stk.", kategorie: KATEGORIEN[6] },

  // VIII. Tanktechnik
  { pos: 85, artikel: "P085", name: "AdBlue 1000 Liter Kanister", beschreibung: "ISO 22241/1, DIN 70070, VDA lizenziert", einzelpreis: 379.20, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 86, artikel: "P086", name: "Aral LKW-Diesel (DIN EN 590)", beschreibung: "Biodiesel max. 7 %", einzelpreis: 0.90, einheit: "Ltr.", kategorie: KATEGORIEN[7] },
  { pos: 87, artikel: "P087", name: "FREIE SICHT Scheibenwischerzusatz CLASSIC 200 l", beschreibung: "für alle Fahrzeugtypen", einzelpreis: 246.11, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 88, artikel: "P088", name: "IBC Tank 1000 l ADR Lebensmittel", beschreibung: "Stahlmantel, PE-Palette, neu", einzelpreis: 60.28, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 89, artikel: "P089", name: "STADLER Tank 5.500 l Heizöl/Diesel (1977)", beschreibung: "Prüfungen gültig bis 2025", einzelpreis: 3965.00, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 90, artikel: "P090", name: "Stahltank CUBE 70 K33, 30.000 l (Neu)", beschreibung: "DIN EN 12285-2 Klasse B", einzelpreis: 26324.00, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 91, artikel: "P091", name: "CUBE-Tank AdBlue Outdoor Premium 5.000 l (Neu)", beschreibung: "Zähler K24, 8 m Schlauchaufroller", einzelpreis: 5422.00, einheit: "Stk.", kategorie: KATEGORIEN[7] },
  { pos: 92, artikel: "P092", name: "Stahltank doppelwandig 400–1.500 l", beschreibung: "Diesel/Öl, mit Trichter/Füllrohr", einzelpreis: 467.63, einheit: "Stk.", kategorie: KATEGORIEN[7] },

  // IX. Flurförderzeuge
  { pos: 93, artikel: "P093", name: "Jungheinrich Elektro-Hubwagen AME 15 Li-Ion", beschreibung: "Tragkraft 1.500 kg", einzelpreis: 1163.00, einheit: "Stk.", kategorie: KATEGORIEN[8] },
  { pos: 94, artikel: "P094", name: "Jungheinrich Handhubwagen AM 20", beschreibung: "Tragkraft 2.000 kg, Gabellänge 1.150 mm", einzelpreis: 239.50, einheit: "Stk.", kategorie: KATEGORIEN[8] },
  { pos: 95, artikel: "P095", name: "HYSTER H4 6650 kg Diesel-Gabelstapler (2012)", beschreibung: "55 kW, Hebekraft 4.000 kg", einzelpreis: 8350.00, einheit: "Stk.", kategorie: KATEGORIEN[8] },

  // X. LKW-Reifen
  { pos: 96, artikel: "P096", name: "Dunlop SP 446 315/70 R22.5 154L Winterreifen", beschreibung: "Neu, 2022–2023", einzelpreis: 199.20, einheit: "Stk.", kategorie: KATEGORIEN[9] },
  { pos: 97, artikel: "P097", name: "Continental Conti Hybrid HS3 385/65 R22.5 160K", beschreibung: "Sommerreifen 110 km/h (2022)", einzelpreis: 390.90, einheit: "Stk.", kategorie: KATEGORIEN[9] },
  { pos: 98, artikel: "P098", name: "MICHELIN X MULTI D 315/70 R22.5 154/150L", beschreibung: "Ganzjahresreifen M+S 3PMSF (2022)", einzelpreis: 370.38, einheit: "Stk.", kategorie: KATEGORIEN[9] },
  { pos: 99, artikel: "P099", name: "Continental HDR 2+ 315/80 R22.5 156/150L", beschreibung: "Ganzjahresreifen (2023)", einzelpreis: 373.92, einheit: "Stk.", kategorie: KATEGORIEN[9] },

  // XI. Lager
  { pos: 100, artikel: "P100", name: "Palettenrahmen Europalette Holz (Bündel 108 St.)", beschreibung: "1.200 x 800 mm, 4 Scharniere", einzelpreis: 419.58, einheit: "Pal.", kategorie: KATEGORIEN[10] },
  { pos: 101, artikel: "P101", name: "Stretchmaschine PS OneWrap elektrisch", beschreibung: "Wickelhöhe 2.100 mm, 2.400 kg", einzelpreis: 1890.00, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 102, artikel: "P102", name: "Eurogitterbox fabrikneu (UIC 435-3)", beschreibung: "1.200 x 800 x 970 mm, 1.500 kg", einzelpreis: 39.50, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 103, artikel: "P103", name: "Luftpolster-Schutzhauben EPAL-Gitterbox (10er VE)", beschreibung: "mehrfach einsetzbar", einzelpreis: 38.50, einheit: "VEs", kategorie: KATEGORIEN[10] },
  { pos: 104, artikel: "P104", name: "Gitteraufsatzrahmen", beschreibung: "1.200 x 800 x 800 mm, 800 kg", einzelpreis: 24.00, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 105, artikel: "P105", name: "Klappbare Gitterboxen", beschreibung: "1.200 x 800 x 970 mm, 1.000 kg", einzelpreis: 69.66, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 106, artikel: "P106", name: "Gitterbox mit Gitterdeckel", beschreibung: "1.200 x 800 x 970 mm, 1.500 kg", einzelpreis: 52.50, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 107, artikel: "P107", name: "Eurogitterboxen gebraucht", beschreibung: "1.200 x 800 x 970 mm, ab 2011", einzelpreis: 31.96, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 108, artikel: "P108", name: "Europalette gebraucht A-Klasse", beschreibung: "1.200 x 800 x 144 mm, 1.500 kg", einzelpreis: 6.00, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 109, artikel: "P109", name: "Palettenkarton 1.180 x 780 x 550 mm", beschreibung: "Stärke 2,4 vdw", einzelpreis: 1.60, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 110, artikel: "P110", name: "Palettenkarton 1.180 x 780 x 1.065 mm", beschreibung: "Stärke 2,4 vdw", einzelpreis: 2.00, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 111, artikel: "P111", name: "Füllmaterial Polystyrol 500 l Sack", beschreibung: "stark polsternd, lose in Säcken", einzelpreis: 11.86, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 112, artikel: "P112", name: "Holzaufsatzrahmen 2-Brett", beschreibung: "800x600x200 / 1.200x800x200 mm", einzelpreis: 3.22, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 113, artikel: "P113", name: "Kommissionierwagen mit Etage", beschreibung: "900 x 625 x 1.630 mm, 150 kg", einzelpreis: 49.24, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 114, artikel: "P114", name: "Kommissionierwagen mit Rückwand", beschreibung: "900 x 625 x 1.630 mm, 300 kg", einzelpreis: 55.48, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 115, artikel: "P115", name: "Holzaufsatzrahmen 1-Brett", beschreibung: "1.200 x 800 x 200 mm", einzelpreis: 2.76, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 116, artikel: "P116", name: "UNIPAS Stahlpalette EU", beschreibung: "1.193 x 794 x 132 mm, bis 7.500 kg", einzelpreis: 69.20, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 117, artikel: "P117", name: "CP1-Palette Holz gebraucht A-Klasse", beschreibung: "1.200 x 1.000 x 138 mm", einzelpreis: 7.00, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 118, artikel: "P118", name: "CP3-Palette Holz gebraucht A-Klasse", beschreibung: "1.140 x 1.140 x 156 mm", einzelpreis: 7.50, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 119, artikel: "P119", name: "Papier holzfrei hochweiß (FSC, ECF)", beschreibung: "CIE 161, DIN ISO 14001/9706/9001", einzelpreis: 583.70, einheit: "Stk.", kategorie: KATEGORIEN[10] },
  { pos: 120, artikel: "P120", name: "Toilettenpapier Isabella 3-lagig (1.152 Rollen)", beschreibung: "extra weiß, 250 Blatt/Rolle", einzelpreis: 331.76, einheit: "Stk.", kategorie: KATEGORIEN[10] },

  // XII. Elektronik & IT
  { pos: 121, artikel: "P121", name: "Apple MacBook Pro 14\" M4, 16 GB / 512 GB", beschreibung: "Space Schwarz, wie neu", einzelpreis: 1050.00, einheit: "Stk.", kategorie: KATEGORIEN[11] },
  { pos: 122, artikel: "P122", name: "Mitsubishi Electric Split-Klima MUZ/MSZ-HR35VF", beschreibung: "3,4 kW, bis 35 m²", einzelpreis: 780.00, einheit: "Stk.", kategorie: KATEGORIEN[11] },
  { pos: 123, artikel: "P123", name: "Daikin Perfera FTXM+RXM Quick Connect", beschreibung: "3,5 kW, A+++, WiFi", einzelpreis: 1700.00, einheit: "Stk.", kategorie: KATEGORIEN[11] },
  { pos: 124, artikel: "P124", name: "Bosch CL7000i 53 E Split-Klima Quick-Connect", beschreibung: "5,0 kW, bis 55 m²", einzelpreis: 1450.00, einheit: "Stk.", kategorie: KATEGORIEN[11] },
];
