import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TapeChartPage from './pages/TapeChartPage';
import Reservations from './pages/Reservations';
import NewReservation from './pages/NewReservation';
import GroupReservations from './pages/GroupReservations';
import Guests from './pages/Guests';
import TravelAgents from './pages/TravelAgents';
import Rooms from './pages/Rooms';
import NightAudit from './pages/NightAudit';
import Reports from './pages/Reports';
import Administration from './pages/Administration';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tape-chart" element={<TapeChartPage />} />
                    <Route path="/reservations" element={<Reservations />} />
                    <Route path="/reservations/new" element={<ProtectedRoute requiredPermission="reservations.create"><NewReservation /></ProtectedRoute>} />
                    <Route path="/group-reservations" element={<ProtectedRoute requiredPermission="group_reservation.view"><GroupReservations /></ProtectedRoute>} />
                    <Route path="/guests" element={<Guests />} />
                    <Route path="/travel-agents" element={<TravelAgents />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/night-audit" element={<NightAudit />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/administration" element={<ProtectedRoute requiredPermission="users.view"><Administration /></ProtectedRoute>} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
