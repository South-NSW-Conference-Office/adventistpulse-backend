/**
 * Adventist-Specific Overrides for Spiritual Gifts Assessment
 *
 * Seventh-day Adventist theology does not include the active exercise
 * of tongues and interpretation of tongues in the present age.
 * This layer filters those gifts and maps the remaining 21 to
 * SDA-specific ministry categories with optional EGW references.
 */

// Gifts excluded from the Adventist version of the assessment
export const excludedGiftIds = ['tongues', 'interpretation_of_tongues']

/**
 * Maps each gift to SDA ministry categories and an optional
 * Ellen G. White reference for devotional context.
 */
export const adventistGiftMap = {
  administration: {
    sdaMinistries: ['Church Administration', 'Sabbath School'],
    egwReference: 'Testimonies, vol. 9, p. 270 — "There is need of sharp, sanctified thinking and keen foresight."',
  },
  apostleship: {
    sdaMinistries: ['Evangelism', 'ADRA'],
    egwReference: 'Acts of the Apostles, p. 9 — "The church is God\'s appointed agency for the salvation of men."',
  },
  craftsmanship: {
    sdaMinistries: ['Community Services', 'Youth Ministry'],
    egwReference: 'Education, p. 214 — "Every human being, created in the image of God, is endowed with a power akin to that of the Creator — individuality, power to think and to do."',
  },
  discernment: {
    sdaMinistries: ['Prayer Ministry', 'Church Administration'],
    egwReference: 'Testimonies, vol. 5, p. 680 — "We need keen, sanctified perception... to distinguish between right and wrong."',
  },
  encouragement: {
    sdaMinistries: ['Community Services', 'Youth Ministry', 'Prayer Ministry'],
    egwReference: 'Ministry of Healing, p. 143 — "Words of cheer and encouragement spoken when the soul is sick and the pulse of courage is low — these are regarded by the Saviour as if spoken to Himself."',
  },
  evangelism: {
    sdaMinistries: ['Evangelism', 'Community Services'],
    egwReference: 'Christian Service, p. 7 — "Every true disciple is born into the kingdom of God as a missionary."',
  },
  faith: {
    sdaMinistries: ['Prayer Ministry', 'Evangelism'],
    egwReference: 'Steps to Christ, p. 49 — "Faith is trusting God — believing that He loves us and knows best what is for our good."',
  },
  giving: {
    sdaMinistries: ['ADRA', 'Community Services'],
    egwReference: 'Counsels on Stewardship, p. 18 — "God\'s plan in the tithing system is beautiful in its simplicity and equality."',
  },
  healing: {
    sdaMinistries: ['Health Ministry', 'Prayer Ministry'],
    egwReference: 'Ministry of Healing, p. 17 — "Christ\'s method alone will give true success in reaching the people."',
  },
  helps: {
    sdaMinistries: ['Community Services', 'ADRA', 'Church Administration'],
    egwReference: 'Steps to Christ, p. 77 — "Those who have been most successful in soul-winning have been those who never became too important to perform small acts of kindness."',
  },
  hospitality: {
    sdaMinistries: ['Community Services', 'Sabbath School'],
    egwReference: 'Adventist Home, p. 445 — "Hospitality is a duty that should be cheerfully performed."',
  },
  intercession: {
    sdaMinistries: ['Prayer Ministry'],
    egwReference: 'Steps to Christ, p. 93 — "Prayer is the key in the hand of faith to unlock heaven\'s storehouse."',
  },
  knowledge: {
    sdaMinistries: ['Sabbath School', 'Evangelism'],
    egwReference: 'Counsels to Parents, Teachers, and Students, p. 11 — "True education means more than the pursual of a certain course of study."',
  },
  leadership: {
    sdaMinistries: ['Church Administration', 'Pathfinders/Adventurers', 'Youth Ministry'],
    egwReference: 'Gospel Workers, p. 481 — "A true leader will plan, organise, and make sure others are strengthened for their tasks."',
  },
  mercy: {
    sdaMinistries: ['ADRA', 'Community Services', 'Health Ministry'],
    egwReference: 'Ministry of Healing, p. 104 — "God\'s love has been expressed in His justice no less than in His mercy."',
  },
  miracles: {
    sdaMinistries: ['Prayer Ministry', 'Evangelism'],
    egwReference: 'Desire of Ages, p. 407 — "The Saviour\'s miracles were all for the blessing of those who had been led astray."',
  },
  prophecy: {
    sdaMinistries: ['Evangelism', 'Sabbath School'],
    egwReference: 'Great Controversy, p. vii — "The Bible points to God as its author; yet it was written by human hands."',
  },
  shepherding: {
    sdaMinistries: ['Sabbath School', 'Youth Ministry', 'Community Services'],
    egwReference: 'Gospel Workers, p. 185 — "The shepherd who follows Christ must be tender, watchful, and self-sacrificing."',
  },
  teaching: {
    sdaMinistries: ['Sabbath School', 'Pathfinders/Adventurers', 'Youth Ministry'],
    egwReference: 'Education, p. 13 — "True education is the harmonious development of the physical, the mental, and the spiritual powers."',
  },
  wisdom: {
    sdaMinistries: ['Church Administration', 'Prayer Ministry'],
    egwReference: 'Testimonies, vol. 5, p. 50 — "It requires much wisdom and experience and a close connection with God to carry out His plans."',
  },
  worship: {
    sdaMinistries: ['Music Ministry', 'Youth Ministry'],
    egwReference: 'Evangelism, p. 505 — "Music forms a part of God\'s worship in the courts above."',
  },
}

/**
 * Filter gift definitions to only those applicable for SDA assessment.
 * @param {Array} giftDefinitions - full 23-gift array from giftDefinitions.js
 * @returns {Array} filtered array (21 gifts)
 */
export function getAdventistGifts(giftDefinitions) {
  return giftDefinitions.filter(g => !excludedGiftIds.includes(g.id))
}

/**
 * Enrich scored gifts with SDA ministry mappings and EGW references.
 * @param {Array} scoredGifts - [{giftId, totalScore, averageScore, rank}]
 * @returns {Array} same array with sdaMinistries and egwReference added
 */
export function enrichWithAdventistContext(scoredGifts) {
  return scoredGifts.map(sg => {
    const override = adventistGiftMap[sg.giftId]
    return {
      ...sg,
      sdaMinistries: override?.sdaMinistries ?? [],
      egwReference: override?.egwReference ?? null,
    }
  })
}
