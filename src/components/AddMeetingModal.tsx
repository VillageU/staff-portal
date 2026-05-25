import React, { useState } from 'react';
import { X, Calendar, Users, Video, MapPin, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Student } from '../lib/supabase';

interface AddMeetingModalProps {
  students: Student[];
  onClose: () => void;
  onMeetingAdded: () => void;
}

export const AddMeetingModal: React.FC<AddMeetingModalProps> = ({
  students,
  onClose,
  onMeetingAdded,
}) => {
  const { staff } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
    meeting_date: '',
    meeting_time: '',
    is_virtual: false,
    meeting_reason: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!staff) {
        throw new Error('No staff user found');
      }

      if (!formData.student_id) {
        throw new Error('Please select a student');
      }

      const meetingDateTime = `${formData.meeting_date}T${formData.meeting_time}:00`;

      const { error: insertError } = await supabase.from('meetings').insert({
        student_id: formData.student_id,
        staff_id: staff.id,
        meeting_date: meetingDateTime,
        meeting_type: 'Check-in',
        is_virtual: formData.is_virtual,
        meeting_reason: formData.meeting_reason,
        message: formData.message,
        notes: '',
      });

      if (insertError) throw insertError;

      onMeetingAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
      console.error('Error scheduling meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const meetingReasons = [
    'Academic Advising',
    'Career Counseling',
    'Personal Issue',
    'Course Selection',
    'Scholarship Discussion',
    'General Check-in',
    'Other',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Meeting</h2>
            <p className="text-gray-600 text-sm mt-1">Create a new meeting with a student</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="student" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 mr-2" />
              Select Student
            </label>
            <select
              id="student"
              value={formData.student_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, student_id: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.major}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Meeting Date
              </label>
              <input
                id="date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, meeting_date: e.target.value }))
                }
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="time" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                Meeting Time
              </label>
              <input
                id="time"
                type="time"
                value={formData.meeting_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, meeting_time: e.target.value }))
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              Meeting Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_virtual: false }))}
                className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-lg transition-all ${
                  !formData.is_virtual
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span className="font-medium">In-Person</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_virtual: true }))}
                className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-lg transition-all ${
                  formData.is_virtual
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Video className="w-5 h-5" />
                <span className="font-medium">Virtual</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              Meeting Reason
            </label>
            <select
              id="reason"
              value={formData.meeting_reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, meeting_reason: e.target.value }))
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {meetingReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="message" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              Personalized Message
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              rows={4}
              placeholder="Add a personal message or notes for the student..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
