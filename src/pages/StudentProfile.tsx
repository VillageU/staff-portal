import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Student, MeetingWithStaff, StudentStaffMetadata, Staff } from '../lib/supabase';
import { Mail, GraduationCap, Calendar, Plus, ArrowLeft, Tag, FileText, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState<string>('');
  const [staffMetadata, setStaffMetadata] = useState<StudentStaffMetadata | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<Staff | null>(null);

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

      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*, staff(*)')
        .eq('student_id', id)
        .order('meeting_date', { ascending: false });

      const { data: metadataData } = await supabase
        .from('student_staff_metadata')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();

      setStudent(studentData);
      setMeetings((meetingsData as MeetingWithStaff[]) || []);

      if (metadataData) {
        setStaffMetadata(metadataData);
        setStaffNotes(metadataData.notes || '');

        if (metadataData.last_updated_by_staff_id) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('*')
            .eq('id', metadataData.last_updated_by_staff_id)
            .maybeSingle();
          setLastUpdatedBy(staffData);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleSaveNotes = async () => {
    if (!id || !user) return;

    setNotesLoading(true);
    try {
      if (staffMetadata) {
        const { error } = await supabase
          .from('student_staff_metadata')
          .update({
            notes: staffNotes,
            last_updated_by_staff_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', staffMetadata.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_staff_metadata')
          .insert({
            student_id: id,
            notes: staffNotes,
            last_updated_by_staff_id: user.id,
          });

        if (error) throw error;
      }

      showToast('Notes saved successfully', 'success');
      await fetchStudentData();
    } catch (error) {
      console.error('Error saving notes:', error);
      showToast('Failed to save notes', 'error');
    } finally {
      setNotesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading student profile...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Student not found</p>
        <Link to="/students" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/students"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Students
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
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {student.email}
                </div>
                <div className="flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {student.major}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {student.year}
                </div>
              </div>

              {student.tags && student.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Student Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {student.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link
            to={`/students/${student.id}/add-meeting`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting Note
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Staff Notes</h2>
          </div>
          <button
            onClick={handleSaveNotes}
            disabled={notesLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {notesLoading ? 'Saving...' : 'Save Notes'}
          </button>
        </div>

        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          placeholder="Add private notes about this student... These notes are only visible to staff members."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={6}
        />

        {staffMetadata && (
          <div className="mt-3 text-sm text-gray-600">
            Last updated: {formatDate(staffMetadata.updated_at)}
            {lastUpdatedBy && (
              <span>
                {' '}
                by {lastUpdatedBy.first_name} {lastUpdatedBy.last_name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Meeting History</h2>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No meetings recorded yet</p>
            <Link
              to={`/students/${student.id}/add-meeting`}
              className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
            >
              Add your first meeting note
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{meeting.meeting_type}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(meeting.meeting_date)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    with {meeting.staff.first_name} {meeting.staff.last_name}
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{meeting.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
