import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Student, StudentSCI, InteractionWithStaff, EstablishedConnection, CoCurricularConsistency } from '../lib/supabase';
import { ArrowLeft, Plus, Users, UserCheck, Calendar } from 'lucide-react';
import { LogInteractionModal } from '../components/LogInteractionModal';

export const StudentConnectivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [sciData, setSciData] = useState<StudentSCI | null>(null);
  const [interactions, setInteractions] = useState<InteractionWithStaff[]>([]);
  const [p2pConnections, setP2pConnections] = useState<EstablishedConnection[]>([]);
  const [s2sConnections, setS2sConnections] = useState<EstablishedConnection[]>([]);
  const [ccData, setCcData] = useState<CoCurricularConsistency | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const { data: sciInfo } = await supabase
        .from('student_sci')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();

      const { data: interactionsData } = await supabase
        .from('interactions_mcm')
        .select('*, staff(*)')
        .eq('student_id', id)
        .order('date', { ascending: false });

      const { data: p2pConns } = await supabase
        .from('established_connections')
        .select('*')
        .eq('student_id', id)
        .eq('domain', 'P2P')
        .eq('is_established', true);

      const { data: s2sConns } = await supabase
        .from('established_connections')
        .select('*')
        .eq('student_id', id)
        .eq('domain', 'S2S')
        .eq('is_established', true);

      const { data: ccInfo } = await supabase
        .from('co_curricular_consistency')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();

      setStudent(studentData);
      setSciData(sciInfo);
      setInteractions((interactionsData as InteractionWithStaff[]) || []);
      setP2pConnections(p2pConns || []);
      setS2sConnections(s2sConns || []);
      setCcData(ccInfo);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading connectivity details...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Student not found</p>
        <Link to="/connectivity" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Connectivity List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/connectivity"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Connectivity List
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-700 font-bold w-16 h-16 rounded-full flex items-center justify-center text-2xl">
              {student.first_name[0]}
              {student.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.first_name} {student.last_name}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getTierBadgeColor(sciData?.tier || 'limited')}`}>
                  {sciData?.tier || 'Limited'} Connectivity
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {sciData?.total_score ?? 0}
                  <span className="text-sm font-normal text-gray-500"> / 30</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Interaction
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-4 italic">
          SCI is a directional signal to support outreach—not an evaluation or prediction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Peer-to-Peer</h3>
              <p className="text-2xl font-bold text-blue-600">{sciData?.p2p_score ?? 0} / 10</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">{p2pConnections.length}</span> established peer connections
            </p>
            <p className="text-xs text-gray-500">
              Based on 3+ meaningful interactions with each peer. Scoring: 0 peers = 0pts, 1-2 = 4pts, 3-4 = 7pts, 5+ = 10pts.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Staff-to-Student</h3>
              <p className="text-2xl font-bold text-green-600">{sciData?.s2s_score ?? 0} / 10</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">{s2sConnections.length}</span> established staff anchors
            </p>
            <p className="text-xs text-gray-500">
              Based on 3+ meaningful interactions with each staff member. Scoring: 0 staff = 0pts, 1 = 6pts, 2+ = 10pts.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Co-Curricular</h3>
              <p className="text-2xl font-bold text-purple-600">{sciData?.cc_score ?? 0} / 10</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <span className="font-medium">{ccData?.meets_threshold ? 'Meets' : 'Does not meet'}</span> consistency threshold
            </p>
            <p className="text-xs text-gray-500">
              {ccData?.threshold_basis || 'Based on multi-timepoint (2+ months) or multi-category (2+ types) participation. All or nothing: 10pts or 0pts.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Interaction Timeline</h2>

        {interactions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No interactions logged yet</p>
            <button
              onClick={() => setShowLogModal(true)}
              className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              Log your first interaction
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      interaction.domain === 'P2P' ? 'bg-blue-100 text-blue-700' :
                      interaction.domain === 'S2S' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {interaction.domain}
                    </span>
                    <h3 className="font-semibold text-gray-900">{interaction.subtype}</h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(interaction.date)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{interaction.notes}</p>
                <p className="text-xs text-gray-500">
                  Logged by {interaction.staff.first_name} {interaction.staff.last_name}
                  {interaction.related_key && ` • Connection: ${interaction.related_key}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showLogModal && (
        <LogInteractionModal
          studentId={id!}
          onClose={() => setShowLogModal(false)}
          onInteractionLogged={() => {
            setShowLogModal(false);
            fetchStudentData();
          }}
        />
      )}
    </div>
  );
};
