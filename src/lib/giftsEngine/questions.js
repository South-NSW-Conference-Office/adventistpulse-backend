/**
 * Spiritual Gifts Assessment Questions — Wagner-modified Houts inventory
 *
 * 78 questions total: 3 behavioural statements per gift × 26 gifts.
 * For the Adventist version, filter out tongues + interpretation_of_tongues
 * questions (6 items) → 72 questions.
 *
 * All statements are first-person behavioural ("I do…") not aspirational ("I want to…").
 * Answered on a 1–5 Likert scale:
 *   1 = Almost never  2 = Seldom  3 = Sometimes  4 = Often  5 = Almost always
 */

export const questions = [
  // ── Administration ──────────────────────────────────────────────────────────
  { id: 'q_administration_1', giftId: 'administration', text: 'I create step-by-step plans and timelines when a group project needs to get done.', reverse: false },
  { id: 'q_administration_2', giftId: 'administration', text: 'I notice when a team is disorganised and instinctively start bringing structure to the effort.', reverse: false },
  { id: 'q_administration_3', giftId: 'administration', text: 'I keep track of details, deadlines, and delegated tasks so that nothing falls through the cracks.', reverse: false },

  // ── Apostleship ─────────────────────────────────────────────────────────────
  { id: 'q_apostleship_1', giftId: 'apostleship', text: 'I initiate new ministries or groups rather than waiting for someone else to start them.', reverse: false },
  { id: 'q_apostleship_2', giftId: 'apostleship', text: 'I adapt quickly to unfamiliar cultural settings and find ways to share my faith there.', reverse: false },
  { id: 'q_apostleship_3', giftId: 'apostleship', text: 'I feel drawn to places where there is no existing faith community and work to establish one.', reverse: false },

  // ── Craftsmanship ───────────────────────────────────────────────────────────
  { id: 'q_craftsmanship_1', giftId: 'craftsmanship', text: 'I use my hands to build, repair, or create things that serve the church or community.', reverse: false },
  { id: 'q_craftsmanship_2', giftId: 'craftsmanship', text: 'I volunteer to handle physical or creative tasks so that leaders can focus on other work.', reverse: false },
  { id: 'q_craftsmanship_3', giftId: 'craftsmanship', text: 'I find satisfaction in designing or making something tangible that contributes to worship or outreach.', reverse: false },

  // ── Discernment ─────────────────────────────────────────────────────────────
  { id: 'q_discernment_1', giftId: 'discernment', text: 'I quickly sense when a teaching or situation is not consistent with Scripture.', reverse: false },
  { id: 'q_discernment_2', giftId: 'discernment', text: 'I can tell when someone is being sincere versus when their words do not match their motives.', reverse: false },
  { id: 'q_discernment_3', giftId: 'discernment', text: 'Others seek my perspective when they need to evaluate whether a decision aligns with biblical principles.', reverse: false },

  // ── Encouragement / Exhortation ─────────────────────────────────────────────
  { id: 'q_encouragement_1', giftId: 'encouragement', text: 'I reach out to people who are struggling and offer words that strengthen their resolve.', reverse: false },
  { id: 'q_encouragement_2', giftId: 'encouragement', text: 'I write notes, send messages, or make calls specifically to lift someone\'s spirits.', reverse: false },
  { id: 'q_encouragement_3', giftId: 'encouragement', text: 'I challenge people to take their next step of growth, even when the conversation is difficult.', reverse: false },

  // ── Evangelism ──────────────────────────────────────────────────────────────
  { id: 'q_evangelism_1', giftId: 'evangelism', text: 'I naturally steer conversations toward matters of faith with people who do not yet believe.', reverse: false },
  { id: 'q_evangelism_2', giftId: 'evangelism', text: 'I look for opportunities to share my faith story in everyday interactions.', reverse: false },
  { id: 'q_evangelism_3', giftId: 'evangelism', text: 'People have told me that my personal testimony or explanation of the gospel moved them closer to faith.', reverse: false },

  // ── Faith ───────────────────────────────────────────────────────────────────
  { id: 'q_faith_1', giftId: 'faith', text: 'I remain confident that God will provide even when circumstances look impossible.', reverse: false },
  { id: 'q_faith_2', giftId: 'faith', text: 'I encourage a group to move forward on a God-given vision even before all the resources are in place.', reverse: false },
  { id: 'q_faith_3', giftId: 'faith', text: 'I find it natural to trust God for outcomes that others consider unrealistic.', reverse: false },

  // ── Giving ──────────────────────────────────────────────────────────────────
  { id: 'q_giving_1', giftId: 'giving', text: 'I give financially beyond what is expected because I want to see God\'s work advance.', reverse: false },
  { id: 'q_giving_2', giftId: 'giving', text: 'I look for unmet needs in the church or community and contribute resources to address them.', reverse: false },
  { id: 'q_giving_3', giftId: 'giving', text: 'I feel genuine joy when I can quietly fund a project or help someone in a material way.', reverse: false },

  // ── Healing ─────────────────────────────────────────────────────────────────
  { id: 'q_healing_1', giftId: 'healing', text: 'I pray specifically for people who are physically or emotionally unwell and have seen results.', reverse: false },
  { id: 'q_healing_2', giftId: 'healing', text: 'I am drawn to visit the sick and to ask God to restore their health.', reverse: false },
  { id: 'q_healing_3', giftId: 'healing', text: 'People in pain seek me out because they sense that my presence and prayers bring comfort.', reverse: false },

  // ── Helps / Service ─────────────────────────────────────────────────────────
  { id: 'q_helps_1', giftId: 'helps', text: 'I notice practical tasks that need doing and take care of them without being asked.', reverse: false },
  { id: 'q_helps_2', giftId: 'helps', text: 'I prefer working behind the scenes to support leaders rather than being in the spotlight.', reverse: false },
  { id: 'q_helps_3', giftId: 'helps', text: 'I gladly run errands, set up equipment, or handle logistics so that an event goes smoothly.', reverse: false },

  // ── Hospitality ─────────────────────────────────────────────────────────────
  { id: 'q_hospitality_1', giftId: 'hospitality', text: 'I regularly invite people into my home or to share a meal, especially newcomers.', reverse: false },
  { id: 'q_hospitality_2', giftId: 'hospitality', text: 'I go out of my way to help visitors feel welcomed and connected at church gatherings.', reverse: false },
  { id: 'q_hospitality_3', giftId: 'hospitality', text: 'I create a warm, comfortable atmosphere wherever I am so that others can relax and open up.', reverse: false },

  // ── Intercession ────────────────────────────────────────────────────────────
  { id: 'q_intercession_1', giftId: 'intercession', text: 'I set aside significant time each day to pray on behalf of specific people or situations.', reverse: false },
  { id: 'q_intercession_2', giftId: 'intercession', text: 'I maintain a prayer list and follow up to learn how God has answered.', reverse: false },
  { id: 'q_intercession_3', giftId: 'intercession', text: 'I feel a strong inner urgency to pray when I learn about a need, and I act on it immediately.', reverse: false },

  // ── Knowledge ───────────────────────────────────────────────────────────────
  { id: 'q_knowledge_1', giftId: 'knowledge', text: 'I spend significant time studying Scripture and theological material to deepen my understanding.', reverse: false },
  { id: 'q_knowledge_2', giftId: 'knowledge', text: 'I enjoy researching biblical topics and organising what I learn so I can share it with others.', reverse: false },
  { id: 'q_knowledge_3', giftId: 'knowledge', text: 'People come to me with questions about the Bible because they know I have studied it carefully.', reverse: false },

  // ── Leadership ──────────────────────────────────────────────────────────────
  { id: 'q_leadership_1', giftId: 'leadership', text: 'I set clear goals for a group and people willingly follow the direction I cast.', reverse: false },
  { id: 'q_leadership_2', giftId: 'leadership', text: 'I delegate responsibilities effectively and hold team members accountable.', reverse: false },
  { id: 'q_leadership_3', giftId: 'leadership', text: 'In a group without clear direction, I naturally step up to provide it.', reverse: false },

  // ── Mercy ───────────────────────────────────────────────────────────────────
  { id: 'q_mercy_1', giftId: 'mercy', text: 'I am drawn to help people in practical ways even when it is inconvenient for me.', reverse: false },
  { id: 'q_mercy_2', giftId: 'mercy', text: 'I feel deeply moved when I encounter someone in pain and I act to alleviate their suffering.', reverse: false },
  { id: 'q_mercy_3', giftId: 'mercy', text: 'I visit or assist people whom others tend to overlook — the lonely, the grieving, the marginalised.', reverse: false },

  // ── Miracles ────────────────────────────────────────────────────────────────
  { id: 'q_miracles_1', giftId: 'miracles', text: 'I have personally witnessed God doing something that cannot be explained by natural causes.', reverse: false },
  { id: 'q_miracles_2', giftId: 'miracles', text: 'I pray boldly for supernatural intervention in seemingly hopeless situations.', reverse: false },
  { id: 'q_miracles_3', giftId: 'miracles', text: 'Others have told me that God performed something extraordinary in connection with my prayers or actions.', reverse: false },

  // ── Prophecy ────────────────────────────────────────────────────────────────
  { id: 'q_prophecy_1', giftId: 'prophecy', text: 'I speak up to call the community back to biblical truth, even when it is unpopular.', reverse: false },
  { id: 'q_prophecy_2', giftId: 'prophecy', text: 'I receive strong impressions from God about what He wants to say to a group or individual.', reverse: false },
  { id: 'q_prophecy_3', giftId: 'prophecy', text: 'People tell me that my words have convicted or redirected them at a critical moment.', reverse: false },

  // ── Shepherding / Pastoring ─────────────────────────────────────────────────
  { id: 'q_shepherding_1', giftId: 'shepherding', text: 'I take personal responsibility for the spiritual well-being of a small group of people over time.', reverse: false },
  { id: 'q_shepherding_2', giftId: 'shepherding', text: 'I regularly check in on individuals to see how they are growing in their faith.', reverse: false },
  { id: 'q_shepherding_3', giftId: 'shepherding', text: 'I guide people through spiritual struggles with patience and consistent follow-up.', reverse: false },

  // ── Teaching ────────────────────────────────────────────────────────────────
  { id: 'q_teaching_1', giftId: 'teaching', text: 'I prepare lessons or presentations that help people understand and apply Scripture.', reverse: false },
  { id: 'q_teaching_2', giftId: 'teaching', text: 'I break down complex biblical concepts into simple, clear language that others can grasp.', reverse: false },
  { id: 'q_teaching_3', giftId: 'teaching', text: 'Learners tell me that my teaching changed the way they understand a passage or doctrine.', reverse: false },

  // ── Tongues ─────────────────────────────────────────────────────────────────
  { id: 'q_tongues_1', giftId: 'tongues', text: 'I have spoken in a language I did not previously learn during prayer or worship.', reverse: false },
  { id: 'q_tongues_2', giftId: 'tongues', text: 'I use a prayer language that I believe the Holy Spirit gives me for personal devotion.', reverse: false },
  { id: 'q_tongues_3', giftId: 'tongues', text: 'In a worship context, I have spoken in tongues and someone present interpreted the message.', reverse: false },

  // ── Interpretation of Tongues ───────────────────────────────────────────────
  { id: 'q_interpretation_of_tongues_1', giftId: 'interpretation_of_tongues', text: 'I have understood the meaning of a message spoken in tongues during a worship gathering.', reverse: false },
  { id: 'q_interpretation_of_tongues_2', giftId: 'interpretation_of_tongues', text: 'When someone speaks in tongues, I receive a clear impression of what God is communicating.', reverse: false },
  { id: 'q_interpretation_of_tongues_3', giftId: 'interpretation_of_tongues', text: 'I have publicly shared the meaning of a tongues message and the community confirmed its accuracy.', reverse: false },

  // ── Wisdom ──────────────────────────────────────────────────────────────────
  { id: 'q_wisdom_1', giftId: 'wisdom', text: 'I help people see a clear path forward when they are stuck in a difficult decision.', reverse: false },
  { id: 'q_wisdom_2', giftId: 'wisdom', text: 'I consider multiple perspectives and weigh consequences before giving advice.', reverse: false },
  { id: 'q_wisdom_3', giftId: 'wisdom', text: 'People seek my counsel because my suggestions tend to be practical and spiritually grounded.', reverse: false },

  // ── Worship ─────────────────────────────────────────────────────────────────
  { id: 'q_worship_1', giftId: 'worship', text: 'I lead or actively participate in music, prayer, or creative arts that draw people closer to God.', reverse: false },
  { id: 'q_worship_2', giftId: 'worship', text: 'I spend time preparing worship experiences that help a congregation encounter God\'s presence.', reverse: false },
  { id: 'q_worship_3', giftId: 'worship', text: 'Others have told me that the way I lead worship moved them into a deeper awareness of God.', reverse: false },
]

/** Gift IDs excluded from the Adventist version */
const ADVENTIST_EXCLUDED = ['tongues', 'interpretation_of_tongues']

/**
 * Return only the questions applicable to the Adventist version (72 questions).
 */
export function getAdventistQuestions() {
  return questions.filter(q => !ADVENTIST_EXCLUDED.includes(q.giftId))
}

/**
 * Return the full standard question set (78 questions).
 */
export function getStandardQuestions() {
  return questions
}
