import { InternalPath } from './generated';

enum CustomPath {
  RerollMetadata = 16,
}

export const Path = {
  ...InternalPath,
  ...CustomPath,
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Path = InternalPath | CustomPath;

export function buildPath(features: Path[]) {
  let path = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const feature of features) {
    if (feature !== Path.RerollMetadata) {
      // eslint-disable-next-line no-bitwise
      path |= 1 << feature;
    }
  }

  return path;
}
