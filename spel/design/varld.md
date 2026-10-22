# Runornas kall: Levande värld

Världen ska kännas bebodd innan quests finns. Allt här är fritt: inga rykten, rutiner eller NPC:er spärrar rörelse. Akter och regioner finns i akter.json, NPC:er i npc.json, rykten i rykten.json.

## Dygnet

Ett spelygn är 24 timmar på 48 minuter realtid. Dag 06:00 till 20:00, natt 20:00 till 06:00. Natten är mörkare och dimmigare, NPC:er går in, vakter tänder facklor. Monsternivå och spawn ändras inte av natten (svårigheten styrs bara av nivå), men ljud och ljus gör natten läskigare.

## Byar med vardagsliv

När en stad återbefolkas ändras den synligt, steg för steg:

- **Rensad**: tomma gator, dimman lättar, en hund som snusar bland ruinerna.
- **Nivå 1**: rök från två skorstenar, en handlare på torget, barn som leker med ben, tvätt på lina.
- **Nivå 2**: vakter med facklor på natten, vapenhandlare, lagade tak, höns, en präst som sjunger vid gravarna.
- **Nivå 3**: tavern med musik, kuriosahandlare, helare, marknadsdag (var tredje speldygn ett extra stånd), snabbresa.

Invånarna är enkla bakgrunds NPC:er (bybor) som går mellan hem, brunn, torg och fält enligt samma rutinmodell som namngivna NPC:er.

## Miljöberättande per område

- **Lägret vid skogsbrynet**: ett tält med en tom barnsäng, en karta med överstrukna byar, en lista över de saknade spikad vid elden, gravkors av björk.
- **Startskogen**: vargspår som går i cirklar runt runstenarna, en kolarkoja med middagen kvar på bordet, vägrösen med färska blommor ingen har lagt dit, en barnsandal i mossan på vägen mot Vargaby.
- **Vargaby**: kedjor vid ingången till Ulvhilds ide, ett jägarhus fullt av skinn som aldrig sålts, klösmärken på kyrkdörren från insidan, ben sorterade i högar efter storlek (Viskarens gamla hem).
- **Den gamla byn**: gravar som grävts upp inifrån, Valdemars tomma hövdingastol med en smal bit tyg kvar, en släckt härd i västerhus, kapellets bänkar vända mot dörren.
- **Dimmerstrand**: båtar med nät fulla av ben, kyrkklockor som hörs under vattnet, korpar som följer hjälten, fotspår som går upp ur vattnet och tillbaka ner.
- **Kopparberg**: gruvvagnar med silkesnät, en låst klosterdörr med märken av naglar, kristaller som lyser när spindlar är nära, en gruvlampa som fortfarande brinner längst ner i ett schakt.
- **Askeborg**: aska som faller som snö, statyer smälta i bönestället, kultens tecken målade i blod på varje dörr, en pilgrimsstav i stadsporten.
- **Sista ljuset och Ruttmarken**: en fyr som aldrig slocknar, träd med svulster som pulserar, fåglar som sjunger fel, en kyrka som andas.

## Ryktessystem

Rykten är korta repliker som NPC:er säger när hjälten pratar med dem. De byts ut automatiskt när hjälten gör något i världen. De informerar men spärrar aldrig.

### Datamodell (för Utvecklare)

```json
{
  "id": "rykte_benkungen_dod",
  "text": "Benkungen har fallit. De döda i Den gamla byn ligger stilla.",
  "villkor": { "boss_killed": "benkungen_valdemar" },
  "talare": ["gravvaktaren_ebbe", "olle_vardshus"],
  "prioritet": 3,
  "ersatter": "rykte_benkungen"
}
```

- **villkor** (alla måste vara sanna, tomt = alltid): `boss_killed`, `boss_not_killed`, `city_state_gte` ({stad: tillstånd}), `runes_active_gte`, `runes_active_lt`, `bosses_killed_gte`, `event` (t.ex. `legendary_found`).
- **ersatter**: när ryktet är aktivt döljs det ersatta ryktet.
- **prioritet**: högre visas först. Platshållare som `{hjalte}`, `{foremal}`, `{antal_bossar}` fylls från world_state.

### world_state (sparas i sparfilen, inte per game)

