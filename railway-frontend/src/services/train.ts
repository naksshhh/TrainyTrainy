import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Train {
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
  const response = await axios.get(`${API_URL}/trains/search`, {
    params: { source, destination, date }
  });
  return response.data;
};

export const getSeatAvailability = async (
  trainId: number,
  journeyDate: string,
  classType: string
): Promise<SeatAvailability> => {
  const response = await axios.get(`${API_URL}/trains/availability`, {
    params: { trainId, journeyDate, classType }
  });
  return response.data;
};

export const bookTicket = async (
  trainId: number,
  journeyDate: string,
  classType: string,
  passengers: {
    name: string;
    age: number;
    gender: string;
  }[]
): Promise<{ pnrNumber: string }> => {
  const response = await axios.post(`${API_URL}/bookings`, {
    trainId,
    journeyDate,
    classType,
    passengers
  });
  return response.data;
};

export const getBookingDetails = async (pnrNumber: string) => {
  const response = await axios.get(`${API_URL}/bookings/${pnrNumber}`);
  return response.data;
};

export const cancelBooking = async (pnrNumber: string) => {
  const response = await axios.post(`${API_URL}/bookings/cancel/${pnrNumber}`);
  return response.data;
};

export const getUserBookings = async () => {
  const response = await axios.get(`${API_URL}/bookings/my-bookings`);
  return response.data;
}; 