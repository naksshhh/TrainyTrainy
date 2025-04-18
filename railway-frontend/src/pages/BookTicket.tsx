 import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookTicket } from '../services/train.ts';

interface Passenger {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  concessionCategory?: string;
}

const travelClasses = [
  'Sleeper',
  'AC 3-tier',
  'AC 2-tier',
  'First Class'
];

const BookTicket: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const train = (location.state as any)?.train;
  const journeyDate = (location.state as any)?.journeyDate || '';

  const [selectedClass, setSelectedClass] = useState<string>(travelClasses[0]);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', concessionCategory: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', concessionCategory: '' }
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!train || !journeyDate) {
      toast.error('Train or journey date missing!');
      return;
    }
    if (passengers.some(p => !p.firstName || !p.lastName || !p.email || !p.phone || !p.dateOfBirth || !p.gender)) {
      toast.error('Fill all passenger details!');
      return;
    }
    setLoading(true);
    try {
      const trainId = train.train_id;
      const sourceStation = train.sourceStation || train.source || '';
      const destinationStation = train.destinationStation || train.destination || '';
      // For demo, sum up a fake fare per passenger
      const totalFare = 500 * passengers.length;
      console.log('Booking call:', { trainId, journeyDate, selectedClass, sourceStation, destinationStation, passengers, totalFare });
      // Ensure each passenger's concessionCategory is valid and defaults to 'None'
      const cleanedPassengers = passengers.map(p => ({
        ...p,
        concessionCategory: (p.concessionCategory && ['Senior Citizen','Student','Disabled','None'].includes(p.concessionCategory)) ? p.concessionCategory : 'None'
      }));
      await bookTicket(
        trainId,
        journeyDate,
        selectedClass,
        sourceStation,
        destinationStation,
        cleanedPassengers,
        totalFare
      );
      toast.success('Ticket booked successfully!');
      navigate('/bookings');
    } catch (err) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!train) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No train selected. Please search and select a train first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book Ticket</h2>
        <div className="mb-4">
          <div className="font-medium">{train.trainName} ({train.trainNumber})</div>
          <div className="text-sm text-gray-500">
            {train.source || train.sourceStation} → {train.destination || train.destinationStation} | {journeyDate}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="input-field mt-1"
              required
            >
              {travelClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          {passengers.map((passenger, idx) => (
            <div key={idx} className="flex flex-wrap gap-2 items-end mb-2">
              <input
                type="text"
                placeholder="First Name"
                value={passenger.firstName}
                onChange={e => handlePassengerChange(idx, 'firstName', e.target.value)}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={passenger.lastName}
                onChange={e => handlePassengerChange(idx, 'lastName', e.target.value)}
                className="input-field"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={passenger.email}
                onChange={e => handlePassengerChange(idx, 'email', e.target.value)}
                className="input-field"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={passenger.phone}
                onChange={e => handlePassengerChange(idx, 'phone', e.target.value)}
                className="input-field"
                required
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={passenger.dateOfBirth}
                onChange={e => handlePassengerChange(idx, 'dateOfBirth', e.target.value)}
                className="input-field"
                required
              />
              <select
                value={passenger.gender}
                onChange={e => handlePassengerChange(idx, 'gender', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={passenger.concessionCategory || 'None'}
                onChange={e => handlePassengerChange(idx, 'concessionCategory', e.target.value)}
                className="input-field"
                required
              >
                <option value="None">None</option>
                <option value="Senior Citizen">Senior Citizen</option>
                <option value="Student">Student</option>
                <option value="Disabled">Disabled</option>
              </select>
              <button type="button" onClick={() => removePassenger(idx)} className="btn-danger px-2">-</button>
            </div>
          ))}
          <button type="button" onClick={addPassenger} className="btn-secondary">Add Passenger</button>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Booking...' : 'Book Ticket'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookTicket;