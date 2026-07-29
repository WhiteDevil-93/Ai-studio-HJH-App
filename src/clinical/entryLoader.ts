import {buildTreeFromFiles, type CanonicalEntryFile, type LegacyData} from './entryNormalize';

const modules = import.meta.glob<CanonicalEntryFile>('./entries/**/*.json', {
  eager: true,
  import: 'default',
});

export function loadEntryTree(): LegacyData {
  return buildTreeFromFiles(
    Object.entries(modules).map(([path, file]) => ({path, file})),
  );
}
