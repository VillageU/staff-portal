import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Student, StudentWithSCI } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Search, User, Plus, Tag, Mail, Info, TrendingUp, TrendingDown, Minus, Network, Calendar, Clock } from 'lucide-react';
import { AddMeetingModal } from '../components/AddMeetingModal';
import { InviteStudentModal } from '../components/InviteStudentModal';
import { StudentProfileModal } from '../components/StudentProfileModal';

interface StudentWithBothData extends Student {
  last_meeting_date?: string;
  in_village?: boolean;
  has_pending_invitation?: boolean;
  sci?: {
    total_score: number;
    tier: string;
    trend: string;
    p2p_score: number;
    s2s_score: number;
    cc_score: number;
    last_meaningful_signal_date: string | null;
  };
}

type ViewMode = 'meetings' | 'connectivity';

export const StudentList: React.FC = () => {
  const { staff } = useAuth();
  const { showSuccess } = useToast();
  const [students, setStudents] = useState<StudentWithBothData[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithBothData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('connectivity');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showOnlyVillage, setShowOnlyVillage] = useState(false);
  const [selectedStudentForInvite, setSelectedStudentForInvite] = useState<Student | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentWithBothData | null>(null);

  useEffect(() => {
    fetchStudents();
  }, [showOnlyVillage]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, tierFilter, trendFilter, students, viewMode]);

  const fetchStudents = async () => {
    if (!staff?.id || !staff?.university_id) return;

    try {
      // First, get all village members for this staff
      const { data: villageMembers } = await supabase
        .from('village_members')
        .select('student_id')
        .eq('staff_id', staff.id);

      const villageStudentIds = villageMembers?.map(vm => vm.student_id) || [];

      // Get pending invitations sent by this staff member
      const { data: pendingInvitations } = await supabase
        .from('village_invitations')
        .select('student_id')
        .eq('staff_id', staff.id)
        .eq('invited_by', 'staff')
        .eq('status', 'pending');

      const pendingInvitationStudentIds = pendingInvitations?.map(inv => inv.student_id) || [];

      // Fetch students based on toggle state
      let studentsQuery = supabase
        .from('students')
        .select('*')
        .eq('university_id', staff.university_id);

      if (showOnlyVillage) {
        // Only show village students
        if (villageStudentIds.length === 0) {
          setStudents([]);
          setFilteredStudents([]);
          setLoading(false);
          return;
        }
        studentsQuery = studentsQuery.in('id', villageStudentIds);
      }

      studentsQuery = studentsQuery.order('last_name', { ascending: true });

      const { data: studentsData, error: studentsError } = await studentsQuery;

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      if (studentsData) {
        const studentsWithAllData = await Promise.all(
          studentsData.map(async (student) => {
            const { data: meetings } = await supabase
              .from('meetings')
              .select('meeting_date')
              .eq('student_id', student.id)
              .eq('staff_id', staff.id)
              .order('meeting_date', { ascending: false })
              .limit(1);

            const { data: sciData } = await supabase
              .from('student_sci')
              .select('*')
              .eq('student_id', student.id)
              .maybeSingle();

            return {
              ...student,
              last_meeting_date: meetings?.[0]?.meeting_date,
              in_village: villageStudentIds.includes(student.id),
              has_pending_invitation: pendingInvitationStudentIds.includes(student.id),
              sci: sciData || undefined,
            };
          })
        );

        setStudents(studentsWithAllData);
        setFilteredStudents(studentsWithAllData);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...students];

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (student) =>
          student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.major?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.year?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (viewMode === 'connectivity') {
      if (tierFilter !== 'all') {
        filtered = filtered.filter((student) => student.sci?.tier === tierFilter);
      }

      if (trendFilter !== 'all') {
        filtered = filtered.filter((student) => student.sci?.trend === trendFilter);
      }

      filtered.sort((a, b) => {
        const aScore = a.sci?.total_score ?? 0;
        const bScore = b.sci?.total_score ?? 0;
        if (aScore !== bScore) return aScore - bScore;

        const aDate = a.sci?.last_meaningful_signal_date || '';
        const bDate = b.sci?.last_meaningful_signal_date || '';
        return aDate.localeCompare(bDate);
      });
    }

    setFilteredStudents(filtered);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return viewMode === 'meetings' ? 'No meetings yet' : 'No interactions yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'limited':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-blue-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'meetings' ? 'Manage and view all student records' : 'Student Connectivity Index insights'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedStudentForInvite(null);
              setShowInviteModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Mail className="w-4 h-4 mr-2" />
            Invite Student
          </button>
          <button
            onClick={() => setShowMeetingModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('connectivity')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'connectivity'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Connectivity View</span>
          </button>
          <button
            onClick={() => setViewMode('meetings')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              viewMode === 'meetings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Meetings View</span>
          </button>
        </div>
      </div>

      {viewMode === 'connectivity' && (
        <>
          {showExplainer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Understanding Student Connectivity Index</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  <strong>SCI Score (0-30):</strong> A composite measure of three connectivity domains:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Peer-to-Peer (0-10 pts):</strong> Established peer connections (3+ meaningful interactions)</li>
                  <li><strong>Staff-to-Student (0-10 pts):</strong> Established staff anchors (3+ meaningful interactions)</li>
                  <li><strong>Co-Curricular (0-10 pts):</strong> Consistent participation across time or categories</li>
                </ul>
                <p>
                  <strong>Tiers:</strong> Strong (22-30), Partial (12-21), Limited (0-11)
                </p>
                <p>
                  <strong>Trend:</strong> Based on 30-day comparison (improving: +3, declining: -3, stable: -2 to +2)
                </p>
              </div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800">
                SCI is a directional signal to support outreach—not an evaluation or prediction.
              </p>
              <button
                onClick={() => setShowExplainer(!showExplainer)}
                className="text-blue-600 hover:text-blue-700 transition-colors"
                title="What is SCI?"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, major, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {viewMode === 'connectivity' && (
            <>
              <div className="w-48">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Tiers</option>
                  <option value="strong">Strong</option>
                  <option value="partial">Partial</option>
                  <option value="limited">Limited</option>
                </select>
              </div>
              
              <div className="w-48">
                <select
                  value={trendFilter}
                  onChange={(e) => setTrendFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Trends</option>
                  <option value="improving">Improving</option>
                  <option value="stable">Stable</option>
                  <option value="declining">Declining</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white whitespace-nowrap">
            <span className="text-sm font-medium text-gray-700">My Village</span>
            <button
              onClick={() => setShowOnlyVillage(!showOnlyVillage)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                showOnlyVillage ? 'bg-green-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={showOnlyVillage}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showOnlyVillage ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Major
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                {viewMode === 'meetings' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Meeting
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SCI Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'connectivity' ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {showOnlyVillage ? (
                        <>
                          <p className="font-medium">No students in your village yet</p>
                          <p className="text-sm mt-1">Switch to "All Students" to invite students to your village</p>
                        </>
                      ) : (
                        <p>No students found at this university</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-700 font-semibold w-10 h-10 rounded-full flex items-center justify-center">
                          {student.first_name?.[0] || student.full_name?.[0] || 'S'}
                          {student.last_name?.[0] || student.full_name?.[1] || 'S'}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForProfile(student);
                                setShowProfileModal(true);
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
                            >
                              {student.first_name || student.full_name} {student.last_name}
                            </button>
                            {!showOnlyVillage && student.in_village && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                In Village
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.major}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.year}</div>
                    </td>
                    {viewMode === 'meetings' ? (
                      <>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {student.tags && student.tags.length > 0 ? (
                              student.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">No tags</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(student.last_meeting_date)}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.gpa ? student.gpa.toFixed(1) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">
                            {student.sci?.total_score ?? 0}
                            <span className="text-sm font-normal text-gray-500"> / 30</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getTierBadgeColor(student.sci?.tier || 'limited')}`}>
                            {student.sci?.tier || 'Limited'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(student.sci?.trend || 'unknown')}
                            <span className="text-sm text-gray-700 capitalize">
                              {student.sci?.trend || 'Unknown'}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {student.in_village ? (
                          <Link
                            to={viewMode === 'meetings' ? `/students/${student.id}` : `/students/${student.id}/connectivity`}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            <User className="w-4 h-4 mr-1" />
                            View {viewMode === 'meetings' ? 'Profile' : 'Details'}
                          </Link>
                        ) : student.has_pending_invitation ? (
                          <button
                            disabled
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-amber-700 bg-amber-100 cursor-not-allowed"
                            title="Invitation sent - waiting for student response"
                          >   
                            <Clock className="w-4 h-4 mr-1" />
                            Pending Approval
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStudentForInvite(student);
                              setShowInviteModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Invite to Village
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMeetingModal && (
        <AddMeetingModal
          students={students}
          onClose={() => setShowMeetingModal(false)}
          onMeetingAdded={() => {
            setShowMeetingModal(false);
            fetchStudents();
          }}
        />
      )}

      {showInviteModal && (
        <InviteStudentModal
          onClose={() => {
            setShowInviteModal(false);
            setSelectedStudentForInvite(null);
          }}
          onInviteSent={(studentName: string) => {
            setShowInviteModal(false);
            setSelectedStudentForInvite(null);
            fetchStudents();
            showSuccess(
              'Invitation Sent Successfully',
              `We've sent an invitation to ${studentName}. They'll be notified and can accept from their student portal.`
            );
          }}
          preSelectedStudent={selectedStudentForInvite}
        />
      )}

      {showProfileModal && selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedStudentForProfile(null);
          }}
          onInviteToVillage={() => {
            setShowProfileModal(false);
            setSelectedStudentForInvite(selectedStudentForProfile);
            setSelectedStudentForProfile(null);
            setShowInviteModal(true);
          }}
        />
      )}
    </div>
  );
};