import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

export default function InternDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">

      {/* Top-Navbar */}

      <header className="top-navbar">
        <div className="brand">
          <span className="brand-icon">🚀</span>
          <strong>uptoskills</strong>
        </div>

        <div className="header-actions">
          <div className="user-profile">
            <div className="avatar">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info">
              <strong>{user?.name || 'Intern Student'}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}

      <aside className="sidebar">
        <div className="sidebar-nav">
          <span className="nav-label">MAIN MENU</span>
          <button className="nav-item active">
            <span>📊</span> Dashboard
          </button>
          <button className="nav-item">
            <span>📜</span> My Certificates
          </button>
          <button className="nav-item">
            <span>📝</span> Request Certificate
          </button>
        </div>

        <button className="btn-action outline logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.name || 'Intern'}! 👋</h1>
            <p>Track your internship progress, certificate generation, and status updates.</p>
          </div>

        {  /* Quick Stat Cards */}

          <div className="stat-grid">
            <div className="stat-card border-accent">
              <div className="stat-header">
                <small>TOTAL REQUESTS</small>
                <span className="icon accent-icon">📑</span>
              </div>
              <h2>1</h2>
              <p>Applications submitted</p>
            </div>

            <div className="stat-card border-success">
              <div className="stat-header">
                <small>APPROVED</small>
                <span className="icon success-icon">✅</span>
              </div>
              <h2>1</h2>
              <p>Ready to download</p>
            </div>

            <div className="stat-card border-warning">
              <div className="stat-header">
                <small>PENDING REVIEW</small>
                <span className="icon warning-icon">⏳</span>
              </div>
              <h2>0</h2>
              <p>Under verification</p>
            </div>
          </div>

         { /* Certificates Table */}
          <div className="data-section">
            <div className="section-header">
              <h3>Recent Certificate Requests</h3>
              <button className="btn-secondary">+ New Request</button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>INTERNSHIP DOMAIN</th>
                    <th>ISSUE DATE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="cert-name">
                        <span>🎓</span> MERN Stack Web Development
                      </div>
                    </td>
                    <td className="muted-text">Aug 15, 2026</td>
                    <td>
                      <span className="badge badge-success">● Verified</span>
                    </td>
                    <td>
                      <button className="btn-action outline">View Certificate</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}