import { useCallback, useEffect, useState, useRef } from 'react';
import { getCertificateDraft, updateCertificateDraft } from '../services/admin.service';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

/**
 * Custom hook for managing Certificate Draft review lifecycle.
 *
 * @param {string} certificateId
 */
export default function useCertificateDraft(certificateId) {
  const [draft, setDraft] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Prevent race conditions and duplicate save submissions
  const isSavingRef = useRef(false);

  const fetchDraft = useCallback(async (idToFetch) => {
    const targetId = idToFetch || certificateId;
    if (!targetId) {
      setLoading(false);
      setError('Invalid certificate ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCertificateDraft(targetId);
      const certificate = data.certificate || data;
      setDraft(certificate);
      setHtmlContent(certificate.htmlContent || '');
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load certificate draft.'));
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  const saveDraft = useCallback(async () => {
    if (!certificateId || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const data = await updateCertificateDraft(certificateId, htmlContent);
      const updatedCert = data.certificate || data;
      setDraft(updatedCert);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'Unable to save draft. Please try again.'));
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [certificateId, htmlContent]);

  const resetContent = useCallback(() => {
    if (draft?.htmlContent) {
      setHtmlContent(draft.htmlContent);
    }
  }, [draft]);

  useEffect(() => {
    if (!certificateId) return;
    const timer = setTimeout(() => {
      fetchDraft(certificateId);
    }, 0);
    return () => clearTimeout(timer);
  }, [certificateId, fetchDraft]);

  return {
    draft,
    htmlContent,
    setHtmlContent,
    loading,
    saving,
    error,
    saveError,
    saveSuccess,
    fetchDraft,
    saveDraft,
    resetContent
  };
}
