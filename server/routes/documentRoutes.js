import express from 'express'
import protect from '../middlewares/auth.js';
import upload from '../middlewares/Upload.js'
import { shareDocument } from '../controllers/documentController.js'

const router = express.Router()

router.post(
  '/share',
  protect,
  upload.single('document'),
  shareDocument
)

export default router