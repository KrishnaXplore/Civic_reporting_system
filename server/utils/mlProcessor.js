const axios = require('axios');
const FormData = require('form-data');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendSSE } = require('./sse');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Category-specific time windows (in days) ──────────────────────────────────
// Controls how far back we look for duplicate complaints.
// If a complaint older than this window exists, a new one is allowed
// (the problem may have reoccurred after resolution).
const CATEGORY_TIME_WINDOW_DAYS = {
  'Roads & Infrastructure': 30,  // potholes recur — 1 month window
  'Water & Sanitation':     21,  // leaks — 3 week window
  'Electricity':            14,  // outages resolve faster — 2 week window
  'Waste Management':        7,  // garbage should clear in 1 week
  'Parks & Public Spaces':  60,  // parks issues linger — 2 month window
};

// ── Category-specific location radius (in metres) ────────────────────────────
// Larger areas need bigger radius for duplicate detection.
const CATEGORY_RADIUS_METERS = {
  'Roads & Infrastructure': 50,   // potholes are precise locations
  'Water & Sanitation':     75,   // pipes span a wider area
  'Electricity':            100,  // electrical lines span blocks
  'Waste Management':       150,  // garbage dumps cover more area
  'Parks & Public Spaces':  200,  // parks are large spaces
};

const logger = (msg) => console.log(`[ML] ${msg}`);

