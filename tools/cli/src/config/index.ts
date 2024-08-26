export type BuildFlags = {
  distribution: 'browser' | 'desktop' | 'admin' | 'mobile';
  mode: 'development' | 'production';
  channel: 'stable' | 'beta' | 'canary' | 'internal';
  static: boolean;
  coverage?: boolean;
  localBlockSuite?: string;
  entry?: string | { [key: string]: string };
};
