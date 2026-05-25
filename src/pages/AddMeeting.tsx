import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, Student } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

const MEETING_TYPES = [
  'Academic Advising',
  'Career Counseling',
  'Personal Check-in',
  'Mental Health Support',
  'General Consultation',
];

export const AddMeeting: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { staff } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    meeting_date: '',
    meeting_type: MEETING_TYPES[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData((prev) => ({
      ...prev,
      meeting_date: now.toISOString().slice(0, 16),
    }));
  }, [id]);

  const fetchStudent = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      setStudent(data);
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!staff || !student) {
        throw new Error('Missing required data');
      }

      const { error: insertError } = await supabase.from('meetings').insert({
        student_id: student.id,
        staff_id: staff.id,
        meeting_date: new Date(formData.meeting_date).toISOString(),
        meeting_type: formData.meeting_type,
        notes: formData.notes,
      });

      if (insertError) throw insertError;

      navigate(`/students/${student.id}`);
    } catch (err) {
      setError('Failed to save meeting note. Please try again.');
      console.error('Error saving meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to={`/students/${student.id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Student Profile
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Meeting Note</h1>
        <p className="text-gray-600 mb-6">
          Recording meeting for {student.first_name} {student.last_name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="meeting_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <input
              id="meeting_date"
              type="datetime-local"
              value={formData.meeting_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meeting_date: e.target.value }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="meeting_type" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type
            </label>
            <select
              id="meeting_type"
              value={formData.meeting_type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meeting_type: e.target.value }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MEETING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              required
              rows={8}
              placeholder="Enter detailed notes about the meeting discussion, outcomes, and any follow-up actions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Meeting Note'}
            </button>
            <Link
              to={`/students/${student.id}`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
