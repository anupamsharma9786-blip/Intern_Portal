// services/adminAnalytics.service.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import CertificateRequest from '../models/CertificateRequest.js';

// Safely parse raw database dates
const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  if (val.$date) return new Date(val.$date);
  if (val.date) return new Date(val.date);
  return new Date(val);
};

// Safely parse raw database ObjectIds
const parseId = (val) => {
  if (!val) return null;
  if (val instanceof mongoose.Types.ObjectId) return val.toString();
  if (typeof val === 'string') return val;
  if (val.$oid) return val.$oid;
  if (val.oid) return val.oid;
  return val.toString();
};

class AdminAnalyticsService {
  
  // 1. Overview KPIs
  static async getOverview(fromDate, toDate) {
    const internsList = await User.find({ role: 'intern' }).lean();
    const teamLeadersCount = await User.countDocuments({ role: 'teamleader' });
    
    // BYPASS MONGOOSE SCHEMA: Fetch raw database documents
    const requestsList = await CertificateRequest.collection.find({}).toArray();

    const activeInterns = internsList.filter(i => i.internshipStatus === 'ongoing').length;
    const completedInterns = internsList.filter(i => i.internshipStatus === 'completed').length;

    const pendingRequests = requestsList.filter(r => r.status === 'pending').length;
    const approvedRequests = requestsList.filter(r => r.status === 'approved').length;
    const rejectedRequests = requestsList.filter(r => r.status === 'rejected').length;

    return {
      interns: {
        total: internsList.length,
        active: activeInterns,
        completed: completedInterns
      },
      teamLeaders: teamLeadersCount,
      requests: {
        total: requestsList.length,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      }
    };
  }

  // 2. Turnaround Times
  static async getTurnaroundTime(fromDate, toDate) {
    // BYPASS MONGOOSE SCHEMA: Fetch raw database documents
    const requests = await CertificateRequest.collection.find({}).toArray();
    
    const validRequests = requests.filter(req => {
      const reviewed = parseDate(req.reviewedAt);
      return reviewed && !isNaN(reviewed.getTime());
    });

    if (validRequests.length === 0) return { avgTlReview: 0, avgTotal: 0, times: [] };

    let totalHours = 0;
    const times = [];

    validRequests.forEach(req => {
      const created = parseDate(req.createdAt);
      const reviewed = parseDate(req.reviewedAt);
      
      if (created && reviewed) {
        const diffHours = (reviewed - created) / (1000 * 60 * 60);
        totalHours += diffHours;
        times.push(diffHours);
      }
    });

    const avgTime = times.length > 0 ? totalHours / times.length : 0;

    return {
      avgTlReview: avgTime,
      avgTotal: avgTime,
      times: times
    };
  }

  // 3. Team Leader Performance
  static async getTeamLeaderPerformance(fromDate, toDate) {
    // BYPASS MONGOOSE SCHEMA: Fetch raw database documents
    const requests = await CertificateRequest.collection.find({}).toArray();
    
    const validRequests = requests.filter(req => {
      const reviewedBy = parseId(req.reviewedBy);
      const reviewedAt = parseDate(req.reviewedAt);
      return reviewedBy && reviewedAt && !isNaN(reviewedAt.getTime());
    });

    const tlMap = {};
    
    for (const req of validRequests) {
      const tlId = parseId(req.reviewedBy);
      if (!tlMap[tlId]) {
        tlMap[tlId] = { totalReviewed: 0, totalHours: 0, rejections: 0 };
      }
      tlMap[tlId].totalReviewed += 1;
      
      const created = parseDate(req.createdAt);
      const reviewed = parseDate(req.reviewedAt);
      
      if (created && reviewed) {
        const hours = (reviewed - created) / (1000 * 60 * 60);
        tlMap[tlId].totalHours += hours;
      }

      if (req.status === 'rejected') {
        tlMap[tlId].rejections += 1;
      }
    }

    const results = [];
    for (const [tlId, stats] of Object.entries(tlMap)) {
      let tlName = `Unknown TL (${tlId})`; // Fallback if dummy ID doesn't exist in Users collection
      
      try {
        if (mongoose.Types.ObjectId.isValid(tlId)) {
          const user = await User.findById(tlId).lean();
          if (user && user.name) tlName = user.name;
        }
      } catch (err) {
        // Ignore lookup errors
      }

      results.push({
        name: tlName,
        totalReviewed: stats.totalReviewed,
        avgReviewHours: stats.totalReviewed > 0 ? stats.totalHours / stats.totalReviewed : 0,
        rejectionRate: stats.totalReviewed > 0 ? (stats.rejections / stats.totalReviewed) * 100 : 0
      });
    }

    return results;
  }
}

export default AdminAnalyticsService;