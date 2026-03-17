/**
 * Seed missing entities: GSYD, PUM, NZPUC
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const LEVELS = ['general_conference','division','union_conference','union_mission','union','conference','mission','attached_conference','attached_mission','attached_field','attached_section','gc_attached_field','gc_affiliated'];

const entitySchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  name:       { type: String, required: true, trim: true },
  level:      { type: String, enum: LEVELS, required: true },
  parentCode: { type: String, default: null },
  path:       { type: String, required: true },
  isActive:   { type: Boolean, default: true },
  location:   { type: { type: String, default: 'Point' }, coordinates: { type: [Number], default: [] } },
}, { timestamps: true });

const Entity = mongoose.models.Entity || mongoose.model('Entity', entitySchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const missing = [
    { code: 'GSYD',  name: 'Greater Sydney Conference',              level: 'conference',      parentCode: 'AUC',  path: 'GC/SPD/AUC/GSYD',  location: { type: 'Point', coordinates: [151.2093, -33.8688] } },
    { code: 'PUM',   name: 'Papua New Guinea Union Mission',          level: 'union_mission',   parentCode: 'SPD',  path: 'GC/SPD/PUM',       location: { type: 'Point', coordinates: [147.1803, -9.4438] } },
    { code: 'NZPUC', name: 'New Zealand Pacific Union Conference',    level: 'union_conference', parentCode: 'SPD', path: 'GC/SPD/NZPUC',     location: { type: 'Point', coordinates: [174.8860, -40.9006] } },
  ];

  for (const e of missing) {
    await Entity.findOneAndUpdate({ code: e.code }, e, { upsert: true, new: true });
    console.log('  ✓ Upserted', e.code, '-', e.name);
  }

  console.log('Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
