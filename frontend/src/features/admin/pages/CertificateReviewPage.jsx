import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import CertificatePreview from '../components/CertificatePreview';
import useCertificateDraft from '../hooks/useCertificateDraft';
import './CertificateReviewPage.css';

/**
 * CertificateReviewPage
 *
 * Day 3 Certificate Engine Review Interface.
 * Connects real certificate draft fetching, live HTML editing,
 * iframe-based preview rendering, and draft persistence.
 */
export default function CertificateReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const {
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
  } = useCertificateDraft(id);

  const [copied, setCopied] = useState(false);

  const initials = (user?.fullName || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Gracefully handle clipboard write rejection
    }
  };

  // Line count for editor metadata
  const lineCount = (htmlContent.match(/\n/g) || []).length + 1;

  return (
    <div className="certificate-review-shell">
      <header className="certificate-review-topbar">
        <div className="certificate-review-brand">
          <span className="certificate-review-brand-icon">UP</span>
          <strong>uptoskills</strong>
        </div>

        <div className="certificate-review-user-area">
          <div className="certificate-review-avatar">{initials}</div>
          <div>
            <strong>{user?.fullName || 'Administrator'}</strong>
            <small>{user?.email || 'Admin Portal'}</small>
          </div>
          <button
            type="button"
            className="admin-logout"
            onClick={onLogout}
            title="Sign out"
          >
            <span>↩</span> Logout
          </button>
        </div>
      </header>

      <main className="certificate-review-main">
        <div className="certificate-review-header-section">
          <div className="certificate-review-back-nav">
            <button
              type="button"
              className="certificate-back-button"
              onClick={() => navigate('/admin/dashboard')}
              aria-label="Back to Admin Dashboard"
            >
              <span>←</span> Back to Certificate Requests
            </button>
          </div>

          <div className="certificate-review-title-row">
            <div className="certificate-review-title-block">
              <p className="admin-eyebrow">CERTIFICATE DESK</p>
              <h1>Review Certificate Draft</h1>
              <p>Review and customize the certificate HTML. Saved changes persist directly to the certificate draft.</p>
            </div>

            <div className="certificate-review-status-tags">
              <span className="review-badge-status">
                {draft?.status ? draft.status.toUpperCase() : 'DRAFT'}
              </span>
              <span className="review-badge-draft">
                {draft?.certificateType ? draft.certificateType.replace(/_/g, ' ') : 'Review Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="certificate-review-state-panel loading" role="status">
            <div className="certificate-review-spinner" aria-hidden="true" />
            <p>Loading certificate draft...</p>
          </div>
        )}

        {/* Fetch Error State */}
        {!loading && error && (
          <div className="certificate-review-state-panel error" role="alert">
            <div className="certificate-error-icon" aria-hidden="true">⚠</div>
            <div className="certificate-error-content">
              <h3>Unable to load certificate draft.</h3>
              <p>{error}</p>
              <button
                type="button"
                className="certificate-retry-btn"
                onClick={() => fetchDraft(id)}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content Loaded */}
        {!loading && !error && (
          <>
            {/* Request context banner */}
            <section className="certificate-context-banner" aria-label="Certificate request context">
              <div className="certificate-context-icon" aria-hidden="true">
                <span>ℹ</span>
              </div>
              <div className="certificate-context-info">
                <div className="certificate-context-info-top">
                  <span className="certificate-context-id">
                    Recipient: <strong>{draft?.userId?.fullName || draft?.internCode || 'Intern'}</strong>
                    {draft?.internCode && <code>({draft.internCode})</code>}
                  </span>
                  <span className="certificate-context-cert-num">
                    Certificate No: <code>{draft?.certificateNumber || 'Draft'}</code>
                  </span>
                  <span className="certificate-context-tag">Active Draft</span>
                </div>
                <p className="certificate-context-desc">
                  This certificate was compiled from the approved request and active template. You can customize the markup and styles below. Clicking "Save Draft" updates the database document.
                </p>
              </div>
            </section>

            {/* Main review workspace */}
            <div className="certificate-review-workspace">
              {/* Left: Certificate Preview */}
              <CertificatePreview htmlContent={htmlContent} />

              {/* Right: HTML/Content Editor */}
              <section className="certificate-editor-container" aria-label="Certificate HTML editor panel">
                <header className="certificate-editor-header">
                  <div className="certificate-editor-title-group">
                    <h2 className="certificate-editor-title">HTML Template Editor</h2>
                    <span className="certificate-editor-meta">{lineCount} lines · {htmlContent.length} chars</span>
                  </div>

                  <div className="certificate-editor-controls">
                    <button
                      type="button"
                      className="editor-action-btn"
                      onClick={handleCopyHtml}
                      title="Copy HTML to clipboard"
                    >
                      <span>{copied ? '✓ Copied' : '📋 Copy HTML'}</span>
                    </button>
                    <button
                      type="button"
                      className="editor-action-btn"
                      onClick={resetContent}
                      title="Reset to last saved draft content"
                    >
                      <span>↺ Revert to Saved</span>
                    </button>
                  </div>
                </header>

                <div className="certificate-editor-body">
                  <p className="certificate-editor-instructions">
                    Modify HTML markup or certificate details below. The preview updates in real-time.
                  </p>

                  <div className="certificate-editor-field">
                    <label htmlFor="certificate-html-editor" className="visually-hidden">
                      Certificate HTML markup
                    </label>
                    <textarea
                      id="certificate-html-editor"
                      className="certificate-editor-textarea"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoComplete="off"
                      autoCorrect="off"
                      aria-label="Certificate HTML markup"
                      placeholder="Enter certificate HTML template..."
                    />
                  </div>
                </div>

                <footer className="certificate-editor-footer">
                  <div className="editor-save-wrapper">
                    <button
                      type="button"
                      className={`editor-save-btn ${saving ? 'is-saving' : ''}`}
                      onClick={saveDraft}
                      disabled={saving || loading}
                      title="Save modifications to the certificate draft"
                    >
                      {saving ? 'Saving...' : 'Save Draft'}
                    </button>

                    {saveSuccess && (
                      <span className="editor-save-feedback success" role="status">
                        ✓ Draft saved successfully.
                      </span>
                    )}

                    {saveError && (
                      <span className="editor-save-feedback error" role="alert">
                        ✕ {saveError}
                      </span>
                    )}
                  </div>

                  <div className="editor-stats-indicator">
                    <span>UTF-8 · HTML5</span>
                  </div>
                </footer>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
