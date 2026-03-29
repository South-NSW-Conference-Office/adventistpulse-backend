/**
 * Adventist-Specific Overrides for Spiritual Gifts Assessment
 *
 * Seventh-day Adventist theology does not include the active exercise
 * of tongues in its Pentecostal/charismatic form. Tongues is retained but
 * reframed as the cross-cultural missionary gift (Acts 2 xenolalia — real
 * human languages for cross-cultural mission, not ecstatic speech).
 * Interpretation of tongues is excluded. The Adventist version assesses
 * 22 gifts. This layer maps them to SDA ministry categories with EGW
 * references for devotional context on result pages.
 */

// Gifts excluded from the Adventist version of the assessment.
// Tongues is INCLUDED — grounded in Acts 2 (xenolalia: real human languages
// for cross-cultural mission) not Pentecostal ecstatic speech theology.
export const excludedGiftIds = ['interpretation_of_tongues']

/**
 * Maps each gift to SDA ministry categories and Ellen G. White references.
 * egwQuote is the primary pull-quote for display on result pages.
 * egwSource is the citation string.
 * egwReference is the legacy combined field (retained for compatibility).
 */
export const adventistGiftMap = {
  administration: {
    sdaMinistries: [
      'Conference Administration',
      'Church Board',
      'ADRA Operations',
      'Sabbath School Administration',
      'Adventist Education',
      'Church Planting Coordination',
    ],
    egwQuote: 'There is need of sharp, sanctified thinking, of earnest, persevering effort, of economy and tact, of keen foresight and sound judgment. God calls for well-laid plans, formed in the fear and strength of God, and carried out with unceasing prayerfulness.',
    egwSource: 'Testimonies for the Church, vol. 9, p. 270',
    egwReference: 'Testimonies for the Church, vol. 9, p. 270 — "There is need of sharp, sanctified thinking… God calls for well-laid plans, formed in the fear and strength of God."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Arthur G. Daniells',
      description: 'GC President 1901–1922, presided over the landmark 1901 reorganisation that created the union conference system — the most significant administrative restructuring in Adventist history.',
    },
  },
  apostleship: {
    sdaMinistries: [
      'Global Mission Pioneers',
      'Adventist Frontier Missions',
      'Adventist Volunteer Service',
      'Division Mission Departments',
      'Church Planting Networks',
      'ADRA Global Programmes',
    ],
    egwQuote: 'The church is God\'s appointed agency for the salvation of men. It was organised for service, and its mission is to carry the gospel to the world. From the beginning it has been God\'s plan that through His church shall be reflected to the world His fullness and His sufficiency.',
    egwSource: 'The Acts of the Apostles, p. 9',
    egwReference: 'The Acts of the Apostles, p. 9 — "The church is God\'s appointed agency for the salvation of men… organised for service."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'J.N. Andrews',
      description: 'First official SDA foreign missionary, sent to Switzerland in 1874. Founded the European Adventist movement and its French-language press, modelling cross-cultural pioneer sacrifice.',
    },
  },
  craftsmanship: {
    sdaMinistries: [
      'Adventist Community Services',
      'Church Building Projects',
      'ADRA Construction Teams',
      'Pathfinder Craft Honours',
      'Adventist Media and Book Centres',
      'Self-Supporting Institutions',
    ],
    egwQuote: 'Every human being, created in the image of God, is endowed with a power akin to that of the Creator — individuality, power to think and to do. The men in whom this power is developed are the men who bear responsibilities, who are leaders in enterprise, and who influence character.',
    egwSource: 'Education, p. 17',
    egwReference: 'Education, p. 17 — "Every human being, created in the image of God, is endowed with a power akin to that of the Creator — individuality, power to think and to do."',
    fundamentalBeliefs: ['FB 21 — Stewardship', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Percy Magan & Edward Sutherland (Madison College)',
      description: 'Founded Madison College in 1904, a self-supporting institution where practical craftsmanship — farming, building, trades — was integrated with spiritual education as a sacred calling.',
    },
  },
  discernment: {
    sdaMinistries: [
      'Church Elder Ministry',
      'Biblical Research Institute (BRI)',
      'Ministerial Review Committees',
      'Youth Ministry',
      'Pastoral Care Teams',
      'Andrews University Theological Seminary',
    ],
    egwQuote: 'We need keen, sanctified perception to distinguish the human from the divine, to discern between that which is of God and that which is of the enemy. Those who have not cultivated close communion with God will find themselves unable to distinguish between light and darkness when the great deceptions of the last days are upon us.',
    egwSource: 'Testimonies for the Church, vol. 5, p. 680',
    egwReference: 'Testimonies for the Church, vol. 5, p. 680 — "We need keen, sanctified perception… to distinguish between light and darkness when the great deceptions of the last days are upon us."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries', 'FB 18 — The Gift of Prophecy'],
    historicalExample: {
      person: 'Joseph Bates',
      description: 'Co-founder of Adventism, demonstrated remarkable discernment in the 1840s by publicly separating from fanatical movements while remaining open to genuine prophetic experience — including Ellen White\'s early visions.',
    },
  },
  encouragement: {
    sdaMinistries: [
      'Adventist Community Services',
      'Adventist Chaplaincy',
      'Youth Ministry and Pathfinders',
      'Small Group Ministry',
      'Prayer Ministry',
      'Hope Channel and Adventist Media',
    ],
    egwQuote: 'Words of cheer and encouragement spoken when the soul is sick and the pulse of courage is low — when the burden seems greater than can be borne — these are regarded by the Saviour as if spoken to Himself. And they are as welcome to Him as if a child of God had ministered to His wants.',
    egwSource: 'Ministry of Healing, p. 159',
    egwReference: 'Ministry of Healing, p. 159 — "Words of cheer and encouragement spoken when the soul is sick and the pulse of courage is low… are regarded by the Saviour as if spoken to Himself."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Uriah Smith',
      description: 'Editor of the Review and Herald for decades, Smith\'s editorials consistently lifted discouraged Adventists toward the Advent hope. His long service and steady voice sustained the movement through internal conflict and theological growing pains.',
    },
  },
  evangelism: {
    sdaMinistries: [
      'Public Evangelistic Series',
      'Voice of Prophecy / It Is Written',
      'Adventist World Radio (AWR)',
      'Amazing Facts / 3ABN',
      'Personal Bible Studies',
      'Health Evangelism (CHIP)',
    ],
    egwQuote: 'Every true disciple is born into the kingdom of God as a missionary. He who drinks of the living water becomes a fountain of life. The receiver becomes a giver. The grace of Christ in the soul is like a spring in the desert, welling up to refresh all.',
    egwSource: 'The Desire of Ages, p. 195',
    egwReference: 'The Desire of Ages, p. 195 — "Every true disciple is born into the kingdom of God as a missionary… The grace of Christ in the soul is like a spring in the desert."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Mark Finley',
      description: 'Speaker/Director of It Is Written 1991–2004, Finley conducted over 300 evangelistic series globally with documented baptisms in the hundreds of thousands, including Net \'95 which reached 4,000+ downlink sites simultaneously.',
    },
  },
  faith: {
    sdaMinistries: [
      'Prayer Ministry',
      'Mission Giving and Thirteenth Sabbath Offerings',
      'Adventist Frontier Missions',
      'Church Planting',
      'Literature Evangelism',
      'Medical Mission',
    ],
    egwQuote: 'Faith is trusting God — believing that He loves us and knows best what is for our good. Thus, instead of our own, it leads us to choose His way. In place of our ignorance, it accepts His wisdom; in place of our weakness, His strength; in place of our sinfulness, His righteousness.',
    egwSource: 'Steps to Christ, p. 49',
    egwReference: 'Steps to Christ, p. 49 — "Faith is trusting God — believing that He loves us and knows best what is for our good."',
    fundamentalBeliefs: ['FB 10 — Experience of Salvation', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'E.J. Waggoner',
      description: 'With A.T. Jones, Waggoner brought the message of righteousness by faith to the 1888 Minneapolis GC Session against significant institutional resistance. His faith in the message — confirmed by Ellen White as "the most precious message" — reshaped Adventist theology.',
    },
  },
  giving: {
    sdaMinistries: [
      'Tithe and Systematic Benevolence',
      'ADRA Fundraising',
      'Thirteenth Sabbath Offering Projects',
      'Church Building Funds',
      'Trust Services / Planned Giving',
      'Supporting Independent Ministries',
    ],
    egwQuote: 'God\'s plan in the tithing system is beautiful in its simplicity and equality. All may take hold of it in the assurance that they are carrying out the divine arrangement. It requires no calculation to determine what proportion is to be set aside for God. One tenth of all income is the Lord\'s.',
    egwSource: 'Counsels on Stewardship, p. 66',
    egwReference: 'Counsels on Stewardship, p. 66 — "God\'s plan in the tithing system is beautiful in its simplicity and equality… One tenth of all income is the Lord\'s."',
    fundamentalBeliefs: ['FB 21 — Stewardship', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'ADRA founders and Adventist faithful',
      description: 'ADRA\'s 1984 establishment as a GC institution was made possible by decades of faithful Adventist giving through Thirteenth Sabbath Offerings, Ingathering, and special projects — thousands of ordinary members financing a humanitarian institution of global scale.',
    },
  },
  healing: {
    sdaMinistries: [
      'Adventist Health System',
      'Loma Linda University Medical Center',
      'ADRA Health Programmes',
      'Health and Temperance Ministries',
      'CHIP (Complete Health Improvement Program)',
      'Prayer and Anointing Ministry',
      'Medical Missionary Outreach',
    ],
    egwQuote: 'Christ\'s method alone will give true success in reaching the people. The Saviour mingled with men as one who desired their good. He showed His sympathy for them, ministered to their needs, and won their confidence. Then He bade them, "Follow Me."',
    egwSource: 'Ministry of Healing, p. 143',
    egwReference: 'Ministry of Healing, p. 143 — "Christ\'s method alone will give true success in reaching the people… He showed His sympathy for them, ministered to their needs, and won their confidence."',
    fundamentalBeliefs: ['FB 22 — Christian Behaviour', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'John Harvey Kellogg',
      description: 'Superintendent of Battle Creek Sanitarium from 1876, Kellogg transformed it into America\'s most famous health institute, pioneering lifestyle medicine decades before mainstream medicine. His gift was extraordinary — his later theological divergence is a sobering lesson.',
    },
  },
  helps: {
    sdaMinistries: [
      'Adventist Community Services (ACS)',
      'ADRA Volunteer Teams',
      'Dorcas Society',
      'Church Deacon/Deaconess Ministry',
      'Transport Ministry',
      'Church Maintenance Teams',
      'Pathfinder Support Leaders',
    ],
    egwQuote: 'The humblest and poorest of the disciples of Jesus can be a blessing to others. They may not realise that they are doing any special good, but by their unconscious influence they may start waves of blessing that will widen and deepen, and the happy results they may never know until the day of final reward.',
    egwSource: 'Steps to Christ, p. 83',
    egwReference: 'Steps to Christ, p. 83 — "The humblest and poorest of the disciples of Jesus can be a blessing to others… waves of blessing that will widen and deepen."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'The Dorcas Society (established 1874)',
      description: 'The first Dorcas Society at Battle Creek church in 1874 launched a movement of thousands of local chapters providing food, clothing, and practical care. These largely unnamed women embodied helps ministry with extraordinary consistency across a century.',
    },
  },
  hospitality: {
    sdaMinistries: [
      'Small Groups and Home Church Ministry',
      'New Member Welcome Ministry',
      'Adventist Community Services',
      'Evangelistic Series Hospitality Teams',
      'Adventist University International Host Families',
      'Women\'s and Men\'s Ministries',
    ],
    egwQuote: 'Many would be greatly helped and many would be saved if Christian people would open their homes to the friendless and poor. There are in our midst those who are strangers, far from their homes, who need to be welcomed to the family circle. Hospitality is a grace of the soul that grows by exercise.',
    egwSource: 'The Adventist Home, p. 445',
    egwReference: 'The Adventist Home, p. 445 — "Hospitality is a grace of the soul that grows by exercise… open your homes to the friendless and the poor."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Ellen G. White\'s home ministry',
      description: 'White\'s Elmshaven home in St Helena, California was open to a constant stream of visitors — ministers, workers, students, the sick, and the poor. She modelled hospitality as deliberate mission, shaping the Adventist home culture that millions would read about in The Adventist Home.',
    },
  },
  intercession: {
    sdaMinistries: [
      'Church Prayer Ministry Teams',
      'GC Prayer Ministries International',
      'Pre-evangelism Intercession',
      'Pastoral Prayer Support Teams',
      'ADRA Worker Prayer Support',
      'Prayer Chains and Digital Networks',
    ],
    egwQuote: 'Prayer is the key in the hand of faith to unlock heaven\'s storehouse, where are treasured the boundless resources of Omnipotence. Without unceasing prayer and diligent watching we are in danger of growing careless and of deviating from the right path.',
    egwSource: 'Steps to Christ, p. 94',
    egwReference: 'Steps to Christ, p. 94 — "Prayer is the key in the hand of faith to unlock heaven\'s storehouse, where are treasured the boundless resources of Omnipotence."',
    fundamentalBeliefs: ['FB 24 — Christ\'s Ministry in the Heavenly Sanctuary', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'William Miller',
      description: 'Before his public proclamation of the Advent hope, Miller spent two years in intense private prayer and Scripture study. His intercession-fuelled proclamation became a pattern for early Adventism: praying your way to certainty before speaking.',
    },
  },
  knowledge: {
    sdaMinistries: [
      'Adventist Education System',
      'Sabbath School Teaching',
      'Biblical Research Institute (BRI)',
      'Andrews University Theological Seminary',
      'Adventist Review / Ministry Magazine',
      'Bible Correspondence Schools',
      'Voice of Prophecy Bible Studies',
    ],
    egwQuote: 'A knowledge of God and of Jesus Christ is the highest education, and it will occupy all our powers throughout eternity. This knowledge, combined with a thorough acquaintance with the word of God, is the most valuable preparation any person can receive for life and service.',
    egwSource: 'Testimonies for the Church, vol. 8, p. 321',
    egwReference: 'Testimonies for the Church, vol. 8, p. 321 — "A knowledge of God and of Jesus Christ is the highest education… the most valuable preparation any person can receive for life and service."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries', 'FB 11 — Growing in Christ'],
    historicalExample: {
      person: 'Herbert E. Douglass',
      description: 'Prolific Adventist theologian whose Messenger of the Lord (1998) remains the definitive treatment of the Spirit of Prophecy. He modelled knowledge-as-service: extraordinary scholarly depth put entirely in service of the whole church.',
    },
  },
  leadership: {
    sdaMinistries: [
      'Conference, Union, and Division Leadership',
      'Local Church Elder',
      'ADRA Country Programme Directors',
      'Pathfinder Director',
      'Church Board Chair',
      'Adventist Health Administration',
      'Self-Supporting Institution Leadership',
    ],
    egwQuote: 'A true leader will plan, organise, and carry forward every branch of the work entrusted to him. He will encourage consecrated talent to bear responsibilities. He will give men and women opportunity to develop the ability God has given them, and train them to become workers who are steadfast and true.',
    egwSource: 'Gospel Workers, p. 481',
    egwReference: 'Gospel Workers, p. 481 — "A true leader will plan, organise, and carry forward every branch of the work… train them to become workers who are steadfast and true."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 14 — Unity in the Body of Christ', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Neal C. Wilson',
      description: 'GC President 1979–1990, Wilson demonstrated principled leadership through the Desmond Ford controversy and other institutional crises. His courage and commitment to accountability defined servant leadership at the highest denominational level.',
    },
  },
  mercy: {
    sdaMinistries: [
      'ADRA (Adventist Development and Relief Agency)',
      'Adventist Community Services',
      'Adventist Chaplaincy',
      'Loma Linda University Medical Center',
      'Prison Ministry',
      'Homeless Outreach',
      'Refugee Ministries',
      'Grief Care and Crisis Ministry',
    ],
    egwQuote: 'It is the ministry of mercy that God demands of us. We should never become so busy or so exalted in our own estimation that we cannot stoop to relieve the suffering of others. God\'s love has been expressed in His justice no less than in His mercy.',
    egwSource: 'Ministry of Healing, p. 104',
    egwReference: 'Ministry of Healing, p. 104 — "It is the ministry of mercy that God demands of us… God\'s love has been expressed in His justice no less than in His mercy."',
    fundamentalBeliefs: ['FB 20 — Christian Stewardship', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'John Burden & Ellen White (Loma Linda, 1905)',
      description: 'Burden, guided by Ellen White\'s vision, purchased the Loma Linda property against institutional scepticism. What began as a failing sanitarium became one of the world\'s leading academic medical centres — and a Blue Zone community of unusual longevity.',
    },
  },
  miracles: {
    sdaMinistries: [
      'Prayer Ministry and Healing Prayer Teams',
      'Global Mission Pioneer Contexts',
      'Adventist Chaplaincy',
      'Evangelistic Series Prayer Teams',
      'Adventist Frontier Missions',
      'ADRA Disaster Relief',
    ],
    egwQuote: 'God\'s messengers in the great cities are not to follow a tame, spiritless method of labour. The work to be done calls for earnest men, filled with zeal, animated by the Holy Spirit. Signs and wonders are to follow them; for God is not leaving His work to be accomplished without the outpouring of His Spirit and the demonstration of His power.',
    egwSource: 'Testimonies for the Church, vol. 9, p. 96',
    egwReference: 'Testimonies for the Church, vol. 9, p. 96 — "Signs and wonders are to follow them; for God is not leaving His work to be accomplished without the outpouring of His Spirit."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Adventist World Radio pioneers',
      description: 'AWR was founded in 1971 with a single transmitter in Portugal and today broadcasts in over 100 languages to millions in restricted-access countries — a miraculous multiplication of gospel reach that no natural planning could have achieved.',
    },
  },
  prophecy: {
    sdaMinistries: [
      'Adventist Review / Ministry Magazine',
      'Biblical Research Institute (BRI)',
      'Evangelistic Series Preaching',
      'Andrews University Theological Seminary',
      'Sabbath Homiletics',
      'Youth Prophetic Engagement',
      'Adventist World Radio',
    ],
    egwQuote: 'One of the gifts of the Spirit is the gift of prophecy. Its presence in the church is a sign of the Spirit\'s leading and of the Lord\'s care for His people. When genuine, it edifies the church, warns of danger, corrects error, and calls the people back to the word of God.',
    egwSource: 'The Acts of the Apostles, p. 284',
    egwReference: 'The Acts of the Apostles, p. 284 — "One of the gifts of the Spirit is the gift of prophecy… it edifies the church, warns of danger, corrects error."',
    fundamentalBeliefs: ['FB 18 — The Gift of Prophecy', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Ellen G. White',
      description: 'The definitive example of the prophetic gift in Adventism. Beginning with her first vision in 1844, White experienced approximately 2,000 visions over 70 years, shaping every dimension of Adventist institutional life — health, education, mission, and theology.',
    },
  },
  shepherding: {
    sdaMinistries: [
      'Pastoral Ministry',
      'Head Elder and Elder Team',
      'Small Group Leaders',
      'Youth Pastors',
      'Ministerial Secretaries',
      'Adventist Chaplaincy',
      'Retention and Reclamation Ministry',
    ],
    egwQuote: 'The shepherd who follows Christ must be tender, watchful, and self-sacrificing. He must give himself for the sheep — not drive them, but lead them. The pastor who thinks more of his position than of his people will lose both.',
    egwSource: 'Gospel Workers, p. 185',
    egwReference: 'Gospel Workers, p. 185 — "The shepherd who follows Christ must be tender, watchful, and self-sacrificing. He must give himself for the sheep — not drive them, but lead them."',
    fundamentalBeliefs: ['FB 12 — The Church', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'E.E. Cleveland',
      description: 'Conducted over 300 evangelistic crusades in 50+ countries with more than 100,000 baptisms, but equally significant for his personal follow-up: training local elders, writing personal letters, maintaining relationships with converts across decades.',
    },
  },
  teaching: {
    sdaMinistries: [
      'Adventist Education System (K–12 and University)',
      'Sabbath School Teaching',
      'Small Group Facilitation',
      'Evangelistic Series Bible Exposition',
      'Andrews University / Avondale University',
      'Voice of Prophecy Bible Lessons',
      'Pathfinder and Adventurer Instruction',
    ],
    egwQuote: 'True education is the harmonious development of the physical, the mental, and the spiritual powers. It prepares the student for the joy of service in this world and for the higher joy of wider service in the world to come.',
    egwSource: 'Education, p. 13',
    egwReference: 'Education, p. 13 — "True education is the harmonious development of the physical, the mental, and the spiritual powers."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'H.M.S. Richards Sr.',
      description: 'Founded Voice of Prophecy radio (1929), the most widely listened-to Protestant broadcast of its era. His signature "The Bible says…" embodied Adventist teaching: not tradition, not opinion — the clear word of Scripture, warmly and accessibly taught.',
    },
  },
  tongues: {
    sdaMinistries: [
      'Global Mission Pioneers',
      'Adventist Frontier Missions',
      'Adventist World Radio (AWR)',
      'Voice of Prophecy Translation Teams',
      'ADRA Global Field Workers',
      'Division Bible Translation Projects',
      'Multi-ethnic Congregation Ministry',
    ],
    egwQuote: 'On the day of Pentecost the Holy Spirit was poured out upon the disciples. They spoke with other tongues as the Spirit gave them utterance — and there were devout men from every nation under heaven who heard them speak in their own language the wonderful works of God.',
    egwSource: 'The Acts of the Apostles, p. 39',
    egwReference: 'The Acts of the Apostles, p. 39 — "They spoke with other tongues as the Spirit gave them utterance… devout men from every nation heard them speak in their own language the wonderful works of God."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Adventist World Radio',
      description: 'Founded 1971 with a single transmitter, AWR now broadcasts in 100+ languages to millions in restricted-access countries. The xenolalic Acts 2 vision — every person hearing the gospel in their own tongue — is precisely what AWR makes possible at global scale.',
    },
  },
  wisdom: {
    sdaMinistries: [
      'Conference and Union Administration',
      'Church Board Leadership',
      'Biblical Research Institute (BRI)',
      'Ministerial Association',
      'Theological Counselling',
      'General Conference Committees',
      'ADRA Policy Leadership',
    ],
    egwQuote: 'It requires much wisdom and experience and a close connection with God to carry out His plans. The wisdom from above is first pure, then peaceable, gentle, and easy to be entreated, full of mercy and good fruits — and those who possess this wisdom will be guided by the Spirit of God rather than by the wisdom of this world.',
    egwSource: 'Testimonies for the Church, vol. 5, p. 50',
    egwReference: 'Testimonies for the Church, vol. 5, p. 50 — "It requires much wisdom and experience and a close connection with God to carry out His plans."',
    fundamentalBeliefs: ['FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'James White',
      description: 'Co-founder of the SDA Church, James White\'s wisdom shaped the movement\'s founding decisions: when to publish, when to organise, where to locate institutions. His Spirit-guided discernment turned a fragmented movement into a durable denomination.',
    },
  },
  worship: {
    sdaMinistries: [
      'Church Music Ministry',
      'Adventist University Choral Ensembles',
      'Hope Channel Worship Media',
      'Sabbath School Worship Leadership',
      'Camp Meeting and Evangelism Worship Teams',
      'Pathfinder and Youth Worship',
      'SDA Hymnal Tradition',
    ],
    egwQuote: 'Music forms a part of God\'s worship in the courts above, and we should endeavour, in our songs of praise, to approach as nearly as possible to the harmony of the heavenly choirs. Singing, as a part of religious service, is as much an act of worship as is prayer.',
    egwSource: 'Patriarchs and Prophets, p. 594',
    egwReference: 'Patriarchs and Prophets, p. 594 — "Music forms a part of God\'s worship in the courts above… Singing, as a part of religious service, is as much an act of worship as is prayer."',
    fundamentalBeliefs: ['FB 20 — The Sabbath', 'FB 17 — Spiritual Gifts and Ministries'],
    historicalExample: {
      person: 'Adventist hymnody tradition and university choral ensembles',
      description: 'From the first Adventist hymnal compilations to the SDA Hymnal (1985) to the Aeolians at Oakwood University, Adventism has been shaped by worship-gifted people who understood that the songs a community sings are theology in motion.',
    },
  },
}

/**
 * Filter gift definitions to only those applicable for SDA assessment.
 * @param {Array} giftDefinitions - full 23-gift array from giftDefinitions.js
 * @returns {Array} filtered array (22 gifts — tongues included, interpretation_of_tongues excluded)
 */
export function getAdventistGifts(giftDefinitions) {
  return giftDefinitions.filter(g => !excludedGiftIds.includes(g.id))
}

/**
 * Enrich scored gifts with SDA ministry mappings and EGW references.
 * @param {Array} scoredGifts - [{giftId, totalScore, averageScore, rank}]
 * @returns {Array} same array with sdaMinistries, egwQuote, egwSource, and egwReference added
 */
export function enrichWithAdventistContext(scoredGifts) {
  return scoredGifts.map(sg => {
    const override = adventistGiftMap[sg.giftId]
    return {
      ...sg,
      sdaMinistries: override?.sdaMinistries ?? [],
      egwQuote: override?.egwQuote ?? null,
      egwSource: override?.egwSource ?? null,
      egwReference: override?.egwReference ?? null,
      historicalExample: override?.historicalExample ?? null,
      fundamentalBeliefs: override?.fundamentalBeliefs ?? [],
    }
  })
}
