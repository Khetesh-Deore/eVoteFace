import express from 'express';
import {
  getVoters,
  approveVoter,
  rejectVoter,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  startElection,
  stopElection,
  getElection,
  getDashboardStats,
  getAuditLog,
} from '../controllers/adminController.js';
import { adminProtect } from '../middleware/auth.js';

const router = express.Router();

// All routes protected by admin middleware
router.use(adminProtect);

// Voter routes
router.get('/voters', getVoters);
router.patch('/voters/:voterId/approve', approveVoter);
router.delete('/voters/:voterId/reject', rejectVoter);

// Candidate routes
router.post('/candidates', addCandidate);
router.patch('/candidates/:candidateId', updateCandidate);
router.delete('/candidates/:candidateId', deleteCandidate);

// Election routes
router.post('/election/start', startElection);
router.patch('/election/stop', stopElection);
router.get('/election', getElection);

// Dashboard & Audit
router.get('/dashboard', getDashboardStats);
router.get('/audit-log', getAuditLog);

export default router;
