import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import CertificatePreview from '../components/CertificatePreview';
import { DEMO_CERTIFICATE_HTML } from '../constants/demoCertificateTemplate';
import './CertificateReviewPage.css';

/**
 * CertificateReviewPage
 *
 * Day 2 Certificate Engine Review Interface Shell.
 * Provides live HTML editing and iframe-based rendering for certificate verification.
 */
export default function CertificateReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const [htmlContent, setHtmlContent] = useState(DEMO_CERTIFICATE_HTML);
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

  const handleResetTemplate = () => {
    setHtmlContent(DEMO_CERTIFICATE_HTML);
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
              <h1>Review Certificate</h1>
              <p>Review and customize the certificate HTML before final approval. Live changes reflect immediately.</p>
            </div>

            <div className="certificate-review-status-tags">
              <span className="review-badge-status">Day 2 Prototype</span>
              <span className="review-badge-draft">Review Mode</span>
            </div>
          </div>
        </div>

        {/* Request context banner */}
        <section className="certificate-context-banner" aria-label="Certificate request context">
          <div className="certificate-context-icon" aria-hidden="true">
            <span>ℹ</span>
          </div>
          <div className="certificate-context-info">
            <div className="certificate-context-info-top">
              <span className="certificate-context-id">
                Request Reference: <code>{id || 'unspecified'}</code>
              </span>
              <span className="certificate-context-tag">Demonstration Preview</span>
            </div>
            <p className="certificate-context-desc">
              This review screen serves as the Day 2 visual shell and real-time editor. Live intern data binding and
              draft persistence will connect in Day 3. The certificate content shown below is a demonstration template for review verification.
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
                  onClick={handleResetTemplate}
                  title="Reset to default demonstration template"
                >
                  <span>↺ Reset</span>
                </button>
              </div>
            </header>

            <div className="certificate-editor-body">
              <p className="certificate-editor-instructions">
                Modify HTML markup, styles, or certificate placeholders below. The preview updates instantly.
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
                  className="editor-save-btn is-disabled"
                  disabled
                  title="Draft persistence will be connected in Day 3"
                >
                  Save Draft (Day 3)
                </button>
                <span className="editor-save-note">
                  Draft saving will be available in Day 3.
                </span>
              </div>

              <div className="editor-stats-indicator">
                <span>UTF-8 · HTML5</span>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
