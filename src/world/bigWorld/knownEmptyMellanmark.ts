/**
 * Mellanmark ring|biom där alla osäkra chunkar saknar spawn (inga undertyper i ringbandet).
 * Design fyller täckning i spel/design — ta bort rader när datan kommer (test failar om listan är inaktuell).
 */
export const KNOWN_EMPTY_MELLANMARK = new Set<string>([
  '2|kust',
  '3|skog',
  '4|kust',
  '4|skog',
  '4|trask',
  '5|fjall',
  '5|kust',
  '5|skog',
  '6|ask',
  '6|fjall',
  '6|kust',
  '6|skog',
  '7|ask',
  '7|fjall',
  '7|kust',
  '7|skog',
]);

export function mellanmarkEmptyIssues(
  coverage: ReadonlyMap<string, { empty: number; total: number }>,
  known: ReadonlySet<string> = KNOWN_EMPTY_MELLANMARK,
): string[] {
  const issues: string[] = [];
  for (const [key, stat] of coverage) {
    if (stat.total === 0) continue;
    if (stat.empty === 0) {
      if (known.has(key)) {
        issues.push(`KNOWN_EMPTY inaktuell: ${key} har mellanmark-spawn — ta bort från KNOWN_EMPTY_MELLANMARK`);
      }
      continue;
    }
    if (stat.empty < stat.total) {
      issues.push(`varld_stor mellanmark ${key}: ${stat.empty}/${stat.total} tom (delvis, ej tillåtet)`);
      continue;
    }
    if (!known.has(key)) {
      issues.push(`varld_stor mellanmark ${key}: ${stat.empty}/${stat.total} tom (saknas i KNOWN_EMPTY_MELLANMARK)`);
    }
  }
  for (const key of known) {
    if (!coverage.has(key)) continue;
    const stat = coverage.get(key);
    if (stat && stat.total > 0 && stat.empty === 0) {
      issues.push(`KNOWN_EMPTY inaktuell: ${key} har mellanmark-spawn — ta bort från KNOWN_EMPTY_MELLANMARK`);
    }
  }
  return issues;
}
