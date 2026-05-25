import React, { useState, useEffect } from 'react';
import { X, Mail, Search, UserPlus, Check, Edit2 } from 'lucide-react';
import { supabase, Student } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InviteStudentModalProps {
  onClose: () => void;
  onInviteSent: (studentName: string) => void;
  preSelectedStudent?: Student | null;
}

export const InviteStudentModal: React.FC<InviteStudentModalProps> = ({
  onClose,
  onInviteSent,
  preSelectedStudent,
}) => {
  const { staff } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(preSelectedStudent || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const [message, setMessage] = useState('');
useEffect(() => {
  const fetchAvailableStudents = async () => {
    if (!staff?.id || !staff?.university_id) return;

    try {
      const { data: existingMembers } = await supabase
        .from('village_members')
        .select('student_id')
        .eq('staff_id', staff.id);

      const { data: pendingInvites } = await supabase
        .from('village_invitations')
        .select('student_id')
        .eq('staff_id', staff.id)
        .eq('status', 'pending')

      const excludedIds = [
        ...(existingMembers?.map(m => m.student_id) || []),
        ...(pendingInvites?.map(i => i.student_id) || []),
      ];

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('university_id', staff.university_id)
        .order('last_name', { ascending: true });

      const available = studentsData?.filter(s => !excludedIds.includes(s.id)) || [];
      setAvailableStudents(available);
      setFilteredStudents(available);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    }
  };

  fetchAvailableStudents();
}, [staff]);

useEffect(() => {
  if (!searchTerm.trim()) {
    setFilteredStudents(availableStudents);
    return;
  }

  const searchLower = searchTerm.toLowerCase();
  const filtered = availableStudents.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.major?.toLowerCase().includes(searchLower) ||
      student.year?.toLowerCase().includes(searchLower)
  );
  setFilteredStudents(filtered);
}, [searchTerm, availableStudents]);


  const handleInvite = async () => {
    if (!selectedStudent || !staff?.id) return;

    setError('');
    setLoading(true);

    try {
      const { error: inviteError } = await supabase
        .from('village_invitations')
   .insert({
  staff_id: staff.id,
  student_id: selectedStudent.id,
  invited_by: 'staff',
  status: 'pending',
  message: message || null,
});

      if (inviteError) throw inviteError;

      const studentName = `${selectedStudent.first_name} ${selectedStudent.last_name}`;
      onInviteSent(studentName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      console.error('Error sending invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Invite Student to Village</h2>
            <p className="text-gray-600 text-sm mt-1">Select a student to send an invitation</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {selectedStudent ? (
            <>
              {/* Selected Student Display */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Student
                  </label>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Change Selection
                  </button>
                </div>
                <div className="p-4 border-2 border-green-500 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-700 font-semibold w-12 h-12 rounded-full flex items-center justify-center relative">
                      {selectedStudent.first_name[0]}
                      {selectedStudent.last_name[0]}
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700 font-medium">{selectedStudent.major}</p>
                      <p className="text-xs text-gray-500">{selectedStudent.year}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a short note to the student..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/500 characters
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Student List */}
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {availableStudents.length === 0 ? (
                    <>
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="font-medium">No students available to invite</p>
                      <p className="text-sm mt-1">All students are already in your village or have pending invitations</p>
                    </>
                  ) : (
                    <p>No students match your search</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="w-full text-left p-4 border-2 rounded-lg transition-all border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-700 font-semibold w-10 h-10 rounded-full flex items-center justify-center">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{student.major}</p>
                          <p className="text-xs text-gray-500">{student.year}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleInvite}
              disabled={loading || !selectedStudent}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
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
        </div>
      </div>
    </div>
  );
};
