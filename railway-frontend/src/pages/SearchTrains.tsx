import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { searchTrains, Train } from '../services/train.ts';
import { fetchStationSuggestions, Station } from '../services/station.ts';

const SearchTrains: React.FC = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState<Train[]>([]);
  const [sourceSuggestions, setSourceSuggestions] = useState<Station[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Station[]>([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const sourceTimeout = useRef<NodeJS.Timeout | null>(null);
  const destinationTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const results = await searchTrains(source, destination, date);
      setTrains(results);
      if (results.length === 0) {
        toast('No trains found for the selected route and date');
      } else {
        toast.success('Trains found successfully!');
      }
    } catch (error) {
      toast.error('Failed to fetch trains. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // The train object includes train_id (primary key) and trainNumber (public number).
  // Always use train.train_id for booking actions.
  const handleBookNow = (train: Train) => {
    navigate('/book', {
      state: {
        train,
        journeyDate: date
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Trains</h2>
        <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:space-x-4">
          <div className="flex-1">
            <label htmlFor="source" className="block text-sm font-medium text-gray-700">
              From
            </label>
            <input
              type="text"
              id="source"
              value={source}
              autoComplete="off"
              onChange={async (e) => {
                const value = e.target.value;
                setSource(value);
                setShowSourceDropdown(true);
                if (sourceTimeout.current) clearTimeout(sourceTimeout.current);
                sourceTimeout.current = setTimeout(async () => {
                  if (value.length > 0) {
                    try {
                      const suggestions = await fetchStationSuggestions(value);
                      setSourceSuggestions(suggestions);
                    } catch (err) {
                      setSourceSuggestions([]);
                    }
                  } else {
                    setSourceSuggestions([]);
                  }
                }, 250);
              }}
              onFocus={() => setShowSourceDropdown(true)}
              onBlur={() => setTimeout(() => setShowSourceDropdown(false), 150)}
              className="input-field mt-1"
              placeholder="Enter source station"
              required
            />
            {showSourceDropdown && sourceSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 rounded shadow">
                {sourceSuggestions.map((s) => (
                  <li
                    key={s.station_id}
                    className="px-3 py-2 hover:bg-indigo-100 cursor-pointer"
                    onMouseDown={() => {
                      setSource(s.station_name);
                      setShowSourceDropdown(false);
                    }}
                  >
                    {s.station_name} ({s.station_code})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
              To
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              autoComplete="off"
              onChange={async (e) => {
                const value = e.target.value;
                setDestination(value);
                setShowDestinationDropdown(true);
                if (destinationTimeout.current) clearTimeout(destinationTimeout.current);
                destinationTimeout.current = setTimeout(async () => {
                  if (value.length > 0) {
                    try {
                      const suggestions = await fetchStationSuggestions(value);
                      setDestinationSuggestions(suggestions);
                    } catch (err) {
                      setDestinationSuggestions([]);
                    }
                  } else {
                    setDestinationSuggestions([]);
                  }
                }, 250);
              }}
              onFocus={() => setShowDestinationDropdown(true)}
              onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 150)}
              className="input-field mt-1"
              placeholder="Enter destination station"
              required
            />
            {showDestinationDropdown && destinationSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 w-full mt-1 rounded shadow">
                {destinationSuggestions.map((s) => (
                  <li
                    key={s.station_id}
                    className="px-3 py-2 hover:bg-indigo-100 cursor-pointer"
                    onMouseDown={() => {
                      setDestination(s.station_name);
                      setShowDestinationDropdown(false);
                    }}
                  >
                    {s.station_name} ({s.station_code})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field mt-1"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary w-full md:w-auto flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span>Searching...</span>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {trains.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Available Trains</h3>
          {trains.map((train) => (
            <div key={train.trainNumber} className="bg-white rounded-lg shadow-md p-6">
              <div className="md:flex md:justify-between md:items-center">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{train.trainName}</h4>
                  <p className="text-sm text-gray-500">Train No: {train.trainNumber}</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{train.departureTime}</p>
                    <p className="text-sm text-gray-500">Departure</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{train.duration}</p>
                    <div className="w-24 h-0.5 bg-gray-300 relative">
                      <div className="absolute -top-1.5 right-0 w-3 h-3 rounded-full bg-gray-300"></div>
                      <div className="absolute -top-1.5 left-0 w-3 h-3 rounded-full bg-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{train.arrivalTime}</p>
                    <p className="text-sm text-gray-500">Arrival</p>
                  </div>
                </div>
              </div>
              
              {/* Seat Availability */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(train.availableSeats || {}).map(([className, seats]) => (
                  <div key={className} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">{className}</p>
                    <p className="mt-1 text-lg font-semibold text-indigo-600">{seats} seats</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleBookNow(train)}
                  className="btn-primary"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {trains.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Search for trains to see available options</p>
        </div>
      )}
    </div>
  );
};

export default SearchTrains; 