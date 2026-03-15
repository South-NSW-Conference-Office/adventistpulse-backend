/**
 * Entity Linker — auto-links entity names/keywords in text
 * 
 * Given a text string and a list of known entities, returns segments
 * where recognised entity names are replaced with link data.
 * 
 * Matches on: full entity name, common short names, country names, codes
 */

interface KnownEntity {
  code: string;
  name: string;
  level: string;
}

export interface TextSegment {
  text: string;
  link?: string; // /entity/CODE if matched
  code?: string;
}

/**
 * Build a keyword → entity mapping from a list of entities.
 * Generates multiple keywords per entity for fuzzy matching:
 * - Full name: "Australian Union Conference" → AUC
 * - Short name: "Australian" → AUC  
 * - Country keywords: "Australia" → AUC
 * - Code: "AUC" → AUC
 */
function buildKeywordMap(entities: KnownEntity[]): Map<string, KnownEntity> {
  const map = new Map<string, KnownEntity>();
  
  for (const e of entities) {
    // Full name (highest priority)
    map.set(e.name.toLowerCase(), e);
    
    // Code
    map.set(e.code.toLowerCase(), e);
    
    // Generate short names and country keywords
    const name = e.name;
    
    // Remove suffixes to get the core name — but only use if it's specific enough
    const coreName = name
      .replace(/\s+(Union\s+)?(Conference|Mission|Division|Section|Field|Region|Association)$/i, '')
      .trim();
    
    // Only use core names that are long enough and specific (not generic words)
    const GENERIC_WORDS = new Set([
      'north', 'south', 'east', 'west', 'central', 'northern', 'southern',
      'eastern', 'western', 'upper', 'lower', 'greater', 'new', 'old',
      'attached', 'fields', 'guinea', 'congo', 'chad', 'niger', 'mali',
      'sierra', 'leone', 'cabo', 'verde', 'burkina', 'faso',
    ]);
    const coreWords = coreName.toLowerCase().split(/\s+/);
    const isGeneric = coreWords.length === 1 && GENERIC_WORDS.has(coreWords[0]);
    
    if (coreName.length > 5 && !isGeneric && coreWords.length >= 2) {
      map.set(coreName.toLowerCase(), e);
    }
    
    // NOTE: country→entity mapping is handled separately below
  }

  // Hardcoded country/territory → entity code mapping
  // This maps every country/territory to its parent entity in the Adventist structure
  const COUNTRY_TO_ENTITY: Record<string, string> = {
    // SPD → Unions
    'australia': 'AUC',
    'australian': 'AUC',
    'new zealand': 'NZP',
    'papua new guinea': 'PNGUM',
    // TPUM territories
    'fiji': 'TPUM',
    'samoa': 'TPUM',
    'american samoa': 'TPUM',
    'tonga': 'TPUM',
    'vanuatu': 'TPUM',
    'solomon islands': 'TPUM',
    'french polynesia': 'TPUM',
    'new caledonia': 'TPUM',
    'cook islands': 'TPUM',
    'pitcairn': 'TPUM',
    'tokelau': 'TPUM',
    'niue': 'TPUM',
    'nauru': 'TPUM',
    'kiribati': 'TPUM',
    'tuvalu': 'TPUM',
    'wallis and futuna islands': 'TPUM',
    'wallis and futuna': 'TPUM',
    // AUC → Conferences
    'sydney': 'GSC',
    'greater sydney': 'GSC',
    'tasmania': 'TAS',
    'victoria': 'VIC',
    'south australia': 'SAC',
    'western australia': 'WAC',
    'queensland': 'SQC',
    'northern territory': 'NAC',
    // NZP → Conferences
    'north new zealand': 'NNZC',
    'south new zealand': 'SNZC',
    // ECD territories
    'burundi': 'ECD',
    'congo': 'ECD',
    'rwanda': 'ECD',
    'kenya': 'ECD',
    'uganda': 'ECD',
    'tanzania': 'ECD',
    'ethiopia': 'ECD',
    'eritrea': 'ECD',
    'djibouti': 'ECD',
    'somalia': 'ECD',
    // ESD territories
    'russia': 'ESD',
    'ukraine': 'ESD',
    // EUD territories
    'germany': 'EUD',
    'france': 'EUD',
    'austria': 'EUD',
    'switzerland': 'EUD',
    'italy': 'EUD',
    'spain': 'EUD',
    'portugal': 'EUD',
    'belgium': 'EUD',
    'netherlands': 'EUD',
    'luxembourg': 'EUD',
    'czech republic': 'EUD',
    'romania': 'EUD',
    'bulgaria': 'EUD',
    // IAD territories
    'mexico': 'IAD',
    'colombia': 'IAD',
    'venezuela': 'IAD',
    'cuba': 'IAD',
    'jamaica': 'IAD',
    'haiti': 'IAD',
    'puerto rico': 'IAD',
    'trinidad': 'IAD',
    'guatemala': 'IAD',
    'honduras': 'IAD',
    'belize': 'IAD',
    'costa rica': 'IAD',
    'panama': 'IAD',
    'el salvador': 'IAD',
    'nicaragua': 'IAD',
    // NAD territories
    'united states': 'NAD',
    'canada': 'NAD',
    'bermuda': 'NAD',
    'guam': 'NAD',
    // SAD territories
    'brazil': 'SAD',
    'argentina': 'SAD',
    'chile': 'SAD',
    'peru': 'SAD',
    'bolivia': 'SAD',
    'ecuador': 'SAD',
    'uruguay': 'SAD',
    'paraguay': 'SAD',
    // SID territories
    'south africa': 'SID',
    'zimbabwe': 'SID',
    'zambia': 'SID',
    'malawi': 'SID',
    'mozambique': 'SID',
    'botswana': 'SID',
    'namibia': 'SID',
    'angola': 'SID',
    'madagascar': 'SID',
    // SSD territories
    'philippines': 'SSD',
    'indonesia': 'SSD',
    'malaysia': 'SSD',
    'thailand': 'SSD',
    'vietnam': 'SSD',
    'cambodia': 'SSD',
    'myanmar': 'SSD',
    'singapore': 'SSD',
    'sri lanka': 'SSD',
    'bangladesh': 'SSD',
    'pakistan': 'SSD',
    // NSD territories
    'japan': 'NSD',
    'south korea': 'NSD',
    'korea': 'NSD',
    'taiwan': 'NSD',
    'mongolia': 'NSD',
    'china': 'NSD',
    // SUD territories
    'india': 'SUD',
    'nepal': 'SUD',
    'bhutan': 'SUD',
    // WAD territories
    'nigeria': 'WAD',
    'ghana': 'WAD',
    'liberia': 'WAD',
    'sierra leone': 'WAD',
    'senegal': 'WAD',
    'ivory coast': 'WAD',
    "cote d'ivoire": 'WAD',
    'cameroon': 'WAD',
    'togo': 'WAD',
    'benin': 'WAD',
    'niger': 'WAD',
    'gambia': 'WAD',
    'guinea': 'WAD',
    // TED territories
    'united kingdom': 'TED',
    'ireland': 'TED',
    'norway': 'TED',
    'sweden': 'TED',
    'finland': 'TED',
    'denmark': 'TED',
    'iceland': 'TED',
    'poland': 'TED',
    'hungary': 'TED',
    'greece': 'TED',
    'israel': 'TED',
    'turkey': 'TED',
    'egypt': 'TED',
    'lebanon': 'TED',
    // MENAUM territories
    'iran': 'MENAUM',
    'iraq': 'MENAUM',
    'jordan': 'MENAUM',
    'saudi arabia': 'MENAUM',
    'tunisia': 'MENAUM',
    'algeria': 'MENAUM',
    'morocco': 'MENAUM',
    'libya': 'MENAUM',
    'sudan': 'MENAUM',
  };

  // Add country mappings — only if the target entity exists in our data
  const entityByCode = new Map(entities.map(e => [e.code, e]));
  for (const [country, entityCode] of Object.entries(COUNTRY_TO_ENTITY)) {
    const target = entityByCode.get(entityCode);
    if (target && !map.has(country)) {
      map.set(country, target);
    }
  }

  return map;
}

/**
 * Parse text into segments, linking any recognised entity names.
 * Longest match wins (e.g. "Papua New Guinea" beats "New").
 * Case-insensitive matching.
 */
export function linkEntities(text: string, allEntities: KnownEntity[]): TextSegment[] {
  if (!text || !allEntities.length) return [{ text }];
  
  const keywordMap = buildKeywordMap(allEntities);
  
  // Sort keywords by length descending (longest match first)
  const keywords = Array.from(keywordMap.keys()).sort((a, b) => b.length - a.length);
  
  // Build regex alternation
  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  // Track which entity codes we've already linked to avoid duplicate short-name matches
  const matched = new Set<string>();
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const entity = keywordMap.get(matchedText.toLowerCase());
    
    if (!entity) continue;
    
    // Add preceding text
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    
    segments.push({
      text: matchedText,
      link: `/entity/${entity.code}`,
      code: entity.code,
    });
    matched.add(entity.code);
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  
  return segments.length > 0 ? segments : [{ text }];
}

/**
 * Convenience: parse a comma-separated territory string
 */
export function linkTerritoryText(territory: string, allEntities: KnownEntity[]): TextSegment[] {
  return linkEntities(territory, allEntities);
}
