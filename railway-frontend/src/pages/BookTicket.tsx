 import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookTicket } from '../services/train.ts';

interface Passenger {
  name: string;
  age: number;
  gender: string;
}

const travelClasses = [
  'Sleeper',
  'AC 3 Tier',
  'AC 2 Tier',
  'AC First Class',
  'Second Sitting',
  'First Class',
  'Chair Car'
];

const BookTicket: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const train = (location.state as any)?.train;
  const journeyDate = (location.state as any)?.journeyDate || '';

  const [selectedClass, setSelectedClass] = useState<string>(travelClasses[0]);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: '', age: 0, gender: '' }
  ]);
  const [loading, setLoading] = useState(false);

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string | number) => {
    const updated = [...passengers];
    if (field === 'age') {
      updated[index][field] = Number(value) as Passenger[typeof field];
    } else {
      updated[index][field] = String(value) as Passenger[typeof field];
    }
    setPassengers(updated);
  };

  const addPassenger = () => {
    setPassengers([...passengers, { name: '', age: 0, gender: '' }]);
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
    if (passengers.some(p => !p.name || !p.age || !p.gender)) {
      toast.error('Fill all passenger details!');
      return;
    }
    setLoading(true);
    try {
      await bookTicket(
        train.trainNumber, // or train.trainId if backend expects trainId
        journeyDate,
        selectedClass,
        passengers
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
            <div key={idx} className="flex space-x-2 items-end">
              <input
                type="text"
                placeholder="Name"
                value={passenger.name}
                onChange={e => handlePassengerChange(idx, 'name', e.target.value)}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Age"
                value={passenger.age || ''}
                min={1}
                onChange={e => handlePassengerChange(idx, 'age', Number(e.target.value))}
                className="input-field w-20"
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