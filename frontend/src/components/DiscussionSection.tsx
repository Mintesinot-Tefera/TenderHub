import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { MessageSquare, CornerDownRight, AlertCircle } from 'lucide-react';
import { discussionApi, getErrorMessage } from '../services/api';
import type { DiscussionThread, Discussion } from '../types';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';
import { Avatar } from './Avatar';

interface Props {
  tenderId: string;
  organizationId: string;
}

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

export function DiscussionSection({ tenderId, organizationId }: Props) {
  const { user } = useAuth();

  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState('');
  const [posting, setPosting] = useState(false);
  const [formError, setFormError] = useState('');

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const load = () => {
    discussionApi
      .listForTender(tenderId)
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderId]);

  const handlePostQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setPosting(true);
    try {
      await discussionApi.post(tenderId, { content: question });
      setQuestion('');
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const handlePostReply = async (e: FormEvent, parentId: string) => {
    e.preventDefault();
    setFormError('');
    setReplying(true);
    try {
      await discussionApi.post(tenderId, { content: replyText, parentId });
      setReplyText('');
      setReplyingTo(null);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setReplying(false);
    }
  };

  const openReply = (threadId: string) => {
    setReplyingTo(threadId);
    setReplyText('');
    setFormError('');
  };

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <MessageSquare className="h-5 w-5 text-primary-600" />
        Questions & Discussion
        {threads.length > 0 && (
          <span className="text-sm font-normal text-slate-500">({threads.length})</span>
        )}
      </h2>

      {/* Ask a question */}
      {user ? (
        <form onSubmit={handlePostQuestion} className="mb-6">
          {formError && !replyingTo && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <textarea
            required
            minLength={3}
            maxLength={2000}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="input resize-y"
            placeholder="Ask a question about this tender..."
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={posting || question.trim().length < 3}
              className="btn-primary"
            >
              {posting ? <Spinner className="h-5 w-5" /> : 'Post Question'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Sign in to ask questions or reply to discussions.
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : threads.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No questions yet. Be the first to ask!
        </p>
      ) : (
        <ul className="space-y-5">
          {threads.map((thread) => (
            <li key={thread.id} className="border-t border-slate-100 pt-5 first:border-0 first:pt-0">
              <DiscussionEntry entry={thread} organizationId={organizationId} />

              {/* Replies */}
              {thread.replies.length > 0 && (
                <ul className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4 sm:ml-11">
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <DiscussionEntry entry={reply} organizationId={organizationId} />
                    </li>
                  ))}
                </ul>
              )}

              {/* Reply action */}
              {user && replyingTo !== thread.id && (
                <button
                  type="button"
                  onClick={() => openReply(thread.id)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 sm:ml-11"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}

              {/* Reply form */}
              {user && replyingTo === thread.id && (
                <form
                  onSubmit={(e) => handlePostReply(e, thread.id)}
                  className="mt-3 sm:ml-11"
                >
                  {formError && (
                    <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                  <textarea
                    required
                    minLength={3}
                    maxLength={2000}
                    rows={2}
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input resize-y"
                    placeholder="Write a reply..."
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={replying || replyText.trim().length < 3}
                      className="btn-primary"
                    >
                      {replying ? <Spinner className="h-5 w-5" /> : 'Reply'}
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DiscussionEntry({
  entry,
  organizationId,
}: {
  entry: Discussion;
  organizationId: string;
}) {
  const isTenderOwner = entry.userId === organizationId;

  return (
    <div className="flex gap-3">
      <Avatar src={entry.authorAvatarUrl} name={entry.authorName} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{entry.authorName}</span>
          {isTenderOwner && (
            <span className="badge bg-primary-100 text-primary-700">Organization</span>
          )}
          {!isTenderOwner && entry.authorRole === 'ORGANIZATION' && (
            <span className="badge bg-slate-100 text-slate-600">Org</span>
          )}
          <span className="text-xs text-slate-500">{formatTimestamp(entry.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{entry.content}</p>
      </div>
    </div>
  );
}
