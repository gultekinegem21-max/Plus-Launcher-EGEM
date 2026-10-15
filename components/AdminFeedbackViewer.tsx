import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  Send,
  X,
  Filter,
  Check
} from 'lucide-react';
import { 
  UserFeedback, 
  FeedbackCategory, 
  FeedbackStatus, 
  subscribeToFeedbacks, 
  submitFeedback, 
  updateFeedbackStatus, 
  deleteFeedback, 
  clearAllFeedbacks,
  seedSampleFeedbacks 
} from '../services/feedbackService';

interface AdminFeedbackViewerProps {
  currentUser?: string | null;
  onClose?: () => void;
}

export const AdminFeedbackViewer: React.FC<AdminFeedbackViewerProps> = ({ currentUser }) => {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'feature' | 'bug' | 'resolved'>('all');
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [newText, setNewText] = useState('');
  const [newName, setNewName] = useState(currentUser || '');
  const [newCategory, setNewCategory] = useState<FeedbackCategory>('feature');
  const [newRating, setNewRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToFeedbacks((items) => {
      setFeedbacks(items);
    });
    return () => unsub();
  }, []);

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        user: newName.trim() || currentUser || "Anonymous",
        text: newText.trim(),
        category: newCategory,
        rating: newRating,
      });
      setNewText('');
      setIsAddingFeedback(false);
      setSuccessMessage('Feedback saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (item: UserFeedback) => {
    const nextStatus: Record<FeedbackStatus, FeedbackStatus> = {
      'new': 'reviewed',
      'reviewed': 'resolved',
      'resolved': 'new'
    };
    await updateFeedbackStatus(item.id, nextStatus[item.status]);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this feedback item?")) {
      await deleteFeedback(id);
    }
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete all feedback records?")) {
      await clearAllFeedbacks();
    }
  };

  const handleSeed = async () => {
    await seedSampleFeedbacks();
  };

  // Filter feedbacks based on active tab
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'new') return item.status === 'new';
    if (activeTab === 'resolved') return item.status === 'resolved';
    if (activeTab === 'bug') return item.category === 'bug';
    if (activeTab === 'feature') return item.category === 'feature';
    return true;
  });

  const newCount = feedbacks.filter(f => f.status === 'new').length;
  const avgRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const categoryBadge = (cat: FeedbackCategory) => {
    switch (cat) {
      case 'bug':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Bug</span>;
      case 'feature':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Feature</span>;
      case 'praise':
        return <span className="bg-pink-500/20 text-pink-400 border border-pink-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Praise</span>;
      default:
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">General</span>;
    }
  };

  const statusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'new':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">● New</span>;
      case 'reviewed':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">In Review</span>;
      case 'resolved':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Check className="w-2.5 h-2.5" /> Resolved</span>;
    }
  };

  return (
    <div className="space-y-3 bg-black/40 border border-amber-500/30 rounded-xl p-3 animate-in fade-in duration-200">
      {/* Header & Stats */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide">
              User Feedback Inbox
            </h4>
            <p className="text-[9px] text-gray-400 flex items-center gap-2">
              <span>Total: <strong className="text-white">{feedbacks.length}</strong></span>
              <span>•</span>
              <span>New: <strong className="text-amber-400">{newCount}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                Rating: <strong className="text-amber-300">{avgRating}</strong>
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAddingFeedback(!isAddingFeedback)}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
            title="Create feedback or test message"
          >
            {isAddingFeedback ? <X className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
            <span>{isAddingFeedback ? "Cancel" : "Add Test"}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-[10px] flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form to submit feedback directly from Admin (e.g. testing or user proxy) */}
      {isAddingFeedback && (
        <form onSubmit={handleCreateFeedback} className="bg-gray-800/60 border border-amber-500/30 rounded-lg p-2.5 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-300 uppercase">
            <span>Submit Feedback (Live Test)</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star className={`w-3.5 h-3.5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="User Name (e.g. John Doe)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-black/50 border border-gray-700 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as FeedbackCategory)}
              className="bg-black/50 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="feature">💡 Feature Request</option>
              <option value="bug">🐛 Bug Report</option>
              <option value="general">💬 General Feedback</option>
              <option value="praise">❤️ Praise</option>
            </select>
          </div>

          <textarea
            placeholder="Write user feedback here..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={2}
            className="w-full bg-black/50 border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingFeedback(false)}
              className="px-2.5 py-1 text-[10px] text-gray-400 hover:text-white rounded transition-colors uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newText.trim() || isSubmitting}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded flex items-center gap-1 transition-colors"
            >
              <Send className="w-2.5 h-2.5" />
              <span>{isSubmitting ? "Saving..." : "Submit Feedback"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[9px] font-bold uppercase tracking-wider [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-1 rounded transition-colors ${activeTab === 'all' ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            All ({feedbacks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-2 py-1 rounded transition-colors ${activeTab === 'new' ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            New ({newCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feature')}
            className={`px-2 py-1 rounded transition-colors ${activeTab === 'feature' ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Ideas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bug')}
            className={`px-2 py-1 rounded transition-colors ${activeTab === 'bug' ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Bugs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resolved')}
            className={`px-2 py-1 rounded transition-colors ${activeTab === 'resolved' ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            Resolved
          </button>
        </div>

        {feedbacks.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[9px] text-red-400 hover:text-red-300 uppercase font-bold shrink-0 px-1 py-0.5 hover:bg-red-500/10 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Feedbacks List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {filteredFeedbacks.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-gray-700 rounded-lg p-4 space-y-2">
            <p className="text-xs text-gray-400">
              {feedbacks.length === 0 ? "No user feedback records yet." : "No feedback matches this filter."}
            </p>
            {feedbacks.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 rounded text-[10px] font-bold uppercase transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Load Sample Feedbacks</span>
              </button>
            )}
          </div>
        ) : (
          filteredFeedbacks.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div 
                key={item.id} 
                className="bg-gray-900/60 border border-gray-800 hover:border-gray-700/80 rounded-lg p-2.5 space-y-1.5 transition-all text-left"
              >
                {/* Header row: User, Category, Rating, Date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">
                        {item.user}
                      </span>
                      {categoryBadge(item.category)}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formattedDate}</span>
                      {item.deviceInfo && <span>• {item.deviceInfo}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-2.5 h-2.5 ${i < (item.rating || 5) ? 'fill-amber-400' : 'text-gray-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body Message */}
                <p className="text-xs text-gray-200 leading-relaxed break-words bg-black/20 p-2 rounded border border-white/5">
                  {item.text}
                </p>

                {/* Footer Controls: Status toggle, Delete */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleStatusToggle(item)}
                    className="hover:opacity-80 transition-opacity"
                    title="Click to change status (New -> In Review -> Resolved)"
                  >
                    {statusBadge(item.status)}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackViewer;
