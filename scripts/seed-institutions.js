/**
 * scripts/seed-institutions.js
 *
 * Seeds the `institutions` and `acncentries` collections from the static data
 * previously hardcoded in the frontend lib/institutions.ts and lib/acnc-data.ts.
 *
 * Usage:
 *   node scripts/seed-institutions.js           — upsert all institutions and ACNC entries
 *   node scripts/seed-institutions.js --dry-run — validate data without writing to DB
 *
 * Safe to re-run: uses updateOne with upsert:true on unique `code` / `{name, financialYear}`.
 * Run AFTER Bem has confirmed the Institution model is integrated and the app is running.
 */

import 'dotenv/config'
import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI
if (!MONGO_URI) {
  console.error('❌  No MONGO_URI in .env')
  process.exit(1)
}

const isDryRun = process.argv.includes('--dry-run')
if (isDryRun) console.log('🔍  Dry run — no writes will happen\n')

// ─── Institution data ─────────────────────────────────────────────────────────
// Migrated from frontend/lib/institutions.ts — keep in sync when that file changes.
// When Morpheus starts scraping ACNC directly, replace these static entries
// with DB updates and mark dataVerified: true.

const INSTITUTIONS = [
  // ── EDUCATION ────────────────────────────────────────────────────────────────
  {
    code: 'AVONDALE-AU',
    name: 'Avondale University',
    type: 'education',
    country: 'Australia',
    region: 'South Pacific Division',
    conferenceCode: 'NNSW',
    yearFounded: 1897,
    website: 'https://avondale.edu.au',
    description: "Australia's only Adventist university, founded in 1897 in the Hunter Valley. Offers degrees in nursing, education, ministry, business and arts.",
    stats: { enrollment: 1200, courses: 40, campuses: 2, faculties: 5, graduatesPerYear: 280, accreditation: 'TEQSA Registered', studentTeacherRatio: '12:1' },
    tags: ['University', 'Nursing', 'Ministry', 'TEQSA'],
  },
  {
    code: 'ADVENTIST-SCHOOLS-SNSW',
    name: 'Adventist Schools SNSW',
    type: 'education',
    country: 'Australia',
    region: 'South Pacific Division',
    conferenceCode: 'SNSW',
    yearFounded: 1950,
    description: 'Network of Adventist schools across the South NSW Conference territory.',
    stats: { schools: 3, totalEnrollment: 850, staffCount: 120, averageClassSize: 22 },
    tags: ['Primary', 'Secondary', 'SNSW'],
  },
  {
    code: 'PACI-ADVENTIST-UNIV',
    name: 'Pacific Adventist University',
    type: 'education',
    country: 'Papua New Guinea',
    region: 'South Pacific Division',
    yearFounded: 1984,
    website: 'https://pau.ac.pg',
    description: 'The Adventist university of the Pacific islands, serving PNG and the Pacific region with degrees in theology, nursing, education and business.',
    stats: { enrollment: 2800, courses: 25, countries: 15, yearFounded: 1984 },
    tags: ['University', 'Pacific', 'PNG'],
  },
  // ── HEALTH ───────────────────────────────────────────────────────────────────
  {
    code: 'SAH-SYDNEY',
    name: 'Sydney Adventist Hospital',
    type: 'health',
    country: 'Australia',
    region: 'South Pacific Division',
    conferenceCode: 'NNSW',
    yearFounded: 1903,
    website: 'https://sah.org.au',
    description: "Australia's largest Adventist hospital, known as \"The San\". A 473-bed not-for-profit hospital in Wahroonga, Sydney offering comprehensive health care with a Christian ethos.",
    stats: { beds: 473, staff: 2000, patientsPerYear: 35000, specialties: 50, yearFounded: 1903, accreditation: 'ACHS Accredited', type: 'Tertiary Referral' },
    tags: ['Tertiary Hospital', 'Sydney', 'Not-for-profit'],
    contextNote: 'Adventist Healthcare Ltd (AHCL), SAH\'s parent entity, undertook a formal restructuring in early 2022 including role reductions and outplacement services. Source: Adventist Review, January 2022.',
    trajectory: [
      {
        metric: 'Total Revenue',
        source: 'Adventist Healthcare Ltd Annual Report (public)',
        unit: 'AUD $M',
        color: '#6366F1',
        isEstimate: true,
        data: [
          { year: 2018, value: 285 }, { year: 2019, value: 295 }, { year: 2020, value: 268 },
          { year: 2021, value: 279 }, { year: 2022, value: 310 }, { year: 2023, value: 325 },
        ],
      },
      {
        metric: 'Operating Expenses',
        source: 'Adventist Healthcare Ltd Annual Report (public)',
        unit: 'AUD $M',
        color: '#ef4444',
        isEstimate: true,
        data: [
          { year: 2018, value: 268 }, { year: 2019, value: 282 }, { year: 2020, value: 264 },
          { year: 2021, value: 278 }, { year: 2022, value: 318 }, { year: 2023, value: 320 },
        ],
      },
      {
        metric: 'Net Surplus / (Deficit)',
        source: 'Derived from Annual Report (public)',
        unit: 'AUD $M',
        color: '#10b981',
        isEstimate: true,
        data: [
          { year: 2018, value: 17 }, { year: 2019, value: 13 }, { year: 2020, value: 4 },
          { year: 2021, value: 1 }, { year: 2022, value: -8 }, { year: 2023, value: 5 },
        ],
      },
      {
        metric: 'Patient Admissions',
        source: 'SAH Annual Report (public)',
        unit: 'admissions (000s)',
        color: '#f59e0b',
        isEstimate: true,
        data: [
          { year: 2018, value: 32 }, { year: 2019, value: 33 }, { year: 2020, value: 26 },
          { year: 2021, value: 29 }, { year: 2022, value: 32 }, { year: 2023, value: 34 },
        ],
      },
    ],
  },
  {
    code: 'PENANG-ADVENTIST',
    name: 'Penang Adventist Hospital',
    type: 'health',
    country: 'Malaysia',
    region: 'Southern Asia-Pacific Division',
    yearFounded: 1924,
    description: "One of Malaysia's premier private hospitals, operated by the Seventh-day Adventist Church since 1924.",
    stats: { beds: 180, specialties: 30, staff: 800, yearFounded: 1924 },
    tags: ['Private Hospital', 'Malaysia', 'Penang'],
  },
  {
    code: 'LOMA-LINDA-HEALTH',
    name: 'Loma Linda University Health',
    type: 'health',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1905,
    website: 'https://lluh.org',
    description: 'One of the largest Adventist health systems in the world, anchored by Loma Linda University Medical Center. A recognised Blue Zone. Trains ~4,000 health professionals annually and performs complex surgeries including pediatric heart transplants.',
    stats: { hospitals: 8, beds: 1000, staff: 11000, annualRevenue: '~$2.5B USD', medicalSchoolStudents: 4000, researchGrants: '~$100M/yr' },
    contextNote: "Loma Linda is one of the world's original Blue Zones — a region with exceptional longevity. Research links Adventist lifestyle (plant-based diet, community, Sabbath rest) to 7–10 years additional life expectancy.",
    tags: ['Health System', 'Blue Zone', 'Medical Education', 'USA'],
  },
  {
    code: 'ADVENTIST-HEALTH-US',
    name: 'Adventist Health (West)',
    type: 'health',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1898,
    website: 'https://adventisthealth.org',
    description: 'One of the largest not-for-profit hospital systems in the USA, operating 24 hospitals across California, Oregon, Hawaii and Washington. Part of the NAD health ministry.',
    stats: { hospitals: 24, beds: 3500, staff: 38000, annualRevenue: '~$4.5B USD', states: 4 },
    tags: ['Health System', 'USA', 'Not-for-profit'],
  },
  // ── HUMANITARIAN ─────────────────────────────────────────────────────────────
  {
    code: 'ADRA-AUSTRALIA',
    name: 'ADRA Australia',
    type: 'humanitarian',
    country: 'Australia',
    region: 'South Pacific Division',
    conferenceCode: 'AUC',
    yearFounded: 1956,
    website: 'https://adra.org.au',
    description: 'The Adventist Development and Relief Agency in Australia, responding to disasters and working long-term in vulnerable communities across the Pacific and Asia.',
    stats: { countriesActive: 18, beneficiaries2023: 125000, programs: 35, staff: 45, volunteers: 800, annualBudgetAUD: '$12M' },
    tags: ['Humanitarian', 'Pacific', 'Disaster Relief'],
    contextNote: 'ADRA Australia holds approximately $30M in total assets (ACNC public data). Questions have been raised by church members about reserve levels relative to program expenditure.',
    trajectory: [
      {
        metric: 'Total Revenue',
        source: 'ACNC Annual Information Statement (public)',
        unit: 'AUD $M',
        color: '#10b981',
        isEstimate: true,
        data: [
          { year: 2019, value: 18 }, { year: 2020, value: 22 }, { year: 2021, value: 25 },
          { year: 2022, value: 20 }, { year: 2023, value: 21 },
        ],
      },
      {
        metric: 'Program Expenditure',
        source: 'ACNC Annual Information Statement (public)',
        unit: 'AUD $M',
        color: '#6366F1',
        isEstimate: true,
        data: [
          { year: 2019, value: 14 }, { year: 2020, value: 17 }, { year: 2021, value: 18 },
          { year: 2022, value: 15 }, { year: 2023, value: 16 },
        ],
      },
      {
        metric: 'Total Assets / Reserves',
        source: 'ACNC Annual Information Statement (public)',
        unit: 'AUD $M',
        color: '#f59e0b',
        isEstimate: true,
        data: [
          { year: 2019, value: 24 }, { year: 2020, value: 26 }, { year: 2021, value: 29 },
          { year: 2022, value: 30 }, { year: 2023, value: 30 },
        ],
      },
    ],
  },
  {
    code: 'ADRA-PNG',
    name: 'ADRA Papua New Guinea',
    type: 'humanitarian',
    country: 'Papua New Guinea',
    region: 'South Pacific Division',
    yearFounded: 1984,
    description: "ADRA PNG implements community development and emergency response programs across Papua New Guinea's diverse provinces.",
    stats: { programs: 12, beneficiaries2023: 80000, provinces: 8, staff: 28 },
    tags: ['Humanitarian', 'PNG', 'Community Development'],
  },
  // ── FOOD ─────────────────────────────────────────────────────────────────────
  {
    code: 'SANITARIUM-AU',
    name: 'Sanitarium Health & Wellbeing',
    type: 'food',
    country: 'Australia',
    region: 'South Pacific Division',
    yearFounded: 1898,
    website: 'https://sanitarium.com',
    description: "Australia's most iconic health food company, owned by the Adventist Church. Produces Weet-Bix, Up&Go, So Good plant milks and more. Profits fund church and charity programs.",
    stats: { brands: 8, productsApprox: 50, countries: 3, employees: 1500, yearFounded: 1898, annualRevenue: '~$300M AUD', notableProducts: 'Weet-Bix, Up&Go, So Good, Marmite NZ' },
    tags: ['Health Food', 'FMCG', 'Weet-Bix', 'Church-owned'],
  },
  {
    code: 'SANITARIUM-NZ',
    name: 'Sanitarium New Zealand',
    type: 'food',
    country: 'New Zealand',
    region: 'South Pacific Division',
    yearFounded: 1900,
    description: 'The New Zealand arm of Sanitarium, famous for Weet-Bix and the iconic Marmite NZ brand. Tax-exempt as a religious organisation.',
    stats: { employees: 350, brands: 5, yearFounded: 1900 },
    tags: ['Health Food', 'NZ', 'Marmite', 'Church-owned'],
  },
  {
    code: 'MORNING-STAR-FOODS',
    name: "Morning Star Farms (Kellogg's)",
    type: 'food',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1939,
    description: "Originally founded as a Seventh-day Adventist health food company. Sold to Kellogg's in 1999. The brand retains its plant-based heritage but is no longer church-owned. A cautionary tale of commercialisation.",
    stats: { yearSold: 1999, buyerCompany: "Kellogg's (now Kellanova)", currentOwner: 'Mars Inc (acquired 2023)', notableProducts: 'MorningStar Farms veggie burgers, Grillers', originalFounder: 'Worthington Foods (SDA)' },
    contextNote: "Originally a Seventh-day Adventist enterprise. The sale to Kellogg's in 1999 illustrates the tension between commercial growth and mission ownership. The brand is now owned by Mars Inc.",
    tags: ['Plant-Based', 'Former SDA', "Sold to Kellogg's", 'Cautionary Tale'],
  },
  {
    code: 'SANITARIUM-GLOBAL',
    name: 'Sanitarium — Global Overview',
    type: 'food',
    country: 'Australia/NZ',
    region: 'South Pacific Division',
    yearFounded: 1898,
    description: 'The Sanitarium brand is tax-exempt in Australia and New Zealand as a religious organisation. Profits are used by the Adventist Church rather than distributed to shareholders. This tax structure is a significant and ongoing public conversation.',
    stats: { taxStatus: 'Religious organisation (tax-exempt AU/NZ)', estimatedAnnualRevenue: '~$350M AUD combined', taxExemptSince: 1898, publicControversy: 'Tax exemption ongoing debate' },
    contextNote: "Unlike Kellogg's or Nestlé, Sanitarium pays no company tax in Australia or New Zealand due to its religious organisation status. Estimated annual tax savings: $30–80M. This is legal, publicly debated, and worth understanding.",
    tags: ['Tax Exempt', 'Controversial', 'Church-owned', 'Public Debate'],
  },
  // ── MEDIA ─────────────────────────────────────────────────────────────────────
  {
    code: 'HOPE-CHANNEL-INT',
    name: 'Hope Channel International',
    type: 'media',
    country: 'USA',
    region: 'General Conference',
    yearFounded: 2003,
    website: 'https://hopetv.org',
    description: 'The official television network of the Seventh-day Adventist Church, broadcasting in 54 languages across 6 continents.',
    stats: { languages: 54, channels: 80, continents: 6, onlineViewers: '5M+', yearFounded: 2003 },
    tags: ['Television', 'Streaming', 'Global Media'],
  },
  {
    code: 'FAITH-FM-AU',
    name: 'Faith FM Australia',
    type: 'media',
    country: 'Australia',
    region: 'South Pacific Division',
    conferenceCode: 'AUC',
    yearFounded: 2007,
    website: 'https://faithfm.org.au',
    description: "Australia's national Christian radio network, operated by the Adventist Church. Broadcasting from Melbourne with national digital reach.",
    stats: { stations: 8, reachAustralia: '2M+ weekly', languages: 2, yearFounded: 2007, format: 'Christian contemporary + talk' },
    tags: ['Radio', 'Australia', 'Christian Music'],
  },
  {
    code: 'ADVENTIST-WORLD-RADIO',
    name: 'Adventist World Radio',
    type: 'media',
    country: 'USA',
    region: 'General Conference',
    yearFounded: 1971,
    website: 'https://awr.org',
    description: 'A global shortwave and digital radio ministry reaching 80+ countries in 70+ languages. The voice of Adventism in regions where Christianity is restricted or persecuted.',
    stats: { languages: 70, countries: 80, yearFounded: 1971, reachEstimate: '20M+ weekly listeners', format: 'Shortwave + digital + podcast' },
    tags: ['Global Radio', 'Persecution', 'Restricted Access'],
  },
  // ── PUBLISHING ────────────────────────────────────────────────────────────────
  {
    code: 'SIGNS-PUBLISHING',
    name: 'Signs Publishing Company',
    type: 'publishing',
    country: 'Australia',
    region: 'South Pacific Division',
    yearFounded: 1885,
    website: 'https://signspublishing.com.au',
    description: 'The Adventist publishing house for the South Pacific, producing Signs of the Times magazine, books, and digital resources for Australasia.',
    stats: { titlesPublished: 200, countries: 12, flagship: 'Signs of the Times', yearFounded: 1885, languages: 4 },
    tags: ['Publishing', 'Australia', 'Signs of the Times'],
  },
  {
    code: 'REVIEW-AND-HERALD',
    name: 'Review and Herald Publishing',
    type: 'publishing',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1849,
    website: 'https://rhpa.org',
    description: 'The oldest Adventist publishing house, founded by James and Ellen White in 1849. Now part of the Pacific Press Publishing Association. Has published over 1,000 titles.',
    stats: { yearFounded: 1849, titlesPublished: 1000, flagshipPublications: 'Adventist Review, Ministry Magazine', yearsMerged: 'Merged with Pacific Press 2015' },
    contextNote: 'Founded by James White — the pioneer whose legacy inspires Adventist Pulse. The original Adventist media enterprise.',
    tags: ['Historical', 'James White', 'Pioneer', 'Publishing'],
  },
  // ── EDUCATION — NORTH AMERICA ────────────────────────────────────────────────
  {
    code: 'ANDREWS-UNIVERSITY',
    name: 'Andrews University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1874,
    website: 'https://andrews.edu',
    description: "The flagship Adventist university of the NAD's higher education system. Home to the Adventist Theological Seminary and one of the most diverse campuses in the USA.",
    stats: { enrollment: 3300, countries: 100, programs: 130, seminary: 'Yes — flagship', yearFounded: 1874 },
    tags: ['Flagship University', 'Theology', 'USA', 'Diverse'],
  },
  {
    code: 'SOUTHERN-ADVENTIST-UNIV',
    name: 'Southern Adventist University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1892,
    website: 'https://southern.edu',
    description: 'Located in Collegedale, Tennessee. Known for strong nursing, business, and media programs. One of the larger Adventist universities in North America.',
    stats: { enrollment: 3100, programs: 100, yearFounded: 1892, accreditation: 'SACSCOC' },
    tags: ['USA', 'Nursing', 'Media', 'Tennessee'],
  },
  {
    code: 'LA-SIERRA-UNIVERSITY',
    name: 'La Sierra University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1922,
    website: 'https://lasierra.edu',
    description: 'Located in Riverside, California. Known for its science, religion, and arts programs. Has faced discussions about the relationship between faith and academic freedom.',
    stats: { enrollment: 2200, programs: 60, yearFounded: 1922, accreditation: 'WSCUC' },
    contextNote: 'La Sierra has been a focal point of Adventist debates about faith and academic freedom, particularly around science and evolution discussions.',
    tags: ['USA', 'California', 'Science', 'Arts'],
  },
  {
    code: 'WALLA-WALLA-UNIVERSITY',
    name: 'Walla Walla University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1892,
    website: 'https://wallawalla.edu',
    description: 'Located in College Place, Washington. Strong engineering, nursing and music programs. Serves the Pacific Northwest Adventist community.',
    stats: { enrollment: 1900, programs: 80, yearFounded: 1892, accreditation: 'NWCCU' },
    tags: ['USA', 'Washington', 'Engineering', 'Nursing'],
  },
  {
    code: 'SOUTHWESTERN-ADVENTIST',
    name: 'Southwestern Adventist University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1893,
    website: 'https://swau.edu',
    description: 'Located in Keene, Texas. One of the oldest Adventist universities in North America, known for education, communication and social work programs.',
    stats: { enrollment: 800, programs: 50, yearFounded: 1893, accreditation: 'SACSCOC' },
    tags: ['USA', 'Texas', 'Education', 'Historic'],
  },
  {
    code: 'UNION-COLLEGE-NE',
    name: 'Union College',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1891,
    website: 'https://ucollege.edu',
    description: 'Located in Lincoln, Nebraska. Strong nursing and physician assistant programs. Serves the Mid-America Union Conference.',
    stats: { enrollment: 900, programs: 40, yearFounded: 1891, accreditation: 'HLC' },
    tags: ['USA', 'Nebraska', 'Nursing', 'Physician Assistant'],
  },
  {
    code: 'PACIFIC-UNION-COLLEGE',
    name: 'Pacific Union College',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1882,
    website: 'https://puc.edu',
    description: 'Located in Angwin, California in the Napa Valley. Strong nursing, aviation, and pre-med programs in a scenic campus setting.',
    stats: { enrollment: 1400, programs: 60, yearFounded: 1882, accreditation: 'WSCUC' },
    tags: ['USA', 'California', 'Napa Valley', 'Aviation'],
  },
  {
    code: 'OAKWOOD-UNIVERSITY',
    name: 'Oakwood University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1896,
    website: 'https://oakwood.edu',
    description: 'A historically Black Adventist university in Huntsville, Alabama. Central to African-American Adventist heritage and education.',
    stats: { enrollment: 1700, programs: 50, yearFounded: 1896, accreditation: 'SACSCOC' },
    contextNote: 'Oakwood has been central to African-American Adventist history since 1896. Ellen White personally advocated for its establishment as a place of education for Black Adventists in the post-Civil War South.',
    tags: ['HBCU', 'USA', 'Alabama', 'African-American Heritage'],
  },
  {
    code: 'BURMAN-UNIVERSITY',
    name: 'Burman University',
    type: 'education',
    country: 'Canada',
    region: 'North American Division',
    yearFounded: 1903,
    website: 'https://burmanu.ca',
    description: 'The only Adventist university in Canada, located in Lacombe, Alberta. Formerly Canadian University College.',
    stats: { enrollment: 650, programs: 30, yearFounded: 1903, accreditation: 'CAQC' },
    tags: ['Canada', 'Alberta', 'Liberal Arts'],
  },
  {
    code: 'WASHINGTON-ADVENTIST-UNIV',
    name: 'Washington Adventist University',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1904,
    website: 'https://wau.edu',
    description: 'Located in Takoma Park, Maryland — the original home of Adventist headquarters in the USA. Close proximity to Washington DC shapes its public policy and communications programs.',
    stats: { enrollment: 1200, programs: 50, yearFounded: 1904, accreditation: 'MSCHE' },
    tags: ['USA', 'Maryland', 'DC Area', 'Policy'],
  },
  {
    code: 'KETTERING-COLLEGE',
    name: 'Kettering College',
    type: 'education',
    country: 'USA',
    region: 'North American Division',
    yearFounded: 1967,
    website: 'https://kettering.edu',
    description: 'A health sciences college affiliated with Kettering Health Network in Dayton, Ohio. Specialises in physician assistant, nursing, and radiologic technology.',
    stats: { enrollment: 900, programs: 12, yearFounded: 1967, focus: 'Health Sciences exclusively', accreditation: 'HLC' },
    tags: ['USA', 'Ohio', 'Health Sciences', 'Physician Assistant'],
  },
  // ── EDUCATION — SOUTH AMERICA ────────────────────────────────────────────────
  {
    code: 'UNIV-RIVER-PLATE',
    name: 'Universidad Adventista del Plata',
    type: 'education',
    country: 'Argentina',
    region: 'South American Division',
    yearFounded: 1898,
    website: 'https://uap.edu.ar',
    description: 'One of the oldest Adventist universities in South America, located in Entre Ríos, Argentina. Strong health sciences, theology and communications faculties.',
    stats: { enrollment: 5000, programs: 40, yearFounded: 1898 },
    tags: ['Argentina', 'South America', 'Spanish', 'Historic'],
  },
  {
    code: 'UNIV-ADVENTISTA-SAO-PAULO',
    name: 'Centro Universitário Adventista de São Paulo (UNASP)',
    type: 'education',
    country: 'Brazil',
    region: 'South American Division',
    yearFounded: 1915,
    website: 'https://unasp.edu.br',
    description: 'The largest Adventist university in the world by enrollment, with campuses in São Paulo, Engenheiro Coelho, and Hortolândia. Over 25,000 students.',
    stats: { enrollment: 25000, campuses: 3, programs: 60, yearFounded: 1915 },
    contextNote: "UNASP is the largest Adventist university in the world — over 25,000 students across 3 Brazilian campuses. A remarkable institutional story of growth in Adventism's most populous country.",
    tags: ['Brazil', 'Largest Adventist University', 'South America'],
  },
  // ── EDUCATION — INTER-AMERICA ────────────────────────────────────────────────
  {
    code: 'UNIV-MONTEMORELOS',
    name: 'University of Montemorelos',
    type: 'education',
    country: 'Mexico',
    region: 'Inter-American Division',
    yearFounded: 1942,
    website: 'https://um.edu.mx',
    description: 'Located in Montemorelos, Nuevo León, Mexico. The flagship Adventist university for the Inter-American Division. Strong health, education and theology programs.',
    stats: { enrollment: 4000, programs: 45, yearFounded: 1942 },
    tags: ['Mexico', 'Inter-America', 'Spanish', 'Health Sciences'],
  },
  // ── EDUCATION — EUROPE ───────────────────────────────────────────────────────
  {
    code: 'NEWBOLD-COLLEGE',
    name: 'Newbold College of Higher Education',
    type: 'education',
    country: 'UK',
    region: 'Trans-European Division',
    yearFounded: 1901,
    website: 'https://newbold.ac.uk',
    description: 'The Adventist college for the UK and Ireland, located in Bracknell, Berkshire. Focuses on theology, education, and social science.',
    stats: { enrollment: 400, programs: 20, yearFounded: 1901, accreditation: 'QAA Reviewed' },
    tags: ['UK', 'Europe', 'Theology', 'Historic'],
  },
  {
    code: 'FRIEDENSAU-UNIVERSITY',
    name: 'Friedensau Adventist University',
    type: 'education',
    country: 'Germany',
    region: 'Trans-European Division',
    yearFounded: 1899,
    website: 'https://friedensau.de',
    description: "Germany's Adventist university, located in Friedensau, Saxony-Anhalt. One of the oldest Adventist institutions in Europe. Known for theology, social work and community development.",
    stats: { enrollment: 550, programs: 15, yearFounded: 1899, accreditation: 'State-accredited' },
    contextNote: "Friedensau survived both World Wars and the East German communist regime to remain one of Europe's oldest Adventist institutions.",
    tags: ['Germany', 'Europe', 'Theology', 'History'],
  },
  {
    code: 'SALEVE-ADVENTIST-UNIV',
    name: 'Séminaire Adventiste du Salève',
    type: 'education',
    country: 'France',
    region: 'Euro-Africa Division',
    yearFounded: 1921,
    website: 'https://saleve.net',
    description: 'The French-language Adventist theological college near Geneva, serving French-speaking Europe and Africa. Located near the Swiss border in Collonges-sous-Salève.',
    stats: { enrollment: 300, programs: 10, yearFounded: 1921 },
    tags: ['France', 'French-language', 'Theology', 'Europe-Africa'],
  },
  // ── EDUCATION — AFRICA ───────────────────────────────────────────────────────
  {
    code: 'UNIV-EASTERN-AFRICA',
    name: 'University of Eastern Africa, Baraton',
    type: 'education',
    country: 'Kenya',
    region: 'East-Central Africa Division',
    yearFounded: 1978,
    website: 'https://ueab.ac.ke',
    description: 'Located in the Rift Valley, Kenya. The flagship Adventist university for East Africa, serving students from across the continent with degrees in education, business, nursing and theology.',
    stats: { enrollment: 3000, programs: 35, countries: 30, yearFounded: 1978 },
    tags: ['Kenya', 'East Africa', 'Rift Valley', 'Multi-national'],
  },
  {
    code: 'ADVENTIST-UNIV-CENTRAL-AFRICA',
    name: 'Adventist University of Central Africa',
    type: 'education',
    country: 'Rwanda',
    region: 'East-Central Africa Division',
    yearFounded: 1984,
    website: 'https://auca.ac.rw',
    description: 'Located in Kigali, Rwanda. Survived the 1994 genocide and has become a symbol of reconciliation. Trains leaders across Central Africa.',
    stats: { enrollment: 4500, programs: 30, yearFounded: 1984 },
    contextNote: "AUCA's survival and rebuilding after the 1994 Rwandan genocide is one of the most powerful stories of Adventist institutional resilience. The university has become a centre for reconciliation education.",
    tags: ['Rwanda', 'Central Africa', 'Reconciliation', 'Resilience'],
  },
  {
    code: 'BABCOCK-UNIVERSITY',
    name: 'Babcock University',
    type: 'education',
    country: 'Nigeria',
    region: 'West-Central Africa Division',
    yearFounded: 1959,
    website: 'https://babcock.edu.ng',
    description: "Nigeria's premier Adventist university, located in Ilishan-Remo, Ogun State. One of the fastest-growing private universities in Africa, with 14,000+ students.",
    stats: { enrollment: 14000, programs: 80, yearFounded: 1959, accreditation: 'NUC Accredited' },
    tags: ['Nigeria', 'West Africa', 'Fastest Growing', 'Large'],
  },
  {
    code: 'HELDERBERG-COLLEGE',
    name: 'Helderberg College',
    type: 'education',
    country: 'South Africa',
    region: 'Southern Africa-Indian Ocean Division',
    yearFounded: 1894,
    website: 'https://helderberg.ac.za',
    description: 'Located in Somerset West, Western Cape. One of the oldest Adventist institutions in Africa. Focuses on theology, business and education.',
    stats: { enrollment: 1200, programs: 25, yearFounded: 1894 },
    tags: ['South Africa', 'Cape Town', 'Historic', 'Theology'],
  },
  // ── EDUCATION — ASIA-PACIFIC ─────────────────────────────────────────────────
  {
    code: 'AIIAS-PHILIPPINES',
    name: 'Adventist International Institute of Advanced Studies (AIIAS)',
    type: 'education',
    country: 'Philippines',
    region: 'Southern Asia-Pacific Division',
    yearFounded: 1983,
    website: 'https://aiias.edu',
    description: 'Located in Silang, Cavite, Philippines. The Adventist postgraduate research university for Asia and the Pacific. Doctoral programs in theology, education and business.',
    stats: { enrollment: 600, programs: 20, yearFounded: 1983, level: 'Postgraduate only', countries: 40 },
    tags: ['Philippines', 'Postgraduate', 'Research', 'Asia-Pacific'],
  },
  {
    code: 'ASIA-PACIFIC-INTL-UNIV',
    name: 'Asia-Pacific International University',
    type: 'education',
    country: 'Thailand',
    region: 'Southern Asia-Pacific Division',
    yearFounded: 1928,
    website: 'https://apiu.edu',
    description: 'Located in Muak Lek, Saraburi, Thailand. Serves Adventist students from Southeast Asia with an international campus community.',
    stats: { enrollment: 1100, countries: 30, programs: 25, yearFounded: 1928 },
    tags: ['Thailand', 'Southeast Asia', 'International'],
  },
  {
    code: 'SPICER-ADVENTIST-UNIV',
    name: 'Spicer Adventist University',
    type: 'education',
    country: 'India',
    region: 'Southern Asia Division',
    yearFounded: 1915,
    website: 'https://spicer.edu',
    description: "Located in Pune, Maharashtra. One of India's oldest Adventist institutions. Strong theology, education and nursing programs serving the South Asian Division.",
    stats: { enrollment: 1500, programs: 30, yearFounded: 1915 },
    tags: ['India', 'Pune', 'South Asia', 'Historic'],
  },
]

