import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HRDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
      <h1>💼 HR Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}!</p>
      <p>Request Review Queue & Templates</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#fb7185',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  );
}