import React from 'react';
import { X, Tag, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Student } from '../lib/supabase';

interface StudentProfileModalProps {
  student: Student & {
    sci?: {
      total_score: number;
      tier: string;
      trend: string;
      p2p_score: number;
      s2s_score: number;
      cc_score: number;
    };
    in_village?: boolean;
  };
  onClose: () => void;
  onInviteToVillage?: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onInviteToVillage,
}) => {
  const getConnectivityStatus = (tier: string) => {
    switch (tier) {
      case 'strong':
        return {
          text: 'Strong Connectivity',
          icon: <TrendingUp className="w-5 h-5 text-green-600" />,
          color: 'text-green-700 bg-green-50 border-green-300',
        };
      case 'partial':
        return {
          text: 'Moderate Connectivity',
          icon: <Minus className="w-5 h-5 text-yellow-600" />,
          color: 'text-yellow-700 bg-yellow-50 border-yellow-300',
        };
      case 'limited':
      default:
        return {
          text: 'Limited Connectivity',
          icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
          color: 'text-orange-700 bg-orange-50 border-orange-300',
        };
    }
  };

  const sciScore = student.sci?.total_score ?? 0;
  const sciPercentage = (sciScore / 30) * 100;
  const connectivityStatus = getConnectivityStatus(student.sci?.tier || 'limited');

  const getInitials = () => {
    const first = student.first_name?.[0] || student.full_name?.[0] || 'S';
    const last = student.last_name?.[0] || student.full_name?.[1] || 'T';
    return `${first}${last}`.toUpperCase();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-100"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4 border-4 border-gray-100">
                {getInitials()}
              </div>
            )}

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-lg text-gray-600 mb-1">{student.major}</p>
            {student.gpa && (
              <p className="text-base text-gray-500">GPA: {student.gpa.toFixed(1)}</p>
            )}
          </div>

          {student.interests && student.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Interests & Activities
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              SCI Score
            </h3>

            <div className="flex items-center justify-center mb-4">
              <div className="text-5xl font-bold text-gray-900">
                {sciScore}
                <span className="text-2xl text-gray-500 font-normal">/30</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sciPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${connectivityStatus.color}`}
              >
                {connectivityStatus.icon}
                <span>{connectivityStatus.text}</span>
              </div>
            </div>
          </div>

          {!student.in_village && onInviteToVillage && (
            <button
              onClick={onInviteToVillage}
              className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              Invite to Village
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
