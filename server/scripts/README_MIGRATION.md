# Database Migration Guide

## Overview
This migration adds `electionId` references to all collections, enabling multi-election support.

## Migration Scripts

### 1. Verify Current State
```bash
node server/scripts/verifyMigration.js
```
Shows current database state and identifies any issues.

### 2. Run Migration
```bash
node server/scripts/migrateElections.js
```
Migrates existing data to multi-election schema:
- Creates default election if none exists
- Links all users to default election
- Links all candidates to default election
- Marks migrated data with `isLegacy: true`

### 3. Rollback (if needed)
```bash
node server/scripts/rollbackMigration.js
```
Reverts migration:
- Removes `electionId` from all documents
- Removes legacy election records
- Restores single-election state

## Schema Changes

### User Model
- Added: `electionId` (ObjectId ref to Election)
- Added: `isLegacy` (Boolean, migration flag)
- Updated indexes: Unique constraints now scoped to electionId

### Candidate Model
- Added: `electionId` (ObjectId ref to Election, required)
- Added: `contractAddress` (String, specific contract for election)
- Added: `isLegacy` (Boolean, migration flag)
- Updated indexes: Unique constraints now scoped to electionId

### Election Model
- Added: `contractAddress` (String, required, unique)
- Added: `factoryTxHash` (String, deployment transaction)
- Added: `admin` (ObjectId ref to Admin)
- Added: `isActive` (Boolean, default true)
- Added: `isLegacy` (Boolean, migration flag)

### OTP Model
- Added: `electionId` (ObjectId ref to Election)
- Updated indexes: Added compound index with electionId

## Migration Safety

### Backup Before Migration
```bash
# MongoDB Atlas: Use built-in backup
# Local MongoDB:
mongodump --uri="mongodb://localhost:27017/evoteface" --out=./backup
```

### Restore from Backup
```bash
mongorestore --uri="mongodb://localhost:27017/evoteface" ./backup/evoteface
```

## Post-Migration Checklist

- [ ] Run `verifyMigration.js` - all checks pass
- [ ] No orphaned data (users/candidates without valid electionId)
- [ ] All elections have contractAddress
- [ ] Test user registration in new election
- [ ] Test candidate creation in new election
- [ ] Test voting flow with electionId context

## Troubleshooting

### Issue: Duplicate key error on indexes
**Solution:** Drop old indexes manually:
```javascript
db.users.dropIndex("email_1");
db.users.dropIndex("voterID_1");
db.users.dropIndex("aadharNumber_1");
```

### Issue: Users without electionId after migration
**Solution:** Re-run migration script:
```bash
node server/scripts/migrateElections.js
```

### Issue: Need to start fresh
**Solution:** 
1. Backup data
2. Run rollback script
3. Verify rollback
4. Re-run migration

## Environment Variables

Ensure these are set in `.env`:
```
MONGODB_URI=your_mongodb_connection_string
CONTRACT_ADDRESS=0x... (for legacy election)
```
