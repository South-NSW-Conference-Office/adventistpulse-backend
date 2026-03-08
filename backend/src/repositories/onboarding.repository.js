import { BaseRepository } from './base.repository.js'
import { OnboardingProfile } from '../models/OnboardingProfile.js'

class OnboardingRepository extends BaseRepository {
  constructor() {
    super(OnboardingProfile)
  }

  async findByUserId(userId) {
    return this.model.findOne({ userId }).lean()
  }

  async upsertByUserId(userId, data) {
    return this.model.findOneAndUpdate(
      { userId },
      { ...data, userId, submittedAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    ).lean()
  }
}

export const onboardingRepository = new OnboardingRepository()
