import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, University } from '../lib/supabase';
import { GraduationCap, Users, BarChart3, LogOut, User, ChevronDown, Calendar, Brain, Plug } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { staff, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [university, setUniversity] = useState<University | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (staff?.university_id) {
      fetchUniversity();
    }
  }, [staff?.university_id]);

  const fetchUniversity = async () => {
    try {
      const { data } = await supabase
        .from('universities')
        .select('*')
        .eq('id', staff?.university_id)
        .maybeSingle();

      if (data) {
        setUniversity(data as University);
      }
    } catch (err) {
      console.error('Error fetching university:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    //{ path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/availability', label: 'Calendar', icon: Calendar },
    { path: '/reports', label: 'Reports', icon: Brain },
  ];

  // Only shown to admins
  const adminNavItems = [
    { path: '/connectors', label: 'Connectors', icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/analytics" className="flex items-center space-x-2">
                {university?.logo_url ? (
                  <img
                    src={university.logo_url}
                    alt={university.name}
                    className="w-10 h-10 rounded-full object-cover border-2"
                    style={{ borderColor: university.primary_color }}
                  />
                ) : (
                  <div className="p-2 rounded-lg" style={{ backgroundColor: university?.primary_color || '#3B82F6' }}>
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                )}
                <span className="text-xl font-bold text-gray-900">{university?.name || 'VillageU'}</span>
              </Link>

              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? ''
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={isActive ? {
                        backgroundColor: `${university?.primary_color || '#3B82F6'}15`,
                        color: university?.primary_color || '#1D4ED8'
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Admin-only nav items */}
                {staff?.is_admin && adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? ''
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                      style={isActive ? {
                        backgroundColor: `${university?.primary_color || '#3B82F6'}15`,
                        color: university?.primary_color || '#1D4ED8'
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {staff?.profile_image_url ? (
                    <img
                      src={staff.profile_image_url}
                      alt={`${staff.first_name} ${staff.last_name}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                      {staff?.first_name?.[0]}
                      {staff?.last_name?.[0]}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {staff?.first_name} {staff?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {staff?.role}
                      {staff?.is_admin && (
                        <span className="ml-1 text-indigo-500 font-medium">· Admin</span>
                      )}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile/edit"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Link>
                    {staff?.is_admin && (
                      <Link
                        to="/connectors"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Plug className="w-4 h-4" />
                        <span>Connectors</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
