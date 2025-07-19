const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /questionnaire
router.post('/questionnaire', async (req, res) => {
  console.log('POST /questionnaire - body:', req.body);
  const { answers, profileId, anonymous } = req.body;

  if (!answers) {
    console.error('POST /questionnaire - missing answers');
    return res.status(400).json({ success: false, error: 'Missing answers' });
  }

  try {
    const data = {
      answers,
      anonymous: !!anonymous,
    };
    if (profileId) {
      data.profile = { connect: { id: profileId } };
    }
    const response = await prisma.questionnaireResponse.create({
      data
    });
    console.log('POST /questionnaire - success:', response);
    res.status(201).json({ success: true, data: response });
  } catch (err) {
    console.error('POST /questionnaire - error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /questionnaire/last
router.get('/questionnaire/last', async (req, res) => {
  try {
    const lastResponse = await prisma.questionnaireResponse.findFirst({
      orderBy: { created_at: 'desc' }
    });
    if (!lastResponse) {
      console.warn('GET /questionnaire/last - no response found');
      return res.status(404).json({ success: false, error: 'No response found' });
    }
    console.log('GET /questionnaire/last - found:', lastResponse);
    res.status(200).json({ success: true, data: lastResponse });
  } catch (err) {
    console.error('GET /questionnaire/last - error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 