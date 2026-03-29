import express from 'express';
import {
  getCandidates,
  castVote,
  getResults,
  getLiveResults,
} from '../controllers/voteController.js';
import { protect, adminProtect } from '../middleware/auth.js';

const router = express.Router();

router.get('/candidates', getCandidates);
router.post('/vote', protect, castVote);
router.get('/results', getResults);
router.get('/results/live', adminProtect, getLiveResults);

export default router;
