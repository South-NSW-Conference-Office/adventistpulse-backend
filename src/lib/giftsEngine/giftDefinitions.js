/**
 * Spiritual Gift Definitions — Wagner-modified Houts inventory
 *
 * 23 gifts drawn from Romans 12, 1 Corinthians 12, and Ephesians 4.
 * Denomination-agnostic — no church-specific theology lives here.
 */

export const giftDefinitions = [
  {
    id: 'administration',
    name: 'Administration',
    scripture: ['1 Corinthians 12:28'],
    description:
      'The ability to understand the goals of an organisation and to devise and execute effective plans to accomplish those goals. People with this gift bring order and efficiency to group efforts.',
    ministryAreas: ['church operations', 'event planning', 'project management', 'committee leadership'],
  },
  {
    id: 'apostleship',
    name: 'Apostleship',
    scripture: ['1 Corinthians 12:28', 'Ephesians 4:11'],
    description:
      'The ability to start new churches or ministries and to oversee their development with authority and vision. People with this gift thrive in pioneer and cross-cultural settings.',
    ministryAreas: ['church planting', 'mission work', 'new ministry development', 'cross-cultural outreach'],
  },
  {
    id: 'craftsmanship',
    name: 'Craftsmanship',
    scripture: ['Exodus 31:3-5'],
    description:
      'The ability to use hands, tools, or artistic skill to build, repair, or create things that further God\'s purposes. People with this gift serve practically through construction, design, or artistry.',
    ministryAreas: ['facility maintenance', 'creative arts', 'media production', 'set design'],
  },
  {
    id: 'discernment',
    name: 'Discernment',
    scripture: ['1 Corinthians 12:10'],
    description:
      'The ability to distinguish truth from error and to sense the spiritual motivations behind actions and teachings. People with this gift protect communities from deception.',
    ministryAreas: ['spiritual counsel', 'leadership advisory', 'prayer ministry', 'mentoring'],
  },
  {
    id: 'encouragement',
    name: 'Encouragement / Exhortation',
    scripture: ['Romans 12:8'],
    description:
      'The ability to come alongside others with words of comfort, challenge, or reassurance that strengthen their faith. People with this gift help others persevere through difficulty.',
    ministryAreas: ['pastoral care', 'small groups', 'visitation', 'counselling'],
  },
  {
    id: 'evangelism',
    name: 'Evangelism',
    scripture: ['Ephesians 4:11'],
    description:
      'The ability to share the gospel in clear, compelling ways that lead people to faith. People with this gift are effective in both personal conversations and public settings.',
    ministryAreas: ['outreach', 'personal evangelism', 'public campaigns', 'community engagement'],
  },
  {
    id: 'faith',
    name: 'Faith',
    scripture: ['1 Corinthians 12:9'],
    description:
      'The ability to trust God with extraordinary confidence for things not yet seen. People with this gift inspire others to believe boldly and act on God\'s promises.',
    ministryAreas: ['prayer ministry', 'vision casting', 'fundraising', 'pioneering initiatives'],
  },
  {
    id: 'giving',
    name: 'Giving',
    scripture: ['Romans 12:8'],
    description:
      'The ability to contribute material resources with cheerfulness and liberality beyond what is expected. People with this gift fund kingdom work and meet tangible needs.',
    ministryAreas: ['benevolence', 'missions funding', 'community relief', 'stewardship'],
  },
  {
    id: 'healing',
    name: 'Healing',
    scripture: ['1 Corinthians 12:9', '1 Corinthians 12:28'],
    description:
      'The ability to serve as an instrument through whom God restores physical, emotional, or spiritual wholeness. People with this gift are drawn to ministries of restoration.',
    ministryAreas: ['health ministry', 'prayer ministry', 'hospital visitation', 'recovery programmes'],
  },
  {
    id: 'helps',
    name: 'Helps / Service',
    scripture: ['Romans 12:7', '1 Corinthians 12:28'],
    description:
      'The ability to recognise practical needs and to work behind the scenes to meet them. People with this gift free others for their own ministries by handling essential tasks.',
    ministryAreas: ['community services', 'hospitality', 'facility support', 'event logistics'],
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    scripture: ['1 Peter 4:9-10'],
    description:
      'The ability to make people feel warmly welcome and at ease, whether in one\'s home or in a group setting. People with this gift create safe environments for connection.',
    ministryAreas: ['welcoming ministry', 'small groups', 'fellowship meals', 'visitor integration'],
  },
  {
    id: 'intercession',
    name: 'Intercession',
    scripture: ['Romans 8:26-27', 'Colossians 4:12'],
    description:
      'The ability to pray for extended periods with unusual fervency and to see specific answers to prayer. People with this gift undergird every other ministry through sustained prayer.',
    ministryAreas: ['prayer ministry', 'prayer chains', 'intercessory teams', 'prayer retreats'],
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    scripture: ['1 Corinthians 12:8'],
    description:
      'The ability to discover, analyse, and systematise biblical truth for the benefit of others. People with this gift enjoy deep study and help communities understand Scripture.',
    ministryAreas: ['Bible study', 'research', 'curriculum development', 'theological education'],
  },
  {
    id: 'leadership',
    name: 'Leadership',
    scripture: ['Romans 12:8'],
    description:
      'The ability to cast vision and motivate others to work together toward a common goal. People with this gift naturally attract followers and coordinate group efforts.',
    ministryAreas: ['board leadership', 'ministry coordination', 'team building', 'strategic planning'],
  },
  {
    id: 'mercy',
    name: 'Mercy',
    scripture: ['Romans 12:8'],
    description:
      'The ability to feel genuine compassion for hurting people and to translate that empathy into practical acts of care. People with this gift gravitate toward those in distress.',
    ministryAreas: ['community services', 'hospital visitation', 'grief support', 'refugee ministry'],
  },
  {
    id: 'miracles',
    name: 'Miracles',
    scripture: ['1 Corinthians 12:10', '1 Corinthians 12:28'],
    description:
      'The ability to serve as an instrument through whom God performs supernatural acts that glorify Him. People with this gift point others to God\'s power.',
    ministryAreas: ['prayer ministry', 'evangelistic outreach', 'faith-building testimony'],
  },
  {
    id: 'prophecy',
    name: 'Prophecy',
    scripture: ['Romans 12:6', '1 Corinthians 12:10', 'Ephesians 4:11'],
    description:
      'The ability to receive and communicate a message from God that edifies, encourages, or corrects the community. People with this gift speak truth with clarity and conviction.',
    ministryAreas: ['preaching', 'teaching', 'spiritual counsel', 'writing ministry'],
  },
  {
    id: 'shepherding',
    name: 'Shepherding / Pastoring',
    scripture: ['Ephesians 4:11'],
    description:
      'The ability to assume long-term responsibility for the spiritual growth and welfare of a group of believers. People with this gift nurture, protect, and guide others.',
    ministryAreas: ['small group leadership', 'discipleship', 'pastoral care', 'mentoring'],
  },
  {
    id: 'teaching',
    name: 'Teaching',
    scripture: ['Romans 12:7', '1 Corinthians 12:28', 'Ephesians 4:11'],
    description:
      'The ability to explain Scripture and apply it to life in a way that produces understanding and growth. People with this gift make complex truths accessible.',
    ministryAreas: ['Bible classes', 'seminars', 'curriculum writing', 'mentoring'],
  },
  {
    id: 'tongues',
    name: 'Tongues',
    scripture: ['1 Corinthians 12:10', '1 Corinthians 12:28'],
    description:
      'The ability to speak in a language not previously learned, whether a human language or a spiritual utterance, as a sign or for personal edification.',
    ministryAreas: ['worship', 'personal devotion', 'cross-cultural ministry'],
  },
  {
    id: 'interpretation_of_tongues',
    name: 'Interpretation of Tongues',
    scripture: ['1 Corinthians 12:10'],
    description:
      'The ability to understand and communicate the meaning of a message spoken in tongues so the community can be edified.',
    ministryAreas: ['worship', 'corporate prayer'],
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    scripture: ['1 Corinthians 12:8'],
    description:
      'The ability to apply spiritual knowledge to specific situations and to give sound, Spirit-led counsel. People with this gift help communities navigate complex decisions.',
    ministryAreas: ['leadership advisory', 'conflict resolution', 'counselling', 'strategic planning'],
  },
  {
    id: 'worship',
    name: 'Worship',
    scripture: ['Psalm 150:3-6', 'Colossians 3:16'],
    description:
      'The ability to lead others into the presence of God through music, liturgy, or creative expression. People with this gift facilitate corporate encounters with God.',
    ministryAreas: ['music ministry', 'creative arts', 'worship planning', 'media production'],
  },
]
