import React from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, TicketIcon, ClockIcon, UserIcon } from '@heroicons/react/outline';

const features = [
  {
    name: 'Search Trains',
    description: 'Find trains between stations with real-time availability',
    icon: SearchIcon,
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
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="gradient-bg absolute inset-0 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Travel Smart with</span>
              <span className="block text-indigo-600">RailwayEase</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Book train tickets, check PNR status, and manage your journeys - all in one place.
              Experience hassle-free train travel booking.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link to="/search"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Search Trains
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link to="/book"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Everything you need for train travel
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Simple, fast, and reliable train booking system designed for modern travelers.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.name} to={feature.link} className="card hover:border-indigo-500 border-2 border-transparent">
                <div className="flex flex-col items-center text-center">
                  <feature.icon className="h-12 w-12 text-indigo-600" />
                  <h3 className="mt-6 text-lg font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by thousands of travelers
            </h2>
            <p className="mt-3 text-xl text-indigo-200">
              Join our growing community of satisfied travelers who choose RailwayEase for their train journeys.
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Daily Bookings
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">1000+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Routes
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">500+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Happy Customers
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">50K+</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Home; 