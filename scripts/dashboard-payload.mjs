import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Full daily.json remains the scanner's durable state. Never remove stock rows,
// history summaries, missing values or evidence from the browser projection.
export function dashboardPayload(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.stocks) || !snapshot.generatedAt)
    throw Error('Invalid daily snapshot');
  const { lastObserved, gateObserved, ...dashboard } = snapshot;
  return dashboard;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = new URL('../dist/data/daily.json', import.meta.url);
  const snapshot = JSON.parse(await readFile(source, 'utf8'));
  await writeFile(new URL('../dist/data/dashboard.json', import.meta.url), JSON.stringify(dashboardPayload(snapshot)));
}
