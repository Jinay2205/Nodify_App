import { X, CalendarDays, Clock, ArrowRight, Loader2 } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSyncing: boolean;
  contactName: string;
  date: string | null;
  bookingTime: { hour: string; minute: string; period: string; duration: string };
  setBookingTime: (time: any) => void;
}

export function BookingModal({
  isOpen, onClose, onConfirm, isSyncing, contactName, date, bookingTime, setBookingTime
}: BookingModalProps) {
  
  if (!isOpen) return null;

  // Formatting helpers for the summary text
  const formattedDate = date ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '';
  
  // Helper to update specific fields in our time state
  const updateTime = (field: string, value: string) => {
    setBookingTime((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content Box */}
      <div className="relative bg-[#18181B] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-[#18181B]">
          <div>
            <h3 className="text-lg font-medium text-white">Schedule Reconnect</h3>
            <p className="text-xs text-zinc-400 mt-1">Reserve time on your Google Calendar.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Time Selection Row */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Start Time
            </label>
            <div className="flex gap-2">
              {/* Hour */}
              <select 
                value={bookingTime.hour} onChange={(e) => updateTime('hour', e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] appearance-none text-center cursor-pointer"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={String(i+1).padStart(2, '0')}>{i + 1}</option>
                ))}
              </select>
              <span className="text-zinc-500 flex items-center">:</span>
              
              {/* Minute */}
              <select 
                value={bookingTime.minute} onChange={(e) => updateTime('minute', e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] appearance-none text-center cursor-pointer"
              >
                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              
              {/* AM/PM */}
              <select 
                value={bookingTime.period} onChange={(e) => updateTime('period', e.target.value)}
                className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-[#4ADE80] font-medium outline-none focus:border-[#4ADE80] focus:ring-1 focus:ring-[#4ADE80] appearance-none text-center cursor-pointer"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Duration</label>
            <div className="grid grid-cols-4 gap-2">
              {['15', '30', '45', '60'].map((mins) => (
                <button
                  key={mins}
                  onClick={() => updateTime('duration', mins)}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                    bookingTime.duration === mins 
                      ? 'bg-[#4ADE80]/10 border-[#4ADE80]/50 text-[#4ADE80]' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-[#4ADE80]/5 border border-[#4ADE80]/20 rounded-xl p-4 flex items-start gap-3">
            <CalendarDays className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              Booking a <strong className="text-white">{bookingTime.duration}-minute</strong> block with <strong className="text-white">{contactName}</strong> on <strong className="text-white">{formattedDate}</strong> at <strong className="text-[#4ADE80]">{bookingTime.hour}:{bookingTime.minute} {bookingTime.period}</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-[#18181B] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-black bg-[#4ADE80] hover:bg-[#22C55E] transition-colors disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>Confirm & Sync <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}