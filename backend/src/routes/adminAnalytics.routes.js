// routes/adminAnalytics.routes.js
import express from 'express';
import { verifyAuth } from '../middlewares/verifyAuth.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { validateDateRange, cacheAnalytics } from '../middlewares/analytics.middleware.js';
import AdminAnalyticsService from '../services/adminAnalytics.service.js';
import AuditLog from '../models/AuditLog.js';
import { Parser } from 'json2csv';

const router = express.Router();

// Apply auth and caching to all routes
//router.use(verifyAuth, requireAdmin, validateDateRange, cacheAnalytics);

router.get('/overview', async (req, res) => {
  const data = await AdminAnalyticsService.getOverview(req.query.from, req.query.to);
  res.json(data);
});

router.get('/turnaround', async (req, res) => {
  const data = await AdminAnalyticsService.getTurnaroundTime(req.query.from, req.query.to);
  res.json(data);
});


router.get('/team-leaders', async (req, res) => {
  const data = await AdminAnalyticsService.getTeamLeaderPerformance(req.query.from, req.query.to);
  res.json({ labels: data.map(d => d.name), series: data });
});

// CSV Export route with Audit Logging
router.get('/export', async (req, res) => {
  const { type } = req.query;
  
  let formattedData = [];

  if (type === 'overview') {
  const rawData = await AdminAnalyticsService.getOverview(req.query.from, req.query.to);

  // Safely extract the nested objects (handling both array and direct object structures)
  const internStats = Array.isArray(rawData.interns) ? rawData.interns[0] || {} : rawData.interns || {};
  const requestStats = Array.isArray(rawData.requests) ? rawData.requests[0] || {} : rawData.requests || {};

  formattedData = [{
    'Total Interns': internStats.total || 0,
    'Active Interns': internStats.active || 0,
    'Completed Interns': internStats.completed || 0,
    'Total Team Leaders': rawData.teamLeaders || 0,
    'Total Requests': requestStats.total || 0,
    'Pending Requests': requestStats.pending || 0,
    'Approved Requests': requestStats.approved || 0,
    'Rejected Requests': requestStats.rejected || 0
  }];
  } else if (type === 'turnaround') {
    const rawData = await AdminAnalyticsService.getTurnaroundTime(req.query.from, req.query.to);
    // Add similar flattening here depending on your turnaround data structure
    formattedData = rawData; 
  }

  // Parse the flattened data
  const json2csvParser = new Parser();
  const csvData = json2csvParser.parse(formattedData);
  
  await AuditLog.create({
  adminId: req.user?._id || req.user?.id, // Safely handles missing/different user property
  action: 'EXPORT_ANALYTICS',
  entityType: 'analytics',
  details: `Exported ${type} from ${req.query.from} to ${req.query.to}`
});

  res.header('Content-Type', 'text/csv');
  res.attachment(`analytics-${type}.csv`);
  return res.send(csvData);
});

export default router;