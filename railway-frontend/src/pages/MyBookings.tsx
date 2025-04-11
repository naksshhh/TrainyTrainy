import React, { useState, useEffect } from 'react';
import { TicketIcon, XIcon } from '@heroicons/react/outline';
import toast from 'react-hot-toast';
import { getUserBookings, cancelBooking } from '../services/train';

interface Booking {
  pnrNumber: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  journeyDate: string;
  passengers: {
    name: string;
    seatNumber: string;
    status: string;
  }[];
  class: string;
  status: 'Confirmed' | 'Waitlist' | 'RAC' | 'Cancelled';
  fare: number;
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPNR, setSelectedPNR] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const userBookings = await getUserBookings();
      setBookings(userBookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      await cancelBooking(selectedPNR);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: Booking['status']) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <TicketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by booking a new train ticket.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.pnrNumber} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    PNR: {booking.pnrNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {booking.trainName} ({booking.trainNumber})
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{booking.source}</p>
                  </div>
                  <div className="flex-1 px-8">
                    <div className="h-0.5 bg-gray-300 relative">
                      <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{booking.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Journey Date</p>
                    <p className="font-medium">{booking.journeyDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">{booking.class}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Passengers</p>
                  <div className="space-y-2">
                    {booking.passengers.map((passenger, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{passenger.name}</p>
                          <p className="text-sm text-gray-500">
                            Seat: {passenger.seatNumber}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            passenger.status as Booking['status']
                          )}`}
                        >
                          {passenger.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total Fare</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₹{booking.fare}
                    </p>
                  </div>
                  {booking.status !== 'Cancelled' && (
                    <button
                      onClick={() => {
                        setSelectedPNR(booking.pnrNumber);
                        setShowCancelModal(true);
                      }}
                      className="btn-danger flex items-center"
                    >
                      <XIcon className="h-5 w-5 mr-2" />
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary"
              >
                No, keep it
              </button>
              <button onClick={handleCancelBooking} className="btn-danger">
                Yes, cancel it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings; 