// ─── ACNC data ────────────────────────────────────────────────────────────────
// Migrated from frontend/lib/acnc-data.ts — keep in sync when that file changes.
// All figures in AUD. Sources: ACNC public register.

const ACNC_DATA = [
  {
    institutionCode: null,
    name: 'South NSW Conference',
    abn: '68 000 943 010',
    acncUrl: 'https://www.acnc.gov.au/charity/charities/search?name=south+nsw+conference',
    type: 'conference',
    financialYear: '2022-23',
    totalRevenue: 28000000,
    totalExpenses: 26000000,
    totalAssets: 45000000,
    netAssets: 19000000,
    verified: false,
    notes: 'Estimated from public sources. Verify against ACNC filing.',
  },
  {
    institutionCode: null,
    name: 'North NSW Conference',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'conference',
    financialYear: '2022-23',
    totalRevenue: 32000000,
    totalExpenses: 30000000,
    totalAssets: 52000000,
    netAssets: 22000000,
    verified: false,
  },
  {
    institutionCode: null,
    name: 'Victorian Conference',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'conference',
    financialYear: '2022-23',
    totalRevenue: 35000000,
    totalExpenses: 32000000,
    totalAssets: 58000000,
    netAssets: 26000000,
    verified: false,
  },
  {
    institutionCode: null,
    name: 'South Pacific Division',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'conference',
    financialYear: '2022-23',
    totalRevenue: 45000000,
    totalExpenses: 42000000,
    totalAssets: 80000000,
    netAssets: 38000000,
    verified: false,
  },
  {
    institutionCode: 'ADRA-AUSTRALIA',
    name: 'ADRA Australia',
    abn: '91 032 680 953',
    acncUrl: 'https://www.acnc.gov.au/charity/charities/2d062a59-39af-e811-a961-000d3ad24182/profile',
    type: 'charity',
    financialYear: '2022-23',
    totalRevenue: 21000000,
    totalExpenses: 17500000,
    totalAssets: 30000000,
    netAssets: 22000000,
    programExpenditure: 16000000,
    adminExpenditure: 1500000,
    verified: false,
    notes: 'Total assets ~$30M confirmed. Revenue/expense figures estimated. Kyle Morrison, March 2026.',
  },
  {
    institutionCode: 'SAH-SYDNEY',
    name: 'Adventist Healthcare Limited (SAH)',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'hospital',
    financialYear: '2022-23',
    totalRevenue: 325000000,
    totalExpenses: 320000000,
    totalAssets: 280000000,
    netAssets: 95000000,
    verified: false,
    notes: 'Restructuring in 2022 resulted in operating deficit. Estimates based on Annual Report (public).',
  },
  {
    institutionCode: 'AVONDALE-AU',
    name: 'Avondale University College',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'school',
    financialYear: '2022-23',
    totalRevenue: 42000000,
    totalExpenses: 40000000,
    totalAssets: 95000000,
    netAssets: 55000000,
    verified: false,
  },
  {
    institutionCode: 'SIGNS-PUBLISHING',
    name: 'Signs Publishing Company',
    abn: null,
    acncUrl: 'https://www.acnc.gov.au',
    type: 'media',
    financialYear: '2022-23',
    totalRevenue: 8000000,
    totalExpenses: 7500000,
    totalAssets: 12000000,
    netAssets: 4500000,
    verified: false,
  },
]

