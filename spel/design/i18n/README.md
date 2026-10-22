# i18n – Runornas kall / Call of the Runes

Swedish is the source language. The Swedish design files in `design/` are never changed.
Translations live in `i18n/<lang>/` (e.g. `i18n/en/`), one file per source file, **same filename**.

## Format

- Each file is a JSON object: `{ "<entry id>": { <text fields only> } }`.
- Field names are identical to the Swedish file (`name`, `namn`, `beskrivning`, `text`, `lore`, `theme`, `desc`, ...).
- Nested entries are keyed by their own id: `quests.json → <quest id>.steg.<step id>.text`, `.val.<choice id>.text`,
  `dialoger.json → <npc>.repliker.<line id>.text`, `lorebok.json → <category>.entries.<entry id>.pieces.<piece id>`.
  Nested objects without ids keep their original key path (e.g. `fixed.note`, `repliker.halsning`, `tillstand_varianter.<state>.bark`, `bonuses.<n>.<bonus>.effect`).
- Arrays of plain strings (e.g. `npc.json repliker.rader`, `quest_krokar`, `loot_kvaliteter.json rare_names`, `monster_niva.json unique_names`) are translated position by position and keep the same length.
- Ids, numbers, conditions, formulas, colors and audio paths are **not** included. They always come from the Swedish file.
- Placeholders such as `{hjalte}`, `{foremal}` and `{antal_bossar}` must be kept verbatim.

## Lookup and fallback

Look up the text by file + id path + field. If the language file, the id or the field is missing,
**fall back to the Swedish text** in the source file. A partial translation is therefore always safe.

## Glossary

`i18n/en/_glossary.json` maps Swedish names and terms to English. New text must follow it.
Design notes and Markdown docs (`*.md`, `meta` rules, formulas, AI/visual descriptions) are not player text and are not translated.
