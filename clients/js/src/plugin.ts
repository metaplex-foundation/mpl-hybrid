import { UmiPlugin } from '@metaplex-foundation/umi';
import { createMplHybridProgram } from './generated';

export const mplHybrid = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createMplHybridProgram(), false);
  },
});
