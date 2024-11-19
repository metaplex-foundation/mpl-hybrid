import { InternalPath } from './generated';

enum CustomPath {
  RerollMetadata = 16,
}

export const Path = {
  ...InternalPath,
  ...CustomPath,
};

export type Path = InternalPath | CustomPath;

export function buildPath(features: Path[]) {
  let path = 0;

  for (const feature of features) {
    if (feature != Path.RerollMetadata) {
      path |= 1 << feature;
    }
  }

  return path;
}
