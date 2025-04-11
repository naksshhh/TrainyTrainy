import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SearchTrains from './pages/SearchTrains';
import BookTicket from './pages/BookTicket';
import MyBookings from './pages/MyBookings';
import PNRStatus from './pages/PNRStatus';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/search" element={<SearchTrains />} />
            <Route
              path="/book"
              element={
                <ProtectedRoute>
                  <BookTicket />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route path="/pnr" element={<PNRStatus />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 