// ─── Mongoose schemas (inline — avoids importing app models / circular deps) ──

const trajectoryDataSchema = new mongoose.Schema({
  year:  { type: Number, required: true },
  value: { type: Number, required: true },
}, { _id: false })

const trajectoryItemSchema = new mongoose.Schema({
  metric:     String,
  source:     String,
  unit:       String,
  color:      String,
  isEstimate: { type: Boolean, default: true },
  data:       [trajectoryDataSchema],
}, { _id: false })

const institutionSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:           { type: String, required: true, trim: true },
  type:           { type: String, required: true },
  country:        { type: String, required: true },
  region:         { type: String, required: true },
  conferenceCode: { type: String, default: null },
  yearFounded:    Number,
  website:        String,
  description:    String,
  stats:          { type: mongoose.Schema.Types.Mixed, default: {} },
  tags:           [String],
  contextNote:    { type: String, default: null },
  trajectory:     [trajectoryItemSchema],
  acncAbn:        { type: String, default: null },
  acncUrl:        { type: String, default: null },
  dataVerified:   { type: Boolean, default: false },
  dataSource:     { type: String, default: null },
  lastVerifiedAt: { type: Date, default: null },
  lastVerifiedBy: { type: String, default: null },
  active:         { type: Boolean, default: true },
}, { timestamps: true })

const acncEntrySchema = new mongoose.Schema({
  institutionCode:    { type: String, default: null },
  name:               { type: String, required: true, trim: true },
  abn:                { type: String, default: null, trim: true },
  acncUrl:            { type: String, default: null },
  type:               { type: String, required: true },
  financialYear:      { type: String, required: true },
  totalRevenue:       { type: Number, default: null },
  totalExpenses:      { type: Number, default: null },
  totalAssets:        { type: Number, default: null },
  netAssets:          { type: Number, default: null },
  programExpenditure: { type: Number, default: null },
  adminExpenditure:   { type: Number, default: null },
  notes:              { type: String, default: null },
  verified:           { type: Boolean, default: false },
  active:             { type: Boolean, default: true },
}, { timestamps: true })

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🔗  Connecting to MongoDB...`)
  await mongoose.connect(MONGO_URI)
  console.log(`✅  Connected\n`)

  // Register models (safe to re-register in scripts)
  const Institution = mongoose.models.Institution || mongoose.model('Institution', institutionSchema)
  const ACNCEntry   = mongoose.models.ACNCEntry   || mongoose.model('ACNCEntry',   acncEntrySchema)

  let institutionsUpserted = 0
  let acncUpserted = 0

  // ── Institutions ────────────────────────────────────────────────────────────
  console.log(`📚  Seeding ${INSTITUTIONS.length} institutions...`)

  for (const inst of INSTITUTIONS) {
    if (isDryRun) {
      console.log(`  [dry-run] Would upsert: ${inst.code} — ${inst.name}`)
      institutionsUpserted++
      continue
    }

    await Institution.updateOne(
      { code: inst.code.toUpperCase() },
      { $set: { ...inst, code: inst.code.toUpperCase(), active: true } },
      { upsert: true }
    )
    institutionsUpserted++
  }

  // ── ACNC entries ────────────────────────────────────────────────────────────
  console.log(`\n💰  Seeding ${ACNC_DATA.length} ACNC entries...`)

  for (const entry of ACNC_DATA) {
    if (isDryRun) {
      console.log(`  [dry-run] Would upsert: ${entry.name} (${entry.financialYear})`)
      acncUpserted++
      continue
    }

    await ACNCEntry.updateOne(
      { name: entry.name, financialYear: entry.financialYear },
      { $set: { ...entry, active: true } },
      { upsert: true }
    )
    acncUpserted++
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${isDryRun ? '🔍 Dry run complete' : '✓  Done'}`)
  console.log(`   Upserted ${institutionsUpserted} institutions`)
  console.log(`   Upserted ${acncUpserted} ACNC entries`)

  if (!isDryRun) {
    const totalInstitutions = await Institution.countDocuments({ active: true })
    const totalACNC = await ACNCEntry.countDocuments({ active: true })
    console.log(`\n📊  DB totals: ${totalInstitutions} active institutions, ${totalACNC} active ACNC entries`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

main().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
