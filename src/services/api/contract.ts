export type JsonRecord = Record<string, unknown>;

export const requireRecord = (value: unknown, label: string): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as JsonRecord;
};

export const requireArray = <T>(
  value: unknown,
  label: string,
  parseItem: (item: unknown, label: string) => T,
): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((item, index) => parseItem(item, `${label}[${index}]`));
};

export const requireString = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
};

export const optionalString = (value: unknown, label: string): string | null => {
  if (value === null || value === undefined) return null;
  return requireString(value, label);
};

export const optionalText = (value: unknown, label: string): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value;
};

export const requireNumber = (value: unknown, label: string, minimum = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new Error(`${label} must be a finite number greater than or equal to ${minimum}`);
  }
  return value;
};

export const requireInteger = (value: unknown, label: string, minimum = 0): number => {
  const number = requireNumber(value, label, minimum);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`${label} must be a safe integer`);
  }
  return number;
};

export const requireNumberRange = (
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number => {
  const number = requireNumber(value, label, minimum);
  if (number > maximum) {
    throw new Error(`${label} must be less than or equal to ${maximum}`);
  }
  return number;
};

export const optionalPositiveInteger = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined) return null;
  return requireInteger(value, label, 1);
};

export const requireBoolean = (value: unknown, label: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
};

export const requireEnum = <T extends string>(
  value: unknown,
  values: readonly T[],
  label: string,
): T => {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} contains an unsupported value`);
  }
  return value as T;
};

export const requireTimestamp = (value: unknown, label: string): string => {
  const timestamp = requireString(value, label);
  if (Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${label} must be a valid timestamp`);
  }
  return timestamp;
};

export const requirePage = <T>(
  value: unknown,
  label: string,
  parseItem: (item: unknown, label: string) => T,
) => {
  const record = requireRecord(value, label);
  return {
    items: requireArray(record.items, `${label}.items`, parseItem),
    page: requireInteger(record.page, `${label}.page`),
    size: requireInteger(record.size, `${label}.size`, 1),
    totalItems: requireInteger(record.totalItems, `${label}.totalItems`),
    totalPages: requireInteger(record.totalPages, `${label}.totalPages`),
    hasNext: requireBoolean(record.hasNext, `${label}.hasNext`),
  };
};
