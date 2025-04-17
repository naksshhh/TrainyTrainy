import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Station {
  station_id: number;
  station_name: string;
  station_code: string;
}

export const fetchStationSuggestions = async (query: string): Promise<Station[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/stations`, {
    params: { query },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
