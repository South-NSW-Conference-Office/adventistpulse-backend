/**
 * Spiritual Gifts Assessment Questions — Adaptive Two-Phase Model
 *
 * 110 questions total:
 *   22 anchor questions  (phase: 'screening') — one per gift, Phase 1
 *   88 deep-dive questions (phase: 'deep')    — 4 per gift, Phase 2
 *
 * Gifts covered (22): administration, apostleship, craftsmanship, discernment,
 * encouragement, evangelism, faith, giving, healing, helps, hospitality,
 * intercession, knowledge, leadership, mercy, miracles, prophecy, shepherding,
 * teaching, tongues*, wisdom, worship
 *
 * * tongues is excluded from the Adventist version — see getAdventistQuestions()
 *
 * All statements are first-person behavioural ("I do…"), not aspirational.
 * Answered on a 1–5 Likert scale:
 *   1 = Never true of me  2 = Rarely  3 = Sometimes  4 = Often  5 = Almost always
 *
 * reverse: true  →  scoring engine applies adjustedScore = 6 - rawScore
 * order          →  display order within the phase (screening: 1–22; deep: 1–4 per gift)
 */

export const questions = [

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 1 — SCREENING ANCHORS (22 questions)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'a_administration',
    giftId: 'administration',
    phase: 'screening',
    reverse: false,
    order: 1,
    text: 'When a project needs to get done, I am the one who builds the plan, assigns specific tasks to specific people, and tracks progress through to completion — not just in theory, but in practice.',
  },
  {
    id: 'a_apostleship',
    giftId: 'apostleship',
    phase: 'screening',
    reverse: false,
    order: 2,
    text: 'I have personally taken initiative to start a new ministry, church group, or faith community in a place where one did not exist — and I find starting new things more energising than developing what already exists.',
  },
  {
    id: 'a_craftsmanship',
    giftId: 'craftsmanship',
    phase: 'screening',
    reverse: false,
    order: 3,
    text: 'I regularly use hands-on or creative skills — building, repairing, designing, or making things — to serve the church or community, and I find this work more satisfying than sitting in a meeting about it.',
  },
  {
    id: 'a_discernment',
    giftId: 'discernment',
    phase: 'screening',
    reverse: false,
    order: 4,
    text: 'When I hear a teaching or observe a situation, I quickly sense whether it aligns with Scripture or is subtly off — even before I can fully articulate why — and I have been validated when I raised that concern.',
  },
  {
    id: 'a_encouragement',
    giftId: 'encouragement',
    phase: 'screening',
    reverse: false,
    order: 5,
    text: 'When people are on the verge of giving up, I am the one who finds the specific words that give them the energy to keep going — and they tell me that conversation made the difference.',
  },
  {
    id: 'a_evangelism',
    giftId: 'evangelism',
    phase: 'screening',
    reverse: false,
    order: 6,
    text: 'I regularly have intentional conversations with people who don\'t believe in Jesus, specifically about faith, and I find those interactions energising rather than awkward.',
  },
  {
    id: 'a_faith',
    giftId: 'faith',
    phase: 'screening',
    reverse: false,
    order: 7,
    text: 'When a situation looks impossible and others have given up, I remain genuinely convinced that God will act — and I push the group to keep moving forward on that basis.',
  },
  {
    id: 'a_giving',
    giftId: 'giving',
    phase: 'screening',
    reverse: false,
    order: 8,
    text: 'I deliberately set aside more money than expected to give — to ministry, to people in need, to causes I believe in — not out of obligation but because directing resources toward God\'s work gives me real joy.',
  },
  {
    id: 'a_healing',
    giftId: 'healing',
    phase: 'screening',
    reverse: false,
    order: 9,
    text: 'I specifically and boldly pray for people\'s physical or emotional healing, and I have personally witnessed God restore people in ways that are not easily explained by natural causes.',
  },
  {
    id: 'a_helps',
    giftId: 'helps',
    phase: 'screening',
    reverse: false,
    order: 10,
    text: 'I notice unmet practical tasks at church or in the community and quietly handle them — setting up chairs, running errands, fixing things — without being asked and without needing recognition.',
  },
  {
    id: 'a_hospitality',
    giftId: 'hospitality',
    phase: 'screening',
    reverse: false,
    order: 11,
    text: 'I regularly invite people — especially strangers, newcomers, or isolated individuals — into my home or to share a meal, and I put real effort into making them feel genuinely at ease.',
  },
  {
    id: 'a_intercession',
    giftId: 'intercession',
    phase: 'screening',
    reverse: false,
    order: 12,
    text: 'I set aside regular extended blocks of time to pray specifically for people and situations — and I maintain a list so I can track how God answers those prayers.',
  },
  {
    id: 'a_knowledge',
    giftId: 'knowledge',
    phase: 'screening',
    reverse: false,
    order: 13,
    text: 'I regularly spend significant time studying Scripture and theological material beyond what any ministry role requires — not as homework, but because I genuinely love understanding what the text means.',
  },
  {
    id: 'a_leadership',
    giftId: 'leadership',
    phase: 'screening',
    reverse: false,
    order: 14,
    text: 'When a group lacks direction, people naturally look to me to set the vision and organise the effort — and I have a track record of actually getting groups moving toward a goal.',
  },
  {
    id: 'a_mercy',
    giftId: 'mercy',
    phase: 'screening',
    reverse: false,
    order: 15,
    text: 'I am deeply moved by people in suffering and consistently take action to help — especially people others tend to overlook: the lonely, the grieving, the marginalised.',
  },
  {
    id: 'a_miracles',
    giftId: 'miracles',
    phase: 'screening',
    reverse: false,
    order: 16,
    text: 'I pray boldly for supernatural intervention in situations others consider hopeless, and I have personally witnessed events that cannot be explained by natural causes.',
  },
  {
    id: 'a_prophecy',
    giftId: 'prophecy',
    phase: 'screening',
    reverse: false,
    order: 17,
    text: 'I feel a strong sense of what God wants to say to a specific person or group — and when I speak it, people tell me it was exactly what they needed to hear at that moment.',
  },
  {
    id: 'a_shepherding',
    giftId: 'shepherding',
    phase: 'screening',
    reverse: false,
    order: 18,
    text: 'I take personal responsibility for the ongoing spiritual growth of a small group of people — checking in on them regularly, knowing their struggles, and walking with them through multiple seasons.',
  },
  {
    id: 'a_teaching',
    giftId: 'teaching',
    phase: 'screening',
    reverse: false,
    order: 19,
    text: 'I prepare and deliver Bible teaching that helps people truly understand Scripture — not just hear information — and learners regularly tell me that my lessons changed the way they think.',
  },
  {
    id: 'a_tongues',
    giftId: 'tongues',
    phase: 'screening',
    reverse: false,
    order: 20,
    text: 'I have an unusual ability to communicate across language and cultural barriers — I pick up languages quickly, feel drawn to people from other linguistic communities, and sense a burden to take the gospel to people in their mother tongue.',
  },
  {
    id: 'a_wisdom',
    giftId: 'wisdom',
    phase: 'screening',
    reverse: false,
    order: 21,
    text: 'When people are stuck in difficult decisions, I naturally bring perspective that cuts through the complexity — identifying the thing they\'re not seeing — and they seek me out specifically for this.',
  },
  {
    id: 'a_worship',
    giftId: 'worship',
    phase: 'screening',
    reverse: false,
    order: 22,
    text: 'I use music, creative arts, or other expressive forms to lead people into worship — not just to perform — and others tell me that what I do draws them closer to God.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  //  PHASE 2 — DEEP DIVE (88 questions, 4 per gift)
  //  At least 1 reverse-scored question per gift (marked reverse: true)
  //  Only shown for candidate gifts — max 20 per user
  // ══════════════════════════════════════════════════════════════════════════

  // ── Administration ────────────────────────────────────────────────────────
  {
    id: 'd_administration_1',
    giftId: 'administration',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly build written plans, assign tasks to specific people, and follow up to make sure nothing has been missed — even on relatively small ministry projects.',
  },
  {
    id: 'd_administration_2',
    giftId: 'administration',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When a ministry project fails, my instinct is to analyse what went wrong in the process and redesign the system — not just to regroup emotionally.',
  },
  {
    id: 'd_administration_3',
    giftId: 'administration',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'Others have told me that the way I organise things takes a burden off their shoulders and helps them do their best work.',
  },
  {
    id: 'd_administration_4',
    giftId: 'administration',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I prefer to let things develop organically rather than creating plans and structures in advance — I find heavy process constraining.',
  },

  // ── Apostleship ──────────────────────────────────────────────────────────
  {
    id: 'd_apostleship_1',
    giftId: 'apostleship',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I have personally initiated a ministry, faith community, or church group that did not exist before — rather than joining an existing one.',
  },
  {
    id: 'd_apostleship_2',
    giftId: 'apostleship',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel more energised working in a new cultural context where the gospel hasn\'t taken root than refining something that\'s already established and running.',
  },
  {
    id: 'd_apostleship_3',
    giftId: 'apostleship',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'Others have described me as a pioneer — someone who starts things and then moves on to the next frontier rather than staying to maintain what was built.',
  },
  {
    id: 'd_apostleship_4',
    giftId: 'apostleship',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I prefer to nurture and develop what already exists rather than going to new places or contexts to start something from scratch.',
  },

  // ── Craftsmanship ─────────────────────────────────────────────────────────
  {
    id: 'd_craftsmanship_1',
    giftId: 'craftsmanship',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly volunteer to handle building, repair, or creative projects for church even when it takes significant personal time and no one else will know I did it.',
  },
  {
    id: 'd_craftsmanship_2',
    giftId: 'craftsmanship',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I complete a physical or creative project that serves the church, I feel a deep sense that this is my genuine contribution to God\'s work — not a consolation prize.',
  },
  {
    id: 'd_craftsmanship_3',
    giftId: 'craftsmanship',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People in my church know that if something needs to be built, fixed, or designed for ministry, I am the person to call.',
  },
  {
    id: 'd_craftsmanship_4',
    giftId: 'craftsmanship',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find physical and creative tasks draining — I\'d rather serve through conversation, teaching, or relational ministry than making or fixing things.',
  },

  // ── Discernment ───────────────────────────────────────────────────────────
  {
    id: 'd_discernment_1',
    giftId: 'discernment',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I have specifically warned a leader or community about a teaching or person that later proved to be problematic — and my concern was validated.',
  },
  {
    id: 'd_discernment_2',
    giftId: 'discernment',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I notice inconsistencies between what someone says and how they actually behave, and this awareness actively shapes how I respond to them.',
  },
  {
    id: 'd_discernment_3',
    giftId: 'discernment',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People consult me when they\'re unsure whether a ministry direction or a teaching aligns with Scripture, because they trust my read on it.',
  },
  {
    id: 'd_discernment_4',
    giftId: 'discernment',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I generally take what I hear at face value and don\'t tend to question whether the underlying motives or theology are sound.',
  },

  // ── Encouragement ─────────────────────────────────────────────────────────
  {
    id: 'd_encouragement_1',
    giftId: 'encouragement',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I proactively reach out to people I sense are struggling — even if they haven\'t asked — with specific words, a note, or a visit.',
  },
  {
    id: 'd_encouragement_2',
    giftId: 'encouragement',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel a strong internal pull to challenge people to take their next step of growth, even when I know that conversation might be uncomfortable.',
  },
  {
    id: 'd_encouragement_3',
    giftId: 'encouragement',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People regularly tell me that something I said or wrote came to them at exactly the right moment and helped them keep going.',
  },
  {
    id: 'd_encouragement_4',
    giftId: 'encouragement',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find it awkward to initiate conversations about someone\'s personal struggles — I prefer to wait until they bring it up themselves.',
  },

  // ── Evangelism ────────────────────────────────────────────────────────────
  {
    id: 'd_evangelism_1',
    giftId: 'evangelism',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'In the past month, I have had at least one deliberate conversation with a non-believing person specifically about faith — not just a friendly interaction.',
  },
  {
    id: 'd_evangelism_2',
    giftId: 'evangelism',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I meet someone who doesn\'t know Jesus, I feel a genuine internal desire to share my faith — not obligation or duty, but wanting to.',
  },
  {
    id: 'd_evangelism_3',
    giftId: 'evangelism',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People have told me that my testimony or explanation of the gospel was what moved them to take a step toward faith.',
  },
  {
    id: 'd_evangelism_4',
    giftId: 'evangelism',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'Sharing my faith with strangers or acquaintances feels forced or uncomfortable — I\'d rather show my faith through how I live than through direct conversation.',
  },

  // ── Faith ─────────────────────────────────────────────────────────────────
  {
    id: 'd_faith_1',
    giftId: 'faith',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I have stepped out on a specific commitment — financially, relationally, or in ministry — trusting God before all the practical details were confirmed.',
  },
  {
    id: 'd_faith_2',
    giftId: 'faith',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When others around me are anxious about an uncertain situation, I find myself genuinely confident that God will come through — not performing confidence, but actually feeling it.',
  },
  {
    id: 'd_faith_3',
    giftId: 'faith',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People have told me that my confidence in God\'s provision helped them keep going when they were ready to quit.',
  },
  {
    id: 'd_faith_4',
    giftId: 'faith',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find it difficult to commit to something until I can see how all the practical details will work out — I need a clear plan before I move.',
  },

  // ── Giving ────────────────────────────────────────────────────────────────
  {
    id: 'd_giving_1',
    giftId: 'giving',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly review my finances specifically looking for ways to give more — not when asked, but as a personal discipline I return to.',
  },
  {
    id: 'd_giving_2',
    giftId: 'giving',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I hear about a genuine need — a family in crisis, a ministry underfunded — my first instinct is to think about how I can contribute financially, not just to pray.',
  },
  {
    id: 'd_giving_3',
    giftId: 'giving',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People in my life know me as someone who gives quietly and consistently — not for recognition, but because directing resources matters deeply to me.',
  },
  {
    id: 'd_giving_4',
    giftId: 'giving',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find it genuinely difficult to part with money even for good causes — I tend to deliberate at length before any significant financial gift.',
  },

  // ── Healing ───────────────────────────────────────────────────────────────
  {
    id: 'd_healing_1',
    giftId: 'healing',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I specifically ask to pray for people\'s physical healing — not just general comfort prayers, but bold, targeted prayer for restoration.',
  },
  {
    id: 'd_healing_2',
    giftId: 'healing',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I am with someone who is sick, I feel a genuine sense of spiritual calling — not just sympathy, but a specific pull to intercede for their healing.',
  },
  {
    id: 'd_healing_3',
    giftId: 'healing',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People who are seriously ill seek me out for prayer because they have experienced, or heard about, God working through my prayers.',
  },
  {
    id: 'd_healing_4',
    giftId: 'healing',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I feel uncertain and out of my depth when asked to pray specifically for someone\'s physical healing — I\'m not sure that\'s really my role.',
  },

  // ── Helps / Service ───────────────────────────────────────────────────────
  {
    id: 'd_helps_1',
    giftId: 'helps',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I spot practical things that need doing at church events or in people\'s homes and handle them without being asked, without waiting for recognition.',
  },
  {
    id: 'd_helps_2',
    giftId: 'helps',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I find it more satisfying to support someone else\'s ministry by handling background tasks and logistics than to lead or be visible myself.',
  },
  {
    id: 'd_helps_3',
    giftId: 'helps',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'Leaders in my church rely on me to handle practical details because they know I will show up, follow through, and not need to be thanked.',
  },
  {
    id: 'd_helps_4',
    giftId: 'helps',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find repetitive behind-the-scenes tasks unfulfilling — I prefer roles where I can see the visible, direct impact of my contribution.',
  },

  // ── Hospitality ───────────────────────────────────────────────────────────
  {
    id: 'd_hospitality_1',
    giftId: 'hospitality',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'In the past two months, I have specifically invited a newcomer, stranger, or isolated person to my home or to a shared meal.',
  },
  {
    id: 'd_hospitality_2',
    giftId: 'hospitality',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I notice someone standing alone at a gathering, I feel a genuine pull to go and include them — not because I\'m supposed to, but because I want to.',
  },
  {
    id: 'd_hospitality_3',
    giftId: 'hospitality',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People who were new to our church tell me that an invitation or welcome I extended to them is part of why they stayed.',
  },
  {
    id: 'd_hospitality_4',
    giftId: 'hospitality',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find it draining to host people in my home or to put sustained energy into making newcomers feel welcome — it doesn\'t come naturally to me.',
  },

  // ── Intercession ──────────────────────────────────────────────────────────
  {
    id: 'd_intercession_1',
    giftId: 'intercession',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I keep a written or recorded prayer list and I update it regularly — tracking what I\'ve prayed for and noting when God has answered.',
  },
  {
    id: 'd_intercession_2',
    giftId: 'intercession',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I hear about a need — in conversation, in the news, from a friend — I feel an immediate internal urgency to stop and pray right then, not just mentally note it.',
  },
  {
    id: 'd_intercession_3',
    giftId: 'intercession',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People bring their most serious, urgent needs to me specifically because they trust that I will genuinely and persistently pray — not just once.',
  },
  {
    id: 'd_intercession_4',
    giftId: 'intercession',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find extended periods of dedicated prayer difficult to sustain — my mind wanders and I tend to prefer other forms of spiritual engagement.',
  },

  // ── Knowledge ─────────────────────────────────────────────────────────────
  {
    id: 'd_knowledge_1',
    giftId: 'knowledge',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly study Scripture and theological material beyond anything a ministry role requires — out of personal curiosity and love for understanding.',
  },
  {
    id: 'd_knowledge_2',
    giftId: 'knowledge',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I discover a new insight about a biblical text, I feel compelled to share it — and I organise what I learn so I can explain it clearly to others.',
  },
  {
    id: 'd_knowledge_3',
    giftId: 'knowledge',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People bring me their hard biblical or theological questions because they know I\'ve done the research and can give a careful, well-grounded answer.',
  },
  {
    id: 'd_knowledge_4',
    giftId: 'knowledge',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find deep theological or biblical study tedious — I\'d rather apply what I know practically in ministry than spend time in careful academic study of texts.',
  },

  // ── Leadership ────────────────────────────────────────────────────────────
  {
    id: 'd_leadership_1',
    giftId: 'leadership',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'When I look at a group or organisation, I can quickly identify what\'s missing and envision a better direction — and I take steps to act on that, not just observe.',
  },
  {
    id: 'd_leadership_2',
    giftId: 'leadership',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel most energised in ministry when I am setting direction and mobilising others toward it — not when I\'m executing someone else\'s plan.',
  },
  {
    id: 'd_leadership_3',
    giftId: 'leadership',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People follow my lead even in contexts where I haven\'t been formally appointed as a leader — my influence is relational and earned, not just positional.',
  },
  {
    id: 'd_leadership_4',
    giftId: 'leadership',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I prefer to work within an established structure and carry out someone else\'s vision rather than setting the agenda or direction myself.',
  },

  // ── Mercy ─────────────────────────────────────────────────────────────────
  {
    id: 'd_mercy_1',
    giftId: 'mercy',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly visit or contact people who are suffering — the grieving, the sick, the lonely — even when it is inconvenient and emotionally costly for me.',
  },
  {
    id: 'd_mercy_2',
    giftId: 'mercy',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I see or hear about suffering, I feel it personally — not just intellectually — and I find I can\'t move on until I\'ve done something concrete to help.',
  },
  {
    id: 'd_mercy_3',
    giftId: 'mercy',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People in pain are drawn to me — I regularly find that hurting people open up to me in ways they don\'t with others, even without much prompting.',
  },
  {
    id: 'd_mercy_4',
    giftId: 'mercy',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I believe that while compassion matters, it\'s important not to let others\' emotional needs consume too much of my personal time and energy.',
  },

  // ── Miracles ──────────────────────────────────────────────────────────────
  {
    id: 'd_miracles_1',
    giftId: 'miracles',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I have prayed specifically for a miracle in a situation that seemed humanly hopeless — and I have personally witnessed the outcome in a way that defied natural explanation.',
  },
  {
    id: 'd_miracles_2',
    giftId: 'miracles',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When a situation is described as impossible, I feel spiritual alertness rather than resignation — a sense that this is exactly where God acts.',
  },
  {
    id: 'd_miracles_3',
    giftId: 'miracles',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People who know me associate me with extraordinary answers to prayer or supernatural events that they themselves witnessed in connection with my ministry.',
  },
  {
    id: 'd_miracles_4',
    giftId: 'miracles',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I am genuinely cautious about claiming miraculous events — I think God typically works through natural means and I\'m hesitant to attribute things to the supernatural.',
  },

  // ── Prophecy ──────────────────────────────────────────────────────────────
  {
    id: 'd_prophecy_1',
    giftId: 'prophecy',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I have spoken a specific message to an individual or group that I believed was from God — and they confirmed it addressed exactly what they were facing in a way I couldn\'t have known.',
  },
  {
    id: 'd_prophecy_2',
    giftId: 'prophecy',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel an internal urgency to speak truth — especially uncomfortable truth — to people or communities who need to hear it, regardless of the social cost.',
  },
  {
    id: 'd_prophecy_3',
    giftId: 'prophecy',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People have told me that something I said seemed directly from God — that it addressed their hidden situation in a way that went beyond natural insight.',
  },
  {
    id: 'd_prophecy_4',
    giftId: 'prophecy',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I am uncomfortable claiming that God has given me a specific message to share — I prefer to speak only from careful, grounded study of Scripture.',
  },

  // ── Shepherding / Pastoring ───────────────────────────────────────────────
  {
    id: 'd_shepherding_1',
    giftId: 'shepherding',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I currently have a small group of people whose ongoing spiritual growth I feel personally responsible for — and I actively and regularly check in on them.',
  },
  {
    id: 'd_shepherding_2',
    giftId: 'shepherding',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel a deep, ongoing sense of responsibility for the spiritual wellbeing of people in my care — not just when they ask for help, but proactively.',
  },
  {
    id: 'd_shepherding_3',
    giftId: 'shepherding',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People I have cared for over time say I am the person who never gave up on them — who was consistently present through multiple difficult seasons.',
  },
  {
    id: 'd_shepherding_4',
    giftId: 'shepherding',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find long-term pastoral care exhausting — I prefer short-term, high-impact ministry interactions over sustained, slow relational investment.',
  },

  // ── Teaching ──────────────────────────────────────────────────────────────
  {
    id: 'd_teaching_1',
    giftId: 'teaching',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly prepare Bible lessons or theological content structured to help others understand and apply it — not just notes for myself.',
  },
  {
    id: 'd_teaching_2',
    giftId: 'teaching',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I get a specific satisfaction from watching someone\'s face when a complex idea suddenly clicks — that moment of understanding is what drives me to prepare well.',
  },
  {
    id: 'd_teaching_3',
    giftId: 'teaching',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People who have sat under my teaching say it changed how they read the Bible — not just what they know, but the way they actually think about it.',
  },
  {
    id: 'd_teaching_4',
    giftId: 'teaching',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I find lesson preparation laborious and draining — I prefer to learn from others rather than being the one who prepares and delivers teaching to a group.',
  },

  // ── Tongues ───────────────────────────────────────────────────────────────
  // Grounded in Acts 2 (xenolalia — real human languages for cross-cultural mission)
  // not in Pentecostal ecstatic speech theology. Included in Adventist version.
  {
    id: 'd_tongues_1',
    giftId: 'tongues',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I absorb new languages with unusual speed and ease — patterns, grammar, and pronunciation come to me more naturally than to most people I know.',
  },
  {
    id: 'd_tongues_2',
    giftId: 'tongues',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel a specific and recurring burden for people who cannot access the gospel in their mother tongue — unreached language groups, migrants, or minority communities in my own city.',
  },
  {
    id: 'd_tongues_3',
    giftId: 'tongues',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People from other cultures seem to trust me quickly — I find cross-cultural environments energising, and I am often drawn to the edges where different communities meet.',
  },
  {
    id: 'd_tongues_4',
    giftId: 'tongues',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I struggle to connect with people whose cultural background or language is very different from my own, and I tend to do my best ministry within my own cultural context.',
  },

  // ── Wisdom ────────────────────────────────────────────────────────────────
  {
    id: 'd_wisdom_1',
    giftId: 'wisdom',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'When people bring me complex decisions, I can usually identify the key issue — the thing they\'re missing — and offer a path forward they hadn\'t considered.',
  },
  {
    id: 'd_wisdom_2',
    giftId: 'wisdom',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'I feel most useful when I help someone navigate a difficult decision — not by telling them what to do, but by helping them see more clearly.',
  },
  {
    id: 'd_wisdom_3',
    giftId: 'wisdom',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People seek out my perspective before major decisions because my counsel tends to be calm, practical, and spiritually grounded — and it usually proves right.',
  },
  {
    id: 'd_wisdom_4',
    giftId: 'wisdom',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I am hesitant to give advice — I tend to think I don\'t have enough information and prefer to listen and reflect rather than offer direction.',
  },

  // ── Worship ───────────────────────────────────────────────────────────────
  {
    id: 'd_worship_1',
    giftId: 'worship',
    phase: 'deep',
    reverse: false,
    order: 1,
    text: 'I regularly invest time preparing and leading worship experiences — planning music, liturgy, or creative elements specifically so others can encounter God.',
  },
  {
    id: 'd_worship_2',
    giftId: 'worship',
    phase: 'deep',
    reverse: false,
    order: 2,
    text: 'When I am leading worship, I feel a strong sense of connection between what I am doing and what the congregation is experiencing — I can feel when it\'s working.',
  },
  {
    id: 'd_worship_3',
    giftId: 'worship',
    phase: 'deep',
    reverse: false,
    order: 3,
    text: 'People have told me that an act of worship I led — music, prayer, creative expression — brought them into an encounter with God they hadn\'t expected.',
  },
  {
    id: 'd_worship_4',
    giftId: 'worship',
    phase: 'deep',
    reverse: true,
    order: 4,
    text: 'I engage deeply in personal worship but feel genuinely uncomfortable or out of my depth when leading others in a formal or public worship setting.',
  },
]

