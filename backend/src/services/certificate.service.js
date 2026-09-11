import mongoose from 'mongoose';
import Handlebars from 'handlebars';
import Certificate from '../models/Certificate.js';
import CertificateRequest from '../models/CertificateRequest.js';
import CertificateTemplate from '../models/CertificateTemplate.js';

const generateCertificateNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Certificate.countDocuments();
  return `CERT-${year}-${String(count + 1).padStart(5, '0')}`;
};

const generateVerificationCode = () => {
  return `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Creates a certificate draft for an approved CertificateRequest.
 * Enforces duplicate draft protection and uses the matching active CertificateTemplate.
 *
 * @param {string|mongoose.Types.ObjectId} requestId
 * @returns {Promise<Certificate>}
 */
export const createCertificateDraft = async (requestId) => {
  const request = await CertificateRequest.findById(requestId).populate('userId');
  if (!request) {
    const error = new Error('Certificate request not found');
    error.statusCode = 404;
    throw error;
  }

  // Duplicate draft protection: return existing certificate if one was already linked
  if (request.certificateId) {
    const existingCert = await Certificate.findById(request.certificateId);
    if (existingCert) {
      return existingCert;
    }
  }

  const user = request.userId;
  if (!user) {
    const error = new Error('Associated intern not found for this request');
    error.statusCode = 404;
    throw error;
  }

  // Must use the matching active CertificateTemplate (no fallback template)
  const template = await CertificateTemplate.findOne({
    certificateType: request.certificateType,
    status: 'active'
  });

  if (!template) {
    const error = new Error(`No active certificate template found for type: ${request.certificateType}`);
    error.statusCode = 404;
    throw error;
  }

  if (!template.content) {
    const error = new Error(`Certificate template for type '${request.certificateType}' does not contain content`);
    error.statusCode = 400;
    throw error;
  }

  const certificateNumber = await generateCertificateNumber();
  const verificationCode = generateVerificationCode();

  const templateData = {
    InternName: user.fullName || '',
    CertificateNumber: certificateNumber,
    Department: user.domain || '',
    StartDate: formatDate(user.startDate),
    EndDate: formatDate(user.endDate),
    IssueDate: formatDate(new Date()),
    InternCode: user.internCode || '',
    CertificateType: request.certificateType || '',
    VerificationCode: verificationCode
  };

  const compiledTemplate = Handlebars.compile(template.content);
  const htmlContent = compiledTemplate(templateData);

  const certificate = await Certificate.create({
    certificateNumber,
    userId: user._id,
    internCode: user.internCode,
    templateId: template._id,
    certificateType: request.certificateType,
    domain: user.domain,
    startDate: user.startDate,
    endDate: user.endDate,
    issuedDate: new Date(),
    status: 'draft',
    htmlContent,
    verificationCode,
    generatedBy: request.reviewedBy
  });

  request.certificateId = certificate._id;
  await request.save();

  return certificate;
};

/**
 * Fetches a Certificate draft by its Certificate ID.
 *
 * @param {string} id - Certificate ID
 * @returns {Promise<Certificate>}
 */
export const getCertificateDraft = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid certificate ID');
    error.statusCode = 400;
    throw error;
  }

  const certificate = await Certificate.findById(id).populate('userId', 'fullName email internCode domain');
  if (!certificate) {
    const error = new Error('Certificate draft not found');
    error.statusCode = 404;
    throw error;
  }

  return certificate;
};

/**
 * Updates the htmlContent of a draft Certificate.
 * Only allows editing if certificate.status is 'draft'.
 *
 * @param {string} id - Certificate ID
 * @param {string} htmlContent - Updated HTML string
 * @returns {Promise<Certificate>}
 */
export const updateCertificateDraft = async (id, htmlContent) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid certificate ID');
    error.statusCode = 400;
    throw error;
  }

  if (typeof htmlContent !== 'string' || !htmlContent.trim()) {
    const error = new Error('htmlContent is required');
    error.statusCode = 400;
    throw error;
  }

  const certificate = await Certificate.findById(id);
  if (!certificate) {
    const error = new Error('Certificate draft not found');
    error.statusCode = 404;
    throw error;
  }

  if (certificate.status !== 'draft') {
    const error = new Error('Only draft certificates can be edited');
    error.statusCode = 400;
    throw error;
  }

  certificate.htmlContent = htmlContent;
  await certificate.save();

  return certificate;
};
