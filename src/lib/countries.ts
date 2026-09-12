import data from "./countries.json";

export type Country = { a2: string; a3: string; name: string };

export const countries: Country[] = data as Country[];
const byA2 = new Map(countries.map((c) => [c.a2, c]));

export const defaultCountry: Country = byA2.get("GB")!;
export function findCountry(a2: string | null | undefined): Country | undefined {
  return a2 ? byA2.get(a2.toUpperCase()) : undefined;
}
export function flagSrc(a2: string) {
  return `/flags/${a2.toUpperCase()}.svg`;
}

export const COUNTRY_KEY = "ra.country";