// ── Convenience const exports ─────────────────────────────────────────────────

/** All 22 anchor questions (Phase 1 — standard version) */
export const screeningQuestions = questions.filter(q => q.phase === 'screening')

/** All 88 deep-dive questions (Phase 2 — standard version) */
export const deepQuestions = questions.filter(q => q.phase === 'deep')

// ── Gift IDs excluded from the Adventist version ─────────────────────────────
const ADVENTIST_EXCLUDED = ['tongues']

/**
 * Screening (anchor) questions only — Phase 1.
 * @param {string} version - 'adventist' | 'standard'
 * @returns {Array} 21 or 22 anchor questions
 */
export function getScreeningQuestions(version = 'adventist') {
  return questions.filter(q => {
    if (q.phase !== 'screening') return false
    if (version === 'adventist' && ADVENTIST_EXCLUDED.includes(q.giftId)) return false
    return true
  })
}

/**
 * Deep-dive questions for a specific set of gift IDs.
 * @param {string[]} giftIds - candidate gift IDs
 * @param {string} version - 'adventist' | 'standard'
 * @returns {Array} deep questions for those gifts only
 */
export function getDeepQuestionsForGifts(giftIds, version = 'adventist') {
  const giftSet = new Set(giftIds)
  return questions.filter(q => {
    if (q.phase !== 'deep') return false
    if (!giftSet.has(q.giftId)) return false
    if (version === 'adventist' && ADVENTIST_EXCLUDED.includes(q.giftId)) return false
    return true
  })
}

/**
 * All deep-dive questions (88 standard, 84 adventist).
 * Used for backward-compatible full-battery flow.
 * @param {string} version - 'adventist' | 'standard'
 */
export function getDeepQuestions(version = 'adventist') {
  return questions.filter(q => {
    if (q.phase !== 'deep') return false
    if (version === 'adventist' && ADVENTIST_EXCLUDED.includes(q.giftId)) return false
    return true
  })
}

/**
 * All questions for the Adventist version (21 anchor + 84 deep = 105 questions).
 * Backward-compatible alias.
 */
export function getAdventistQuestions() {
  return questions.filter(q => !ADVENTIST_EXCLUDED.includes(q.giftId))
}

/**
 * All 110 questions (standard version).
 * Backward-compatible alias.
 */
export function getStandardQuestions() {
  return questions
}
