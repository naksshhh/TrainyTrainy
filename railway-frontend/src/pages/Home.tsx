import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, TicketIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Search Trains',
    description: 'Find trains between stations with real-time availability',
    icon: MagnifyingGlassIcon,
    link: '/search'
  },
  {
    name: 'Book Tickets',
    description: 'Quick and easy ticket booking with instant confirmation',
    icon: TicketIcon,
    link: '/book'
  },
  {
    name: 'PNR Status',
    description: 'Check your booking status and journey details',
    icon: ClockIcon,
    link: '/pnr'
  },
  {
    name: 'My Bookings',
    description: 'View and manage your train tickets',
    icon: UserIcon,
    link: '/bookings'
  }
];

const Home: React.FC = () => {
  return (
    <div className="space-y-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-400 py-16 px-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
            <span className="block">Travel Smart with</span>
            <span className="block text-yellow-300">RailwayEase</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-2xl text-indigo-100 font-light">
            Book train tickets, check PNR status, and manage your journeys – all in one place. Experience hassle-free train travel booking.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/search" className="inline-block px-8 py-3 rounded-lg bg-yellow-300 text-indigo-900 font-semibold text-lg shadow hover:bg-yellow-400 transition">
              Search Trains
            </Link>
            <Link to="/book" className="inline-block px-8 py-3 rounded-lg bg-white text-indigo-700 font-semibold text-lg shadow hover:bg-indigo-100 transition">
              Book Now
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-900 mb-2">Everything you need for train travel</h2>
          <p className="text-lg text-gray-600 font-medium">Simple, fast, and reliable train booking system designed for modern travelers.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Link key={feature.name} to={feature.link} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-indigo-400 transition p-6 flex flex-col items-center text-center cursor-pointer">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-indigo-50 group-hover:bg-indigo-100 mb-4 shadow">
                {React.createElement(feature.icon, { className: 'h-10 w-10 text-indigo-600 group-hover:text-yellow-400 transition' })}
              </div>
              <h3 className="text-xl font-bold text-indigo-900 group-hover:text-yellow-400 transition mb-2">{feature.name}</h3>
              <p className="text-gray-500 font-medium">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-800">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Trusted by thousands of travelers</h2>
            <p className="text-xl text-indigo-200 font-light">Join our growing community of satisfied travelers who choose RailwayEase for their train journeys.</p>
          </div>
          <dl className="mt-12 text-center grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <dt className="order-2 mt-2 text-lg font-medium text-indigo-200">Daily Bookings</dt>
              <dd className="order-1 text-5xl font-extrabold text-yellow-300 drop-shadow">1000+</dd>
            </div>
            <div className="flex flex-col items-center">
              <dt className="order-2 mt-2 text-lg font-medium text-indigo-200">Routes</dt>
              <dd className="order-1 text-5xl font-extrabold text-yellow-300 drop-shadow">500+</dd>
            </div>
            <div className="flex flex-col items-center">
              <dt className="order-2 mt-2 text-lg font-medium text-indigo-200">Happy Customers</dt>
              <dd className="order-1 text-5xl font-extrabold text-yellow-300 drop-shadow">50K+</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Home; 