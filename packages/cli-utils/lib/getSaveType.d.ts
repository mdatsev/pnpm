import { Config } from '@pnpm/config';
import { DependenciesField } from '@pnpm/types';
export default function getSaveType(opts: Pick<Config, 'saveDev' | 'saveOptional' | 'saveProd'>): DependenciesField | undefined;
