import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

const roleColors = {
  citizen:     { bg: '#EFF6FF', color: '#3B82F6' },
  officer:     { bg: '#F0FDF4', color: '#22C55E' },
  deptAdmin:   { bg: '#FFF7ED', color: '#F97316' },
  superAdmin:  { bg: '#FDF4FF', color: '#A855F7' },
  wardOfficer: { bg: '#FFFBEB', color: '#F59E0B' },
  cityAdmin:   { bg: '#F0FDFA', color: '#14B8A6' },
  stateAdmin:  { bg: '#FFF1F2', color: '#F43F5E' },
};

const statusSteps = ['Submitted', 'Assigned', 'InProgress', 'Resolved'];
const statusStyles = {
  Submitted: 'bg-gray-100 text-gray-700',
  Assigned: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const timelineIcons = {
  Submitted:  '📋',
  Assigned:   '👤',
  InProgress: '🔧',
  Resolved:   '✅',
  Rejected:   '❌',
};

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const COMMENT_LIMIT = 10;

  useEffect(() => {
    api.get(`/api/v1/complaints/${id}`)
      .then(({ data }) => setComplaint(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const fetchComments = async (page = 1, append = false) => {
    try {
      const { data } = await api.get(`/api/v1/complaints/${id}/comments`, {
        params: { page, limit: COMMENT_LIMIT },
      });
      setComments((prev) => append ? [...prev, ...data.data] : data.data);
      setCommentTotal(data.total || 0);
      setCommentHasMore(data.hasMore || false);
      setCommentPage(page);
    } catch {
      // silently fail
    }
  };

  useEffect(() => { fetchComments(1); }, [id]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchComments(commentPage + 1, true);
    setLoadingMore(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const { data } = await api.post(`/api/v1/complaints/${id}/comments`, { text: commentText });
      // Prepend new comment and bump total
      setComments((prev) => [data.data, ...prev]);
      setCommentTotal((prev) => prev + 1);
      setCommentText('');
    } catch {
      // silently fail
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/api/v1/complaints/${id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentTotal((prev) => prev - 1);
    } catch {
      // silently fail
    }
  };

  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const { data } = await api.post(`/api/v1/complaints/${id}/upvote`);
      setComplaint((prev) => ({
        ...prev,
        upvotes: data.data.upvotes,
        upvotedBy: data.data.upvoted
          ? [...(prev.upvotedBy || []), user._id]
          : (prev.upvotedBy || []).filter((uid) => uid !== user._id),
      }));
    } catch {
      // silently fail
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!complaint) return <div className="min-h-screen flex items-center justify-center text-gray-400">Complaint not found</div>;

  const coords = complaint.location?.coordinates;
  const currentStep = statusSteps.indexOf(complaint.status);
  const hasUpvoted = complaint.upvotedBy?.some((uid) =>
    (uid?._id || uid)?.toString() === user?._id?.toString()
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-sm text-gray-400 mb-4">
          <Link to="/" className="hover:text-blue-600">Home</Link> &rsaquo; <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link> &rsaquo; Complaint #{complaint._id.slice(-6).toUpperCase()}
        </div>

        {complaint.status === 'Resolved' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
            This complaint has been resolved!
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{complaint.title}</h1>
              <p className="text-sm text-gray-500 mt-1">{complaint.category}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Upvote button */}
              {user?.role === 'citizen' && (
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                    ${hasUpvoted
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    } ${upvoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>▲</span>
                  <span>{complaint.upvotes}</span>
                </button>
              )}
              <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusStyles[complaint.status]}`}>
                {complaint.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-5">{complaint.description}</p>

          {/* Images */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Before</p>
              <img src={complaint.beforeImage} alt="before" className="w-full h-48 object-cover rounded-xl" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">After</p>
              {complaint.afterImage ? (
                <img src={complaint.afterImage} alt="after" className="w-full h-48 object-cover rounded-xl" />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  Pending resolution
                </div>
              )}
            </div>
          </div>

          {/* Status progress bar */}
          <div className="flex items-center gap-2 mb-5">
            {statusSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
                  ${i <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{s}</span>
                {i < statusSteps.length - 1 && <div className={`flex-1 h-px ${i < currentStep ? 'bg-blue-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Map */}
          {coords && (
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200">
              <MapContainer center={[coords[1], coords[0]]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[coords[1], coords[0]]} />
              </MapContainer>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow p-6 text-sm space-y-3 mb-4">
          <p className="text-gray-500">Department: <span className="font-medium text-gray-800">{complaint.department?.name || 'Unassigned'}</span></p>
          {complaint.assignedTo && (
            <p className="text-gray-500">Officer: <span className="font-medium text-gray-800">{complaint.assignedTo.name}</span></p>
          )}
          {complaint.fundsSpent > 0 && (
            <p className="text-gray-500">Funds Spent: <span className="font-medium text-gray-800">₹{complaint.fundsSpent.toLocaleString()}</span></p>
          )}
          <p className="text-gray-500">Submitted: <span className="font-medium text-gray-800">{new Date(complaint.createdAt).toLocaleDateString()}</span></p>
          {complaint.resolvedAt && (
            <p className="text-gray-500">Resolved: <span className="font-medium text-gray-800">{new Date(complaint.resolvedAt).toLocaleDateString()}</span></p>
          )}
          <p className="text-gray-500">
            Upvotes: <span className="font-medium text-gray-800">{complaint.upvotes}</span>
            {user?.role !== 'citizen' && <span className="text-gray-400 text-xs ml-1">(log in as citizen to vote)</span>}
          </p>
        </div>

        {/* Timeline / Activity log */}
        {complaint.timeline?.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-4">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Activity Timeline</h2>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-5">
                {[...complaint.timeline].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs flex-shrink-0 z-10">
                      {timelineIcons[entry.status] || '•'}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-700">{entry.status}</span>
                        {entry.updatedBy && (
                          <span className="text-xs text-gray-400">by {entry.updatedBy.name || 'System'}</span>
                        )}
                      </div>
                      {entry.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-sm font-bold text-gray-800 mb-4">
            Comments <span className="text-gray-400 font-normal">({commentTotal})</span>
          </h2>

          {/* Add comment form — logged-in users only */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment... (max 500 characters)"
                maxLength={500}
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none outline-none focus:border-blue-400 transition-colors"
                style={{ fontFamily: 'inherit' }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{commentText.length}/500</span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-400 mb-6">
              <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to leave a comment.
            </p>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first to comment.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((c, idx) => {
                const roleStyle = roleColors[c.author?.role] || roleColors.citizen;
                const isOwn = c.author?._id === user?._id;
                const canDelete = isOwn || user?.role === 'superAdmin';
                return (
                  <div key={c._id} className="flex gap-3">
                    {/* Avatar */}
                    {c.author?.profilePhoto ? (
                      <img src={c.author.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: roleStyle.bg, color: roleStyle.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {c.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-gray-800">{c.author?.name || 'Unknown'}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                          background: roleStyle.bg, color: roleStyle.color, textTransform: 'capitalize',
                        }}>
                          {c.author?.role || ''}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="text-xs text-red-400 hover:text-red-600 ml-auto"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {commentHasMore && (
                <div className="pt-2 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {loadingMore
                      ? 'Loading...'
                      : `Load more (${commentTotal - comments.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
