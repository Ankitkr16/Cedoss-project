import { Router } from 'express';
import multer from 'multer';
import {
  uploadReviews,
  loadSampleReviews,
  getReviews,
  suggestReply,
  getSampleCsv,
  getInsights,
  getSettings,
  updateApiKey,
  clearCache,
} from '../controllers/reviewController.js';

const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed.'));
    }
  },
});

const router = Router();

// Review routes
router.post('/upload', upload.single('file'), uploadReviews);
router.post('/load-sample', loadSampleReviews);
router.get('/', getReviews);
router.get('/sample', getSampleCsv);
router.get('/insights', getInsights);
router.post('/:id/suggest-reply', suggestReply);

// Settings and Cache routes
router.get('/settings/status', getSettings);
router.post('/settings/api-key', updateApiKey);
router.post('/cache/clear', clearCache);

export default router;
