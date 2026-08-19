declare global {
  interface String {
    localeCompare(that: unknown, locales?: string | string[], options?: Intl.CollatorOptions): number;
  }

  interface Number {
    localeCompare(that: unknown, locales?: string | string[], options?: Intl.CollatorOptions): number;
  }
}

export {};
