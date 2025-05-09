import React from 'react';
import { Link } from 'wouter';
import { Home, FileText, BarChart2, Users, Settings, Search, Microscope } from 'lucide-react';

export default function BasicDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-20 bg-purple-700 flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-700"></div>
        </div>
        
        <nav className="flex flex-col gap-6">
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white hover:bg-opacity-30 transition-all cursor-pointer">
            <Home size={20} />
          </div>
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
            <FileText size={20} />
          </div>
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
            <Microscope size={20} />
          </div>
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
            <Users size={20} />
          </div>
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
            <BarChart2 size={20} />
          </div>
        </nav>
        
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all cursor-pointer">
            <Settings size={20} />
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-gray-500 font-medium">Summary</p>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center">
                DR
              </div>
            </div>
          </div>
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Main chart card */}
              <div className="bg-purple-700 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">Overview</h3>
                  
                  <div className="bg-purple-600 rounded-full px-4 py-1 text-white text-sm">
                    Monthly
                  </div>
                </div>
                
                {/* Chart placeholder */}
                <div className="h-36 relative mb-6 flex items-center justify-center">
                  <div className="w-full h-20 bg-gradient-to-r from-pink-400 to-purple-400 opacity-40 rounded-lg"></div>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <p className="text-white font-semibold">Activity Graph</p>
                  </div>
                </div>
                
                {/* Month indicators */}
                <div className="flex justify-between text-purple-300 text-xs">
                  <div>Jan</div>
                  <div>Feb</div>
                  <div>Mar</div>
                  <div className="bg-purple-500 text-white px-3 py-0.5 rounded-full">Apr</div>
                  <div>May</div>
                  <div>Jun</div>
                  <div>Jul</div>
                  <div>Aug</div>
                  <div>Sep</div>
                  <div>Oct</div>
                </div>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-700 rounded-2xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Total Hours</div>
                  <div className="text-2xl font-bold mt-1">748 Hr</div>
                  <div className="text-purple-300 text-sm">April</div>
                </div>
                
                <div className="bg-purple-700 rounded-2xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Total Steps</div>
                  <div className="text-2xl font-bold mt-1">9,178 St</div>
                  <div className="text-purple-300 text-sm">April</div>
                </div>
                
                <div className="bg-purple-700 rounded-2xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Target</div>
                  <div className="text-2xl font-bold mt-1">9,200 St</div>
                  <div className="text-purple-300 text-sm">April</div>
                </div>
              </div>
              
              {/* Activity cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Bicycle Drill", progress: 45, metric: "km / week", current: 10, target: 22 },
                  { name: "Jogging Hero", progress: 13, metric: "km / month", current: 3, target: 22 },
                  { name: "Healthy Busy", progress: 90, metric: "steps / week", current: 9000, target: 10000 }
                ].map((activity, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex gap-3 items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-purple-700">
                        <BarChart2 size={20} />
                      </div>
                      <div className="font-medium">{activity.name}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      Progress
                    </div>
                    
                    <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${activity.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>{activity.current} {activity.metric}</div>
                      <button className="h-6 px-2 text-[10px] rounded-full bg-pink-50 border border-pink-100 text-pink-500">
                        {activity.target} goal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-6">
              {/* Friends */}
              <div className="bg-white p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Friends</h2>
                  <button className="text-blue-600 text-sm">View All</button>
                </div>
                
                <div className="flex mb-4 gap-1">
                  <button className="flex-1 py-1 bg-gray-100 rounded-lg text-center text-sm font-medium">Activities</button>
                  <button className="flex-1 py-1 bg-white rounded-lg text-center text-sm font-medium shadow-sm">Online</button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "Max Stone", activity: "Weekly Bicycle", time: "10 min ago" },
                    { name: "Grisha Jack", activity: "Daily Jogging", time: "1 hour ago" },
                    { name: "Leo Patrick", activity: "Morning Swim", time: "2 hour ago" },
                    { name: "Cody Bryan", activity: "Gym Session", time: "3 hour ago" }
                  ].map((friend, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium text-sm">
                          {friend.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{friend.name}</div>
                          <div className="text-xs text-gray-500">{friend.activity}</div>
                          <div className="text-xs text-gray-400">{friend.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Additional cards */}
              <div className="space-y-4">
                <div className="bg-purple-700 p-5 rounded-2xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <BarChart2 size={20} />
                    </div>
                    <div className="font-medium">Daily Activity</div>
                  </div>
                </div>
                
                <div className="bg-pink-500 p-5 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center">
                      <BarChart2 size={20} />
                    </div>
                    <div className="font-medium">Recent Visits</div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-pink-200 text-sm mb-1">Total Hours</div>
                      <div className="text-3xl font-bold">748</div>
                      <div className="text-pink-200 text-sm">This Month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}