// ── Notify user via SSE + persist to DB ──────────────────────────────────────
const notifyUser = async (userId, message, complaintId, type) => {
  try {
    await Notification.create({ recipient: userId, message, complaintId, type });
    sendSSE(userId.toString(), { message, complaintId, type });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// ── Build the date threshold for a category ───────────────────────────────────
const getTimeWindowDate = (category) => {
  const days = CATEGORY_TIME_WINDOW_DAYS[category] || 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// ── Main background processor ─────────────────────────────────────────────────
/**
 * Runs ML checks in background AFTER complaint is saved to DB.
 * Calls the Python FastAPI ML service for:
 *   1. AI image detection  → POST /check-fake
 *   2. Duplicate detection → POST /check-duplicate
 *
 * Uses category-specific time windows and radii for smarter duplicate detection.
 * Only checks against ACTIVE (non-resolved, non-rejected) complaints.
 *
 * @param {string} complaintId  - MongoDB _id of the newly saved complaint
 * @param {Buffer} imageBuffer  - raw image buffer from multer (kept in memory)
 * @param {string} citizenId    - user._id for notifications
 */
const runMLChecks = async (complaintId, imageBuffer, citizenId) => {
  try {
    logger(`Starting background ML checks for complaint ${complaintId}`);

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      console.error(`[ML] Complaint ${complaintId} not found`);
      return;
    }

    // ── STEP 1: AI Image Detection ─────────────────────────────────────────
    logger(`Running AI image check for complaint ${complaintId}`);

    try {
      const fakeForm = new FormData();
      fakeForm.append('file', imageBuffer, {
        filename: 'complaint.jpg',
        contentType: 'image/jpeg',
      });

      const fakeRes = await axios.post(`${ML_URL}/check-fake`, fakeForm, {
        headers: fakeForm.getHeaders(),
        timeout: 25000,
      });

      const { isFake, status, reason, scores } = fakeRes.data;
      logger(`AI check → status=${status} isFake=${isFake} scores=${JSON.stringify(scores)}`);

      if (isFake && status === 'REJECTED') {
        // Mark complaint as rejected
        await Complaint.findByIdAndUpdate(complaintId, {
          status: 'Rejected',
          rejectionReason: 'AI-generated or digitally altered image detected',
        });

        // Log strike against citizen
        const citizen = await User.findById(citizenId);
        const newStrikeCount = (citizen?.strikeCount || 0) + 1;
        const newStatus =
          newStrikeCount >= 5 ? 'banned' :
          newStrikeCount >= 3 ? 'warned' :
          'active';

        await User.findByIdAndUpdate(citizenId, {
          $inc: { strikeCount: 1 },
          status: newStatus,
        });

        // Notify citizen
        const banWarning =
          newStrikeCount >= 5 ? ' Your account has been banned.' :
          newStrikeCount >= 3 ? ' Your account has been warned.' : '';

        await notifyUser(
          citizenId,
          `Your complaint was rejected: AI-generated image detected. Strike ${newStrikeCount} of 5 recorded.${banWarning}`,
          complaintId,
          'rejected'
        );

        logger(`Complaint ${complaintId} rejected — AI image. Strike ${newStrikeCount} logged for user ${citizenId}`);
        return;
      }
    } catch (err) {
      // Fail open — if ML service is down, complaint stays active
      console.warn(`[ML] AI check unavailable: ${err.message} — complaint ${complaintId} stays active`);
    }

    // ── STEP 2: Duplicate Detection ────────────────────────────────────────
    logger(`Running duplicate check for complaint ${complaintId}`);

    try {
      const category    = complaint.category;
      const radius      = CATEGORY_RADIUS_METERS[category] || 100;
      const windowDate  = getTimeWindowDate(category);
      const windowDays  = CATEGORY_TIME_WINDOW_DAYS[category] || 30;

      logger(`Duplicate check params → category=${category} radius=${radius}m window=${windowDays} days (since ${windowDate.toISOString().split('T')[0]})`);

      // Find nearby ACTIVE complaints within time window
      const nearbyComplaints = await Complaint.find({
        _id:      { $ne: complaintId },           // exclude the new complaint itself
        category,                                  // same category only
        status:   { $nin: ['Rejected', 'Resolved'] }, // only active complaints
        createdAt: { $gte: windowDate },           // within time window
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: complaint.location.coordinates,
            },
            $maxDistance: radius,
          },
        },
      })
        .select('_id title description location createdAt')
        .limit(10);

      logger(`Found ${nearbyComplaints.length} nearby active complaints within ${windowDays}-day window`);

      if (nearbyComplaints.length > 0) {
        const nearbyData = nearbyComplaints.map(c => ({
          _id:         c._id.toString(),
          title:       c.title,
          description: c.description,
          location:    c.location,
        }));

        const [lng, lat] = complaint.location.coordinates;

        const dupRes = await axios.post(
          `${ML_URL}/check-duplicate`,
          null,
          {
            params: {
              description:       complaint.description,
              title:             complaint.title,
              lat,
              lng,
              nearby_complaints: JSON.stringify(nearbyData),
            },
            timeout: 25000,
          }
        );

        const { isDuplicate, duplicateId, similarity, status } = dupRes.data;
        logger(`Duplicate check → status=${status} isDuplicate=${isDuplicate} similarity=${similarity}`);

        if (isDuplicate && duplicateId) {
          // Upvote the existing complaint
          await Complaint.findByIdAndUpdate(duplicateId, {
            $inc: { upvotes: 1 },
          });

          // Mark new complaint as rejected (duplicate)
          await Complaint.findByIdAndUpdate(complaintId, {
            status:          'Rejected',
            rejectionReason: `Duplicate complaint detected (${Math.round(similarity * 100)}% match)`,
            duplicateOf:     duplicateId,
          });

          // Notify citizen
          await notifyUser(
            citizenId,
            `Your complaint is similar to an existing one nearby (${Math.round(similarity * 100)}% match). Your support has been added to the existing complaint.`,
            duplicateId,
            'duplicate'
          );

          logger(`Complaint ${complaintId} marked duplicate of ${duplicateId} (${Math.round(similarity * 100)}% match)`);
          return;
        }
      } else {
        logger(`No nearby active complaints found within ${windowDays}-day window — complaint is unique`);
      }
    } catch (err) {
      // Fail open — if duplicate check fails, complaint stays active
      console.warn(`[ML] Duplicate check unavailable: ${err.message} — complaint ${complaintId} stays active`);
    }

    // ── STEP 3: All checks passed ──────────────────────────────────────────
    logger(`Complaint ${complaintId} passed all ML checks ✓`);

    await notifyUser(
      citizenId,
      `Your complaint has been verified and is now visible to the concerned department.`,
      complaintId,
      'submitted'
    );

  } catch (error) {
    console.error(`[ML] Background processor crashed for complaint ${complaintId}:`, error.message);
    // Don't rethrow — complaint stays as Submitted if processor fails entirely
  }
};

module.exports = { runMLChecks };
