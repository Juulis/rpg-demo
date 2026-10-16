# src/save (ägs av Utvecklare 2)

SaveManager + hjälteplatser. Implementerar `GameModule`. Måste läsa/skriva legacy-format: `rpg_heroes`, `rpg_hero_<id>` ({version, hero, game:{seed, killed[]}}), `rpg_found`, med migrering (se legacy-3d/js/save.js, inkl. byte av gammalt startgear). Sessionen är `ctx.session` ({seed, killed:Set}).
