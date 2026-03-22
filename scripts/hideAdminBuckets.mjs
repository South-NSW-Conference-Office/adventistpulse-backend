import mongoose from 'mongoose';
import 'dotenv/config';

await mongoose.connect(process.env.MONGODB_URI);
const OrgUnit = mongoose.model('OrgUnit', new mongoose.Schema({}, { strict: false }), 'orgunits');

const pattern = /attached|detached|unattached/i;

const matches = await OrgUnit.find({ name: pattern }).select('code name level').lean();
console.log(`Found ${matches.length} entities to hide:`);
matches.slice(0, 20).forEach(e => console.log(` - ${e.code}: ${e.name}`));

const result = await OrgUnit.updateMany(
  { name: pattern },
  { $set: { hidden: true } }
);
console.log(`\nUpdated: ${result.modifiedCount} records set to hidden: true`);

process.exit(0);
