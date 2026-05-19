import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './pages/Login.js';
import Menu from './pages/Menu.js';
import AdminDashboard from './pages/AdminDashboard.js';
import ProtectedRoute from './components/ProtectedRoute.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu/table/:tableCode" element={<Menu />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/kitchen" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
