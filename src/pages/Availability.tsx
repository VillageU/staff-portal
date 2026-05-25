import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface CalendarSync {
  id: string;
  calendar_provider: 'google' | 'outlook' | 'manual';
  sync_enabled: boolean;
  last_synced_at: string | null;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Availability: React.FC = () => {
  const { staff } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [calendarSync, setCalendarSync] = useState<CalendarSync | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [newSlot, setNewSlot] = useState({ start_time: '09:00', end_time: '17:00' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!staff?.id) return;

    try {
      const { data: availabilityData } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staff.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      const { data: syncData } = await supabase
        .from('staff_calendar_sync')
        .select('*')
        .eq('staff_id', staff.id)
        .maybeSingle();

      if (availabilityData) setAvailability(availabilityData);
      if (syncData) setCalendarSync(syncData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async () => {
    if (!staff?.id) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('staff_availability')
        .insert({
          staff_id: staff.id,
          day_of_week: selectedDay,
          start_time: newSlot.start_time,
          end_time: newSlot.end_time,
          is_available: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setAvailability([...availability, data]);
      setNewSlot({ start_time: '09:00', end_time: '17:00' });
    } catch (error) {
      console.error('Error adding slot:', error);
      alert('Failed to add availability slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('staff_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAvailability(availability.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete availability slot');
    }
  };

  const handleSyncCalendar = async (provider: 'google' | 'outlook' | 'manual') => {
    if (!staff?.id) return;

    if (provider !== 'manual') {
      alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} calendar sync would open OAuth flow. This is a demo, so please use manual mode.`);
      return;
    }

    setSaving(true);
    try {
      const syncData = {
        staff_id: staff.id,
        calendar_provider: provider,
        sync_enabled: true,
        last_synced_at: new Date().toISOString(),
      };

      if (calendarSync) {
        const { data, error } = await supabase
          .from('staff_calendar_sync')
          .update(syncData)
          .eq('staff_id', staff.id)
          .select()
          .single();

        if (error) throw error;
        if (data) setCalendarSync(data);
      } else {
        const { data, error } = await supabase
          .from('staff_calendar_sync')
          .insert(syncData)
          .select()
          .single();

        if (error) throw error;
        if (data) setCalendarSync(data);
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert('Failed to sync calendar');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableSync = async () => {
    if (!staff?.id || !calendarSync) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('staff_calendar_sync')
        .update({ sync_enabled: false })
        .eq('staff_id', staff.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setCalendarSync(data);
    } catch (error) {
      console.error('Error disabling sync:', error);
      alert('Failed to disable sync');
    } finally {
      setSaving(false);
    }
  };

  const groupedAvailability = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability.filter(slot => slot.day_of_week === index),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar & Availability</h1>
        <p className="text-gray-600 mt-2">Manage your availability and sync with external calendars</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <RefreshCw className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Calendar Sync</h2>
            <p className="text-sm text-gray-600">Connect your external calendar to automatically update availability</p>
          </div>
        </div>

        {calendarSync?.sync_enabled ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">
                    Synced with {calendarSync.calendar_provider.charAt(0).toUpperCase() + calendarSync.calendar_provider.slice(1)}
                  </p>
                  {calendarSync.last_synced_at && (
                    <p className="text-sm text-green-700 mt-1">
                      Last synced: {new Date(calendarSync.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisableSync}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Disable Sync
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleSyncCalendar('google')}
              disabled={saving}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Sync Google Calendar</span>
            </button>
            <button
              onClick={() => handleSyncCalendar('outlook')}
              disabled={saving}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Sync Outlook Calendar</span>
            </button>
            <button
              onClick={() => handleSyncCalendar('manual')}
              disabled={saving}
              className="flex items-center justify-center space-x-2 p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50"
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">Manual Setup</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Availability Schedule</h2>
              <p className="text-sm text-gray-600">Set your weekly availability for student meetings</p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Add New Availability Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={newSlot.start_time}
              onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="time"
              value={newSlot.end_time}
              onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddSlot}
              disabled={saving}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slot</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {groupedAvailability.map(({ day, dayIndex, slots }) => (
            <div key={dayIndex} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">{day}</h3>
              {slots.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No availability set</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
