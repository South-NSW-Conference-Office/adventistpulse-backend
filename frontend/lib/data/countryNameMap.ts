/**
 * Mapping between TopoJSON country names (world-atlas) and DB country names.
 */

export const TOPO_TO_DB: Record<string, string> = {
  "United States of America":        "United States",
  "Democratic Republic of the Congo":"DR Congo",
  "Republic of the Congo":           "Congo",
  "South Korea":                     "Korea, South",
  "North Korea":                     "Korea, North",
  "Russia":                          "Russian Federation",
  "Iran":                            "Iran, Islamic Republic of",
  "Syria":                           "Syrian Arab Republic",
  "Vietnam":                         "Viet Nam",
  "Tanzania":                        "United Republic of Tanzania",
  "Bolivia":                         "Bolivia, Plurinational State of",
  "Venezuela":                       "Venezuela, Bolivarian Republic of",
  "Moldova":                         "Moldova, Republic of",
  "Laos":                            "Lao People Democratic Republic",
  "Taiwan":                          "Taiwan, Province of China",
};

const DB_TO_TOPO: Record<string, string> = Object.fromEntries(
  Object.entries(TOPO_TO_DB).map(([k, v]) => [v, k])
);

export function toDbName(topoName: string): string {
  return TOPO_TO_DB[topoName] ?? topoName;
}

export function toTopoName(dbName: string): string {
  return DB_TO_TOPO[dbName] ?? dbName;
}
