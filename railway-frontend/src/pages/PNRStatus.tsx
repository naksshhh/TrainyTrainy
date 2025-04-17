import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getBookingDetails } from '../services/train.ts';

interface PNRDetails {
  pnrNumber: string;
  passengerName: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  journeyDate: string;
  class: string;
  seatNumber: string;
  status: 'Confirmed' | 'Waitlist' | 'RAC' | 'Cancelled';
}

const PNRStatus: React.FC = () => {
  const [pnr, setPnr] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<PNRDetails | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingDetails = await getBookingDetails(pnr);
      // Map backend response to PNRDetails structure
      const passenger = bookingDetails.passengers && bookingDetails.passengers[0];
      setTicket({
        pnrNumber: bookingDetails.pnr_number || bookingDetails.pnrNumber || pnr,
        passengerName: passenger ? passenger.name : '',
        trainNumber: bookingDetails.train_number || bookingDetails.trainNumber || '',
        trainName: bookingDetails.train_name || bookingDetails.trainName || '',
        source: bookingDetails.source || bookingDetails.source_station || '',
        destination: bookingDetails.destination || bookingDetails.destination_station || '',
        journeyDate: bookingDetails.journey_date || bookingDetails.journeyDate || '',
        class: bookingDetails.class_type || bookingDetails.class || '',
        seatNumber: passenger ? (passenger.seatNumber || passenger.seat_number || '') : '',
        status: passenger ? passenger.status : '',
      });
      toast.success('PNR details found!');
    } catch (error) {
      toast.error('Failed to fetch PNR details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PNRDetails['status']) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Waitlist':
        return 'bg-yellow-100 text-yellow-800';
      case 'RAC':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Check PNR Status</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pnr" className="block text-sm font-medium text-gray-700">
              PNR Number
            </label>
            <input
              type="text"
              id="pnr"
              value={pnr}
              onChange={(e) => setPnr(e.target.value)}
              className="input-field mt-1"
              placeholder="Enter 10-digit PNR number"
              pattern="[A-Za-z0-9]{10}"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span>Checking...</span>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                <span>Check Status</span>
              </>
            )}
          </button>
        </form>
      </div>

      {ticket && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">PNR: {ticket.pnrNumber}</h3>
              <p className="text-sm text-gray-500">Passenger: {ticket.passengerName}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                ticket.status
              )}`}
            >
              {ticket.status}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Train</p>
              <p className="font-medium">{ticket.trainName}</p>
              <p className="text-sm text-gray-500">Train No: {ticket.trainNumber}</p>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">From</p>
                <p className="font-medium">{ticket.source}</p>
              </div>
              <div className="flex-1 px-8">
                <div className="h-0.5 bg-gray-300 relative">
                  <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-gray-300"></div>
                  <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p className="font-medium">{ticket.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium">{ticket.class}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seat/Berth</p>
                <p className="font-medium">{ticket.seatNumber}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PNRStatus;