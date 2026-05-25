import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Download, Network } from 'lucide-react';

interface WeeklyData {
  week: string;
  meetings: number;
}

interface MeetingTypeData {
  type: string;
  count: number;
}

interface StudentEngagement {
  name: string;
  meetings: number;
  email: string;
}

interface ConnectivityData {
  totalStudents: number;
  strongCount: number;
  partialCount: number;
  limitedCount: number;
  averageScore: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
  unknownCount: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Analytics: React.FC = () => {
  const { staff } = useAuth();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [meetingTypeData, setMeetingTypeData] = useState<MeetingTypeData[]>([]);
  const [highEngagement, setHighEngagement] = useState<StudentEngagement[]>([]);
  const [lowEngagement, setLowEngagement] = useState<StudentEngagement[]>([]);
  const [connectivity, setConnectivity] = useState<ConnectivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    if (!staff?.id) return;

    try {
      const { data: villageMembers } = await supabase
        .from('village_members')
        .select('student_id')
        .eq('staff_id', staff.id);

      const villageStudentIds = villageMembers?.map(vm => vm.student_id) || [];

      if (villageStudentIds.length === 0) {
        loadDummyData();
        setLoading(false);
        return;
      }

      const { data: meetings } = await supabase
        .from('meetings')
        .select('*, students(first_name, last_name, email)')
        .eq('staff_id', staff.id)
        .in('student_id', villageStudentIds);

      if (meetings && meetings.length > 0) {
        processWeeklyData(meetings);
        processMeetingTypeData(meetings);
        await processEngagementData(meetings);
      } else {
        loadDummyData();
      }

      await fetchConnectivityData(villageStudentIds);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      loadDummyData();
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectivityData = async (villageStudentIds: string[]) => {
    if (villageStudentIds.length === 0) {
      setConnectivity({
        totalStudents: 0,
        strongCount: 0,
        partialCount: 0,
        limitedCount: 0,
        averageScore: 0,
        improvingCount: 0,
        stableCount: 0,
        decliningCount: 0,
        unknownCount: 0,
      });
      return;
    }

    try {
    const { data: students } = await supabase
  .from('students')
  .select(`
    id,
    student_sci (
      total_score,
      tier,
      trend
    )
  `)
  .in('id', villageStudentIds);

 if (students) {
  const totalStudents = students.length;

  const strongCount = students.filter(s => s.student_sci?.tier === 'strong').length;
  const partialCount = students.filter(s => s.student_sci?.tier === 'partial').length;
  const limitedCount = students.filter(
    s => !s.student_sci || s.student_sci.tier === 'limited'
  ).length;

  const totalScore = students.reduce(
    (sum, s) => sum + (s.student_sci?.total_score || 0),
    0
  );

  const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;

  const improvingCount = students.filter(s => s.student_sci?.trend === 'improving').length;
  const stableCount = students.filter(s => s.student_sci?.trend === 'stable').length;
  const decliningCount = students.filter(s => s.student_sci?.trend === 'declining').length;
  const unknownCount = students.filter(
    s => !s.student_sci || s.student_sci.trend === 'unknown'
  ).length;

  setConnectivity({
    totalStudents,
    strongCount,
    partialCount,
    limitedCount,
    averageScore,
    improvingCount,
    stableCount,
    decliningCount,
    unknownCount,
  });
}
    } catch (error) {
      console.error('Error fetching connectivity data:', error);
    }
  };

  const loadDummyData = () => {
    setWeeklyData([
      { week: 'Week 1', meetings: 8 },
      { week: 'Week 2', meetings: 12 },
      { week: 'Week 3', meetings: 15 },
      { week: 'Week 4', meetings: 10 },
      { week: 'Week 5', meetings: 18 },
      { week: 'Week 6', meetings: 14 },
    ]);

    setMeetingTypeData([
      { type: 'Check-in', count: 25 },
      { type: 'Academic', count: 18 },
      { type: 'Career', count: 15 },
      { type: 'Personal', count: 12 },
      { type: 'Goal Setting', count: 7 },
    ]);

    setHighEngagement([
      { name: 'Sarah Johnson', meetings: 12, email: 'sarah.j@example.edu' },
      { name: 'Michael Chen', meetings: 10, email: 'michael.c@example.edu' },
      { name: 'Emily Rodriguez', meetings: 9, email: 'emily.r@example.edu' },
      { name: 'James Wilson', meetings: 8, email: 'james.w@example.edu' },
      { name: 'Ashley Martinez', meetings: 7, email: 'ashley.m@example.edu' },
    ]);

    setLowEngagement([
      { name: 'David Brown', meetings: 2, email: 'david.b@example.edu' },
      { name: 'Jessica Taylor', meetings: 2, email: 'jessica.t@example.edu' },
      { name: 'Christopher Lee', meetings: 3, email: 'chris.l@example.edu' },
      { name: 'Amanda Garcia', meetings: 3, email: 'amanda.g@example.edu' },
      { name: 'Daniel White', meetings: 4, email: 'daniel.w@example.edu' },
    ]);
  };

  const processWeeklyData = (meetings: any[]) => {
    const weekMap = new Map<string, number>();
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekLabel = `Week ${6 - i}`;
      weekMap.set(weekLabel, 0);
    }

    meetings.forEach((meeting) => {
      const meetingDate = new Date(meeting.meeting_date);
      const weeksAgo = Math.floor((now.getTime() - meetingDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      if (weeksAgo >= 0 && weeksAgo < 6) {
        const weekLabel = `Week ${6 - weeksAgo}`;
        weekMap.set(weekLabel, (weekMap.get(weekLabel) || 0) + 1);
      }
    });

    const data = Array.from(weekMap.entries()).map(([week, meetings]) => ({
      week,
      meetings,
    }));

    setWeeklyData(data);
  };

  const processMeetingTypeData = (meetings: any[]) => {
    const typeMap = new Map<string, number>();

    meetings.forEach((meeting) => {
      const count = typeMap.get(meeting.meeting_type) || 0;
      typeMap.set(meeting.meeting_type, count + 1);
    });

    const data = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    setMeetingTypeData(data);
  };

  const processEngagementData = async (meetings: any[]) => {
    const studentMeetingCount = new Map<string, { count: number; student: any }>();

    meetings.forEach((meeting) => {
      const studentId = meeting.student_id;
      const current = studentMeetingCount.get(studentId);

      if (current) {
        current.count++;
      } else {
        studentMeetingCount.set(studentId, {
          count: 1,
          student: meeting.students,
        });
      }
    });

    const engagementList = Array.from(studentMeetingCount.entries()).map(([id, data]) => ({
      name: `${data.student.first_name} ${data.student.last_name}`,
      meetings: data.count,
      email: data.student.email,
    }));

    engagementList.sort((a, b) => b.meetings - a.meetings);

    setHighEngagement(engagementList.slice(0, 5));
    setLowEngagement(engagementList.slice(-5).reverse());
  };

  const exportCSV = async () => {
    if (!staff?.id) return;

    try {
      const { data: villageMembers } = await supabase
        .from('village_members')
        .select('student_id')
        .eq('staff_id', staff.id);

      const villageStudentIds = villageMembers?.map(vm => vm.student_id) || [];

const { data: students } = await supabase
  .from('students')
  .select(`
    first_name,
    last_name,
    email,
    student_sci (
      total_score,
      tier,
      trend,
      p2p_score,
      s2s_score,
      cc_score,
      last_meaningful_signal_date
    )
  `)
  .in('id', villageStudentIds);

      const csvHeader = 'Student Name,Email,SCI Total,Tier,Trend,P2P Score,S2S Score,CC Score,Last Signal Date\n';
 const csvRows = students.map(s => {
  const sci = s.student_sci || {};

  const name = `"${s.first_name} ${s.last_name}"`;
  const email = s.email;
  const total = sci.total_score ?? 0;
  const tier = sci.tier ?? 'limited';
  const trend = sci.trend ?? 'unknown';
  const p2p = sci.p2p_score ?? 0;
  const s2s = sci.s2s_score ?? 0;
  const cc = sci.cc_score ?? 0;
  const lastSignal = sci.last_meaningful_signal_date
    ? new Date(sci.last_meaningful_signal_date).toLocaleDateString()
    : 'N/A';

  return `${name},${email},${total},${tier},${trend},${p2p},${s2s},${cc},${lastSignal}`;
}).join('\n');
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `connectivity-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const getPercentage = (count: number) => {
    if (!connectivity || connectivity.totalStudents === 0) return 0;
    return Math.round((count / connectivity.totalStudents) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive engagement and connectivity insights</p>
          </div>
        </div>
        {staff?.role_type === 'admin' && connectivity && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Connectivity CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Meetings by Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="meetings" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Meeting Types Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={meetingTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {meetingTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">High Engagement Students</h2>
          {highEngagement.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
              <p className="font-medium">No student engagement data yet</p>
              <p className="text-sm text-center mt-1">Start logging meetings to track engagement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highEngagement.map((student, index) => (
                <div
                  key={student.email}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-700 font-semibold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {student.meetings} meetings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Low Engagement Students</h2>
          {lowEngagement.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-gray-500">
              <p className="font-medium">No student engagement data yet</p>
              <p className="text-sm text-center mt-1">Start logging meetings to track engagement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowEngagement.map((student, index) => (
                <div
                  key={student.email}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 text-yellow-700 font-semibold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                    {student.meetings} meetings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {connectivity && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Network className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Student Connectivity Index</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              SCI is a directional signal to support outreach—not an evaluation or prediction.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Average SCI Score</h3>
              <div>
                <p className="text-5xl font-bold text-blue-600">
                  {connectivity.averageScore.toFixed(1)}
                  <span className="text-2xl text-gray-500"> / 30</span>
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  Based on {connectivity.totalStudents} students in your village
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Connectivity Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Strong (22-30)</span>
                    <span className="text-sm font-bold text-gray-900">
                      {connectivity.strongCount} ({getPercentage(connectivity.strongCount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(connectivity.strongCount)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Partial (12-21)</span>
                    <span className="text-sm font-bold text-gray-900">
                      {connectivity.partialCount} ({getPercentage(connectivity.partialCount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(connectivity.partialCount)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Limited (0-11)</span>
                    <span className="text-sm font-bold text-gray-900">
                      {connectivity.limitedCount} ({getPercentage(connectivity.limitedCount)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getPercentage(connectivity.limitedCount)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Connectivity Trends (30-Day)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Improving</p>
                <p className="text-2xl font-bold text-green-600">
                  {connectivity.improvingCount}
                  <span className="text-sm text-gray-500 ml-2">({getPercentage(connectivity.improvingCount)}%)</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Gained 3+ points</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Stable</p>
                <p className="text-2xl font-bold text-blue-600">
                  {connectivity.stableCount}
                  <span className="text-sm text-gray-500 ml-2">({getPercentage(connectivity.stableCount)}%)</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Changed -2 to +2</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Declining</p>
                <p className="text-2xl font-bold text-red-600">
                  {connectivity.decliningCount}
                  <span className="text-sm text-gray-500 ml-2">({getPercentage(connectivity.decliningCount)}%)</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Lost 3+ points</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Unknown</p>
                <p className="text-2xl font-bold text-gray-600">
                  {connectivity.unknownCount}
                  <span className="text-sm text-gray-500 ml-2">({getPercentage(connectivity.unknownCount)}%)</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">No historical data</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Trends are calculated by comparing current scores with scores from 30 days ago. Students with improving trends may benefit from continued support, while declining trends may indicate a need for outreach.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
