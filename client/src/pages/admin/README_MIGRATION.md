# Frontend Migration Guide

## Overview
This guide helps migrate existing components to use the new multi-election API.

## Key Changes

### 1. Election Context
All pages now have access to `selectedElectionId` via `useElection()` hook.

### 2. API Endpoints
All API calls must be scoped to election:

```javascript
// OLD
axios.get('/api/admin/candidates')

// NEW
import { useElectionAPI } from '../../hooks/useElectionAPI';
const api = useElectionAPI();
api.admin.getCandidates()
```

### 3. Election Selector
Add `<ElectionSelector />` component to admin pages for easy switching.

## Migration Steps

### Step 1: Import Election Context
```javascript
import { useElection } from '../../context/ElectionContext';
import { useElectionAPI } from '../../hooks/useElectionAPI';
```

### Step 2: Get Selected Election
```javascript
const { selectedElectionId, selectedElection } = useElection();
const api = useElectionAPI();
```

### Step 3: Update API Calls
Replace all hardcoded API calls with election-scoped versions.

### Step 4: Add Election Selector
```javascript
import ElectionSelector from '../../components/common/ElectionSelector';

// In component JSX
<ElectionSelector />
```

### Step 5: Handle No Election Selected
```javascript
if (!selectedElectionId) {
  return <div>Please select an election</div>;
}
```

## Example: ManageCandidates Migration

### Before
```javascript
const [candidates, setCandidates] = useState([]);

useEffect(() => {
  axios.get('/api/admin/candidates')
    .then(res => setCandidates(res.data));
}, []);

const handleAdd = async (data) => {
  await axios.post('/api/admin/candidates', data);
};
```

### After
```javascript
const { selectedElectionId } = useElection();
const api = useElectionAPI();
const [candidates, setCandidates] = useState([]);

useEffect(() => {
  if (selectedElectionId) {
    api.admin.getCandidates()
      .then(res => setCandidates(res.data.candidates));
  }
}, [selectedElectionId]);

const handleAdd = async (data) => {
  await api.admin.addCandidate(data);
};
```

## Components to Migrate

- [ ] ManageVoters.jsx
- [ ] ManageCandidates.jsx
- [ ] FaceRegistration.jsx
- [ ] ElectionControl.jsx
- [ ] AdminResults.jsx
- [ ] AdminDashboard.jsx
- [ ] VotingPage.jsx
- [ ] Dashboard.jsx

## Testing Checklist

- [ ] Can create new election
- [ ] Can switch between elections
- [ ] Candidates load for selected election
- [ ] Voters load for selected election
- [ ] Phase changes work per election
- [ ] Voting works with selected election
- [ ] Results show for selected election
