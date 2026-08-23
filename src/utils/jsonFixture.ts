export type JsonFixtureRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonFixtureRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const parseJsonFixture = (source: string): JsonFixtureRecord => {
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed)) {
    throw new Error('JSON fixture phải là một object');
  }

  const candidate = isRecord(parsed.body)
    ? parsed.body
    : isRecord(parsed.data)
      ? parsed.data
      : parsed;
  return candidate;
};

export const fixtureText = (record: JsonFixtureRecord, key: string, fallback = ''): string => {
  const value = record[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
};

export const fixtureTime = (record: JsonFixtureRecord, key: string, fallback = ''): string => {
  const value = fixtureText(record, key, fallback);
  return /^\d{2}:\d{2}:\d{2}$/.test(value) ? value.slice(0, 5) : value;
};
