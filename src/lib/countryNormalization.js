const TOPO_TO_DB = new Map([
  ['United States of America', 'United States'],
  ['Democratic Republic of the Congo', 'DR Congo'],
  ['Republic of the Congo', 'Congo'],
  ['South Korea', 'Korea, South'],
  ['North Korea', 'Korea, North'],
  ['Russia', 'Russian Federation'],
  ['Iran', 'Iran, Islamic Republic of'],
  ['Syria', 'Syrian Arab Republic'],
  ['Vietnam', 'Viet Nam'],
  ['Tanzania', 'United Republic of Tanzania'],
  ['Bolivia', 'Bolivia, Plurinational State of'],
  ['Venezuela', 'Venezuela, Bolivarian Republic of'],
  ['Moldova', 'Moldova, Republic of'],
  ['Laos', 'Lao People Democratic Republic'],
  ['Taiwan', 'Taiwan, Province of China'],
])

const DB_TO_TOPO = new Map([...TOPO_TO_DB].map(([k, v]) => [v, k]))

const normalizeToDb   = (topoName) => TOPO_TO_DB.get(topoName) ?? topoName
const normalizeToTopo = (dbName)   => DB_TO_TOPO.get(dbName) ?? dbName

export { TOPO_TO_DB, DB_TO_TOPO, normalizeToDb, normalizeToTopo }
