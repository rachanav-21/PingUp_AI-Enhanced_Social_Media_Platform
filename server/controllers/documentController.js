import imagekit from '../configs/imagekit.js'
import Document from '../models/Document.js'

export const shareDocument = async (req, res) => {
  try {
    const { receiverId } = req.body

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a document',
      })
    }

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Receiver is required',
      })
    }

    const uploadedFile = await imagekit.files.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: '/documents',
    })

    const document = await Document.create({
      sender: req.authUserId,
      receiver: receiverId,
      fileName: req.file.originalname,
      fileUrl: uploadedFile.url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    })

    res.status(201).json({
      success: true,
      message: 'Document shared successfully',
      document,
    })
  } catch (error) {
    console.error('Document upload error:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to share document',
    })
  }
}