```json
{
  "bosses_killed": ["grabjornen_ulvhild"],
  "city_states": { "gamla_byn": "aterbefolkad_1" },
  "runes_active": 3,
  "legendaries_found": ["runsmidd_klinga"],
  "last_events": [{ "type": "legendary_found", "item": "runsmidd_klinga", "time": 1234 }]
}
```

### Algoritm

1. Händelser (`boss_killed`, `legendary_found`, `city_state_changed`, `runes_changed`) uppdaterar world_state.
2. När hjälten pratar med en NPC: ta ryktena där NPC:n är talare, filtrera på villkor, ta bort ersatta, sortera på prioritet.
3. Visa det högst prioriterade som NPC:n inte sagt senast; ett nytt rykte markeras med en liten gnista över NPC:ns huvud.
4. `legendary_found` lever i 3 speldygn, sedan faller det tillbaka till äldre rykten.

## Dygnsrutiner

### Datamodell (för Utvecklare)

```json
"dygnsrutin": [
  { "from": "07:00", "to": "19:00", "plats": "lagrets_karra", "aktivitet": "köper och säljer" },
  { "from": "19:00", "to": "22:00", "plats": "lagerelden", "aktivitet": "dricker och skrävlar" },
  { "from": "22:00", "to": "07:00", "plats": "tors_talt", "aktivitet": "sover" }
]
```

- **plats** är ett ankare (namngiven punkt) i områdets karta. Utvecklare placerar ankarna; NPC:n går dit med enkel stigfinnare och spelar aktivitetens animation.
- Ett intervall som passerar midnatt (22:00 till 07:00) gäller över midnatt.
- Handlare handlar bara under intervall där aktiviteten innehåller handel; annars säger de en natthälsning men hjälten kan alltid väcka dem och handla (ingen spärr).
- Bakgrundsbybor använder mallar: `bybo_bonde`, `bybo_barn`, `bybo_vakt` med samma format.

## Konsekvenssystem

Världen ändras permanent per hjälte. Varje val i quests.json har en lista `consequences` med effekter som körs i ordning. Effekterna är små moduler, så Utvecklare kan bygga dem en i taget (föreslagen ordning i quests.json meta.konsekvenssystem.bygg_ordning).

### Effekttyper

| Typ                  | Fält                              | Vad den gör                                                |
| -------------------- | --------------------------------- | ---------------------------------------------------------- |
| flag_set             | flag, value                       | Sätter en flagga i world_state.flags                       |
| value_add            | key, delta                        | Ändrar ett värde (t.ex. byns hopp)                         |
| faction_rep          | faktion, delta                    | Fraktionsrykte −100 till 100                               |
| npc_state            | npc, state, delay_dygn            | Byter tillståndsvariant i npc.json eller dödar NPC:n (dod) |
| npc_location         | npc, omrade, plats                | Flyttar NPC:n permanent                                    |
| npc_faction          | npc, faktion                      | NPC:n byter sida                                           |
| town_growth          | town, delta                       | Växt eller förfall: invånare, dekor, rök, ljus             |
| merchant_stock       | npc, add, remove, prisfaktor_mult | Ändrar handlares utbud och priser                          |
| area_change          | region, andring, ankare, value    | Miljö, ljus, NPC närvaro eller spawn i framtida games      |
| rumor_add            | rykte                             | Aktiverar ett rykte                                        |
| quest_exclude        | quest, val, steg                  | Utesluter en questväg, aldrig ett område                   |
| quest_alt_giver      | quest, npc                        | Ny givare när den gamla är borta                           |
| item_grant, xp_grant | item / amount                     | Belöningar                                                 |

### world_state per hjälte

Utöver flaggorna för rykten sparas: `flags`, `values`, `faction_rep`, `npc_states`, `npc_locations`, `npc_factions`, `town_growth`, `merchant_mods`, `area_changes`, `quests`, `quest_excludes`, `rumors_active` och `pending` (effekter med delay_dygn). Exempel finns i quests.json meta.konsekvenssystem.world_state_exempel.

### Regler

- Ingen effekt får spärra rörelse. quest_exclude stänger en väg i en quest, aldrig en region eller boss.
- Fraktioner: över 30 ger rabatt och fler repliker, under −30 kalla hälsningar. Aldrig spärrar.
- NPC:ers tillstånd läses från npc.json tillstand_varianter; fält i varianten skriver över standard.
- pending effekter körs när speldygnet når due_day.
