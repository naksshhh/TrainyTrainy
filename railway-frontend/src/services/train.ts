import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Train {
  train_id: number;
  trainNumber: string;
  trainName: string;
  sourceStation: string;
  destinationStation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: {
    [key: string]: number;
  };
}

export interface SeatAvailability {
  classType: string;
  availableSeats: number;
  bookedSeats: number;
}

export const searchTrains = async (
  source: string,
  destination: string,
  date: string
): Promise<Train[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/trains/search`, {
    params: { source, destination, date },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getSeatAvailability = async (
  trainId: number,
  journeyDate: string,
  classType: string
): Promise<SeatAvailability> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/trains/${trainId}/availability`, {
    params: { journeyDate, classType },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const bookTicket = async (
  trainId: number,
  journeyDate: string,
  classType: string,
  sourceStation: string,
  destinationStation: string,
  passengers: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    concessionCategory?: string;
  }[],
  totalFare: number
): Promise<{ pnrNumber: string }> => {
  const token = localStorage.getItem('token');
  const bookingPayload = {
    trainId,
    journeyDate,
    classType,
    sourceStation,
    destinationStation,
    passengers,
    totalFare
  };
  console.log('Booking payload:', bookingPayload);
  try {
    const response = await axios.post(`${API_URL}/bookings`, bookingPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Booking error response:', error.response.data);
      throw new Error(error.response.data.error || 'Booking failed');
    } else {
      console.error('Booking error:', error);
      throw new Error('Booking failed');
    }
  }
};

export const getBookingDetails = async (pnrNumber: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/pnr/${pnrNumber}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const cancelBooking = async (pnrNumber: string) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/bookings/cancel/${pnrNumber}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getUserBookings = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};