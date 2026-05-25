import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { supabase, Staff, InteractionDomain } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { recalculateSCIForStudent } from '../lib/sciCalculations';

interface LogInteractionModalProps {
  studentId: string;
  onClose: () => void;
  onInteractionLogged: () => void;
}

const P2P_SUBTYPES = ['Study Group', 'Peer Mentoring', 'Social Event', 'Project Collaboration', 'Other'];
const S2S_SUBTYPES = ['Advising Session', 'Office Hours', 'One-on-One Meeting', 'Check-in', 'Career Counseling', 'Other'];
const CC_SUBTYPES = ['Club Meeting', 'Campus Event', 'Workshop', 'Volunteer Activity', 'Leadership Role', 'Other'];

export const LogInteractionModal: React.FC<LogInteractionModalProps> = ({
  studentId,
  onClose,
  onInteractionLogged,
}) => {
  const { staff } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [domain, setDomain] = useState<InteractionDomain>('P2P');
  const [subtype, setSubtype] = useState('');
  const [customSubtype, setCustomSubtype] = useState('');
  const [relatedKey, setRelatedKey] = useState('');
  const [notes, setNotes] = useState('');
  const [isMeaningful, setIsMeaningful] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  useEffect(() => {
    fetchStaff();
    setSubtypeForDomain(domain);
  }, []);

  useEffect(() => {
    setSubtypeForDomain(domain);
    setRelatedKey('');
  }, [domain]);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('university_id', staff?.university_id)
      .order('last_name', { ascending: true });

    if (data) {
      setAllStaff(data);
      if (domain === 'S2S') {
        setRelatedKey(staff?.id || '');
      }
    }
  };

  const setSubtypeForDomain = (selectedDomain: InteractionDomain) => {
    switch (selectedDomain) {
      case 'P2P':
        setSubtype(P2P_SUBTYPES[0]);
        break;
      case 'S2S':
        setSubtype(S2S_SUBTYPES[0]);
        setRelatedKey(staff?.id || '');
        break;
      case 'CC':
        setSubtype(CC_SUBTYPES[0]);
        break;
    }
    setCustomSubtype('');
  };

  const getSubtypesForDomain = () => {
    switch (domain) {
      case 'P2P':
        return P2P_SUBTYPES;
      case 'S2S':
        return S2S_SUBTYPES;
      case 'CC':
        return CC_SUBTYPES;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isMeaningful) {
      setError('Please confirm this was a meaningful contact moment before logging.');
      return;
    }

    if (!relatedKey.trim()) {
      setError('Please provide a connection identifier (peer email/name, staff member, or event/organization).');
      return;
    }

    setLoading(true);

    try {
      const finalSubtype = subtype === 'Other' && customSubtype ? customSubtype : subtype;

      const { error: insertError } = await supabase
        .from('interactions_mcm')
        .insert({
          student_id: studentId,
          staff_id: staff?.id,
          domain,
          subtype: finalSubtype,
          date: new Date(date).toISOString(),
          notes,
          is_positive: true,
          related_key: relatedKey.trim(),
        });

      if (insertError) throw insertError;

      await recalculateSCIForStudent(studentId);

      onInteractionLogged();
    } catch (err) {
      console.error('Error logging interaction:', err);
      setError('Failed to log interaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Log Meaningful Interaction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as InteractionDomain)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="P2P">Peer-to-Peer (P2P)</option>
              <option value="S2S">Staff-to-Student (S2S)</option>
              <option value="CC">Co-Curricular (CC)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {domain === 'P2P' && 'Student interactions with peers'}
              {domain === 'S2S' && 'Student interactions with staff/faculty'}
              {domain === 'CC' && 'Student participation in campus activities'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={subtype}
              onChange={(e) => setSubtype(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getSubtypesForDomain().map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {subtype === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Type
              </label>
              <input
                type="text"
                value={customSubtype}
                onChange={(e) => setCustomSubtype(e.target.value)}
                placeholder="Describe the interaction type..."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {domain === 'P2P' && 'Peer Identifier'}
              {domain === 'S2S' && 'Staff Member'}
              {domain === 'CC' && 'Event/Organization'}
            </label>
            {domain === 'S2S' ? (
              <select
                value={relatedKey}
                onChange={(e) => setRelatedKey(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select staff member...</option>
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={relatedKey}
                onChange={(e) => setRelatedKey(e.target.value)}
                placeholder={
                  domain === 'P2P'
                    ? 'Peer name or email...'
                    : 'Event name or organization...'
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              This helps track established connections (3+ interactions with the same {domain === 'P2P' ? 'peer' : domain === 'S2S' ? 'staff member' : 'event/org'})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Describe the interaction and its significance..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isMeaningful}
                onChange={(e) => setIsMeaningful(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  This was a meaningful contact moment
                </p>
                <p className="text-blue-700">
                  Not a mass email, automated message, or passive attendance log. This represents genuine connection or engagement.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging...' : 'Log Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
