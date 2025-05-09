import { useState } from "react";
import { Link } from "wouter";
import { 
  Search, 
  User, 
  FileText, 
  Home, 
  BarChart2, 
  Settings, 
  Users, 
  Microscope, 
  Calendar,
  ChevronRight,
  Bike,
  Activity,
  TrendingUp,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

// Generate months for the activity chart
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState("Apr");
  
  // Mock data for the dashboard demo
  const statsData = {
    totalHours: { value: "748", label: "Hr", period: "April" },
    totalSteps: { value: "9,178", label: "St", period: "April" },
    targetSteps: { value: "9,200", label: "St", period: "April" },
    activeTime: { value: "748", label: "hr", period: "July" },
  };
  
  const activityData = [
    { id: 1, name: "Bicycle Drill", icon: <Bike size={20} />, progress: 45, metric: "km / week", current: 10, target: 22, color: "bg-emerald-500" },
    { id: 2, name: "Jogging Hero", icon: <Activity size={20} />, progress: 13, metric: "km / month", current: 3, target: 22, color: "bg-emerald-500" },
    { id: 3, name: "Healthy Busy", icon: <Heart size={20} />, progress: 90, metric: "steps / week", current: 9000, target: 10000, color: "bg-emerald-500" },
  ];
  
  const friendsData = [
    { id: 1, name: "Max Stone", activity: "Weekly Bicycle", timeAgo: "10 min ago", avatar: "MS" },
    { id: 2, name: "Grisha Jack", activity: "Daily Jogging", timeAgo: "1 hour ago", avatar: "GJ" },
    { id: 3, name: "Leo Patrick", activity: "Morning Swim", timeAgo: "2 hour ago", avatar: "LP" },
    { id: 4, name: "Cody Bryan", activity: "Gym Session", timeAgo: "3 hour ago", avatar: "CB" },
    { id: 5, name: "Max Stone", activity: "Running", timeAgo: "1 day ago", avatar: "MS" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Purple sidebar similar to sample */}
      <div className="w-20 bg-purple-700 flex flex-col items-center py-8 gap-8">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-purple-700"></div>
        </div>
        
        <nav className="flex flex-col gap-6">
          <Link href="/dashboard">
            <a className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white hover:bg-opacity-30 transition-all">
              <Home size={20} />
            </a>
          </Link>
          <Link href="/patients">
            <a className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all">
              <FileText size={20} />
            </a>
          </Link>
          <Link href="/lab-works">
            <a className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all">
              <Microscope size={20} />
            </a>
          </Link>
          <Link href="/staff">
            <a className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all">
              <Users size={20} />
            </a>
          </Link>
          <Link href="/revenue">
            <a className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all">
              <BarChart2 size={20} />
            </a>
          </Link>
        </nav>
        
        <div className="mt-auto">
          <Link href="/settings">
            <a className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center text-white/70 hover:bg-white/10 transition-all">
              <Settings size={20} />
            </a>
          </Link>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with search and avatar */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-gray-500 font-medium">Summary</p>
              <h1 className="text-2xl font-bold">Dashboard</h1>
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
              
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-purple-700 text-white">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left column with overview and stats */}
            <div className="col-span-2">
              {/* Overview chart card */}
              <div className="bg-purple-700 rounded-3xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold text-lg">Overview</h3>
                  
                  <div className="bg-purple-600 rounded-full px-4 py-1 text-white text-sm">
                    <select 
                      className="bg-transparent focus:outline-none"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      <option value="Monthly" className="bg-purple-700">Monthly</option>
                      <option value="Yearly" className="bg-purple-700">Yearly</option>
                      <option value="Weekly" className="bg-purple-700">Weekly</option>
                    </select>
                  </div>
                </div>
                
                {/* Activity chart */}
                <div className="mb-6 relative h-36">
                  {/* SVG path chart simulation */}
                  <svg className="w-full h-full" viewBox="0 0 1000 180">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF85B3" />
                        <stop offset="100%" stopColor="rgba(255, 133, 179, 0)" />
                      </linearGradient>
                    </defs>
                    {/* Line path */}
                    <path 
                      d="M0,140 C40,120 80,90 120,110 C160,130 200,150 240,130 C280,110 320,60 360,80 C400,100 440,130 480,100 C520,70 560,30 600,60 C640,90 680,130 720,110 C760,90 800,50 840,70 C880,90 920,120 960,100 C980,90 1000,80 1000,100" 
                      fill="none" 
                      stroke="#FF85B3" 
                      strokeWidth="3"
                    />
                    
                    {/* Highlight point for April */}
                    <circle cx="480" cy="100" r="8" fill="#FF3373" strokeWidth="4" stroke="white" />
                    
                    {/* Area under the path */}
                    <path 
                      d="M0,140 C40,120 80,90 120,110 C160,130 200,150 240,130 C280,110 320,60 360,80 C400,100 440,130 480,100 C520,70 560,30 600,60 C640,90 680,130 720,110 C760,90 800,50 840,70 C880,90 920,120 960,100 C980,90 1000,80 1000,100 V180 H0 Z" 
                      fill="url(#gradient)"
                      opacity="0.4"
                    />
                  </svg>
                  
                  {/* Highlight point info */}
                  <div className="absolute top-0 left-[47%] -mt-1 text-center">
                    <div className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      9,178
                    </div>
                    <div className="text-pink-200 text-xs mt-1">Steps</div>
                  </div>
                </div>
                
                {/* Month markers */}
                <div className="flex justify-between text-purple-300 text-xs">
                  {months.map(month => (
                    <div 
                      key={month} 
                      className={`${month === selectedMonth ? 'bg-purple-500 text-white px-3 py-0.5 rounded-full' : ''}`}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-700 rounded-3xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Total Hours</div>
                  <div className="text-2xl font-bold mt-1">{statsData.totalHours.value} {statsData.totalHours.label}</div>
                  <div className="text-purple-300 text-sm">{statsData.totalHours.period}</div>
                </div>
                
                <div className="bg-purple-700 rounded-3xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Total Steps</div>
                  <div className="text-2xl font-bold mt-1">{statsData.totalSteps.value} {statsData.totalSteps.label}</div>
                  <div className="text-purple-300 text-sm">{statsData.totalSteps.period}</div>
                </div>
                
                <div className="bg-purple-700 rounded-3xl p-4 text-white">
                  <div className="text-purple-300 text-sm">Target</div>
                  <div className="text-2xl font-bold mt-1">{statsData.targetSteps.value} {statsData.targetSteps.label}</div>
                  <div className="text-purple-300 text-sm">{statsData.targetSteps.period}</div>
                </div>
              </div>
              
              {/* Activity cards */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {activityData.map(activity => (
                  <div key={activity.id} className="bg-white rounded-3xl p-5 shadow-sm">
                    <div className="flex gap-3 items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-purple-700">
                        {activity.icon}
                      </div>
                      <div className="font-medium">{activity.name}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-1">
                      Progress
                    </div>
                    
                    <Progress value={activity.progress} className="h-1.5 mb-4" indicatorClassName={activity.color} />
                    
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>{activity.current} {activity.metric}</div>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] rounded-full bg-pink-50 border-pink-100 text-pink-500 hover:bg-pink-100">
                        {activity.target} goal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right column with activities/jogging and friends */}
            <div className="space-y-6">
              {/* Activity cards */}
              <div className="bg-white p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Friends</h2>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View All
                  </Button>
                </div>
                
                <Tabs defaultValue="activities">
                  <TabsList className="grid w-full grid-cols-2 mb-6 rounded-xl bg-gray-100 p-1">
                    <TabsTrigger value="activities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Activities</TabsTrigger>
                    <TabsTrigger value="online" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Online</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="activities">
                    <div className="space-y-4">
                      {friendsData.map(friend => (
                        <div key={friend.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {friend.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{friend.name}</div>
                              <div className="text-xs text-gray-500">{friend.activity}</div>
                              <div className="text-xs text-gray-400">{friend.timeAgo}</div>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full">
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="online">
                    <div className="h-60 flex items-center justify-center text-gray-500">
                      No friends online at the moment
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Jogging cards */}
              <div className="space-y-4">
                <div className="bg-purple-700 p-5 rounded-3xl text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <div className="font-medium">Daily Jogging</div>
                  </div>
                </div>
                
                <div className="bg-pink-500 p-5 rounded-3xl text-white relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <div className="font-medium">My Jogging</div>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-pink-200 text-sm mb-1">Total Hours</div>
                      <div className="text-3xl font-bold">{statsData.activeTime.value}</div>
                      <div className="text-pink-200 text-sm">{statsData.activeTime.period}</div>
                    </div>
                    
                    <Button size="icon" className="h-8 w-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                  
                  {/* Decorative circles */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-pink-400 opacity-30"></div>
                  <div className="absolute -right-5 -bottom-5 w-20 h-20 rounded-full bg-pink-400 opacity-30"></div>
                </div>
              </div>
              
              {/* Live map */}
              <div className="bg-white p-5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Live map
                  </h2>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    View
                  </Button>
                </div>
                
                <div className="h-40 bg-gray-100 rounded-xl relative overflow-hidden">
                  {/* Simple map simulation */}
                  <div className="w-full h-full bg-gray-200 opacity-50"></div>
                  
                  {/* Friend location markers */}
                  <div className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-purple-700"></div>
                  </div>
                  <div className="absolute top-1/2 right-1/3 w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                  </div>
                  <div className="absolute bottom-1/4 right-1/4 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
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