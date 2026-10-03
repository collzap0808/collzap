import { useState, useEffect } from 'react';
import { Search, ExternalLink, AlertTriangle, Trophy, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import TextArea from '../../components/ui/TextArea';
import { useAdminStore } from '../../store/useAdminStore';
import AdminPageHeader from './AdminPageHeader';

const verificationBadge = (status) => {
  switch (status) {
    case 'APPROVED': return <Badge variant="success">Verified</Badge>;
    case 'DOCUMENT_SUBMITTED': return <Badge variant="warning">In review</Badge>;
    case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="secondary">Unverified</Badge>;
  }
};

// Mirrors verificationBadge's own labels, so the filter options read the
// same as the badges they're filtering by.
const VERIFICATION_OPTIONS = [
  { value: '', label: 'Any verification' },
  { value: 'APPROVED', label: 'Verified' },
  { value: 'DOCUMENT_SUBMITTED', label: 'In review' },
  { value: 'PENDING', label: 'Unverified' },
  { value: 'REJECTED', label: 'Rejected' },
];

// Title-cased labels for SeriousnessLevel — the enum values themselves are
// shouting (BEGINNER, LEARNING, ...).
const LEVEL_LABEL = {
  BEGINNER: 'Beginner',
  LEARNING: 'Learning',
  INTERMEDIATE: 'Intermediate',
  EXPERT: 'Expert',
};

export default function AdminUsersPage() {
  const { users, fetchUsers, fetchUser, deleteUser, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Search/status/verification/page all go to the server — college is
  // covered by the search box itself (it matches name, email, or college).
  // Filter changes reset the page inline so this stays a single fetch.
  useEffect(() => {
    const status = activeTab === 'ALL' ? null : activeTab;
    const handle = setTimeout(() => {
      fetchUsers(searchTerm || null, status, page, verificationFilter || null).catch(console.error);
    }, searchTerm ? 300 : 0); // debounce typing only
    return () => clearTimeout(handle);
  }, [searchTerm, activeTab, verificationFilter, page]);

  const changeFilter = (fn) => { setPage(0); fn(); };

  const handleOpenUser = async (user) => {
    setSelectedUser(user);
    setLoadingDetail(true);
    try {
      // The detail endpoint wraps the profile with task points/streak and
      // per-interest seriousness level — flatten it here so the rest of the
      // component just reads one object.
      const full = await fetchUser(user.id);
      if (full) {
        setSelectedUser({
          ...full.user,
          totalPoints: full.totalPoints,
          currentStreakDays: full.currentStreakDays,
          longestStreakDays: full.longestStreakDays,
          seriousnessLevels: full.seriousnessLevels || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch user detail', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenDelete = () => {
    setDeleteReason('');
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteReason.trim()) {
      toast.error('A reason is required');
      return;
    }
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;

    setDeleting(true);
    try {
      await deleteUser(selectedUser.id, deleteReason.trim());
      toast.success('User deleted');
      setDeleteModalOpen(false);
      setSelectedUser(null);
      const status = activeTab === 'ALL' ? null : activeTab;
      fetchUsers(searchTerm || null, status, page, verificationFilter || null);
    } catch (error) {
      toast.error(error.message || 'Could not delete that user');
    } finally {
      setDeleting(false);
    }
  };

  const rows = users?.content || [];

  return (
    <div>
      <AdminPageHeader title="Users" count={users?.totalElements}>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Name, email, college"
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
            value={searchTerm}
            onChange={(e) => changeFilter(() => setSearchTerm(e.target.value))}
            aria-label="Search users"
          />
        </div>
      </AdminPageHeader>

      <Tabs
        tabs={[
          { key: 'ALL', label: 'All' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'DELETED', label: 'Deleted' },
        ]}
        active={activeTab}
        onChange={(key) => changeFilter(() => setActiveTab(key))}
        className="mb-4"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-52">
          <Select
            aria-label="Filter by verification"
            value={verificationFilter}
            onChange={(e) => changeFilter(() => setVerificationFilter(e.target.value))}
            options={VERIFICATION_OPTIONS}
          />
        </div>
        {verificationFilter && (
          <button
            type="button"
            onClick={() => changeFilter(() => setVerificationFilter(''))}
            className="text-xs text-accent-700 underline decoration-accent-300 underline-offset-4 hover:text-accent-800 sm:ml-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Five columns of ops detail do not survive a phone. Below md the same
          rows become stacked cards; the table returns when there is width for
          it. `min-w` keeps the table honest so the scroller actually scrolls
          rather than crushing every column. */}
      <div className="hidden overflow-x-auto rounded-lg border border-line md:block">
        <table className="w-full min-w-[52rem] divide-y divide-line text-sm">
          <thead className="bg-ink/[0.02]">
            <tr>
              {['User', 'College', 'Verification', 'Account', 'Joined', ''].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-widest text-mute"
                >
                  {h || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {loading && rows.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-12 text-center text-accent-500"><Spinner /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-12 text-center text-sm text-mute">Nobody matches that.</td></tr>
            ) : (
              rows.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleOpenUser(user)}
                  className="cursor-pointer transition-colors hover:bg-ink/[0.02]"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{user.name}</div>
                    <div className="text-xs text-mute">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-ink">{user.collegeName || '—'}</div>
                    {user.yearOfStudy && <div className="text-xs text-mute">Year {user.yearOfStudy}</div>}
                  </td>
                  <td className="px-4 py-3">{verificationBadge(user.verificationStatus)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.accountStatus === 'DELETED' ? 'destructive' : 'secondary'}>
                      {user.accountStatus || 'ACTIVE'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-mute tnum">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleOpenUser(user); }}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface md:hidden">
        {loading && rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-accent-500"><Spinner /></div>
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-mute">Nobody matches that.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((user) => (
              <li key={user.id}>
                {/* The whole card is the affordance, so no stray "Open" button
                    hiding beyond the right edge. */}
                <button
                  type="button"
                  onClick={() => handleOpenUser(user)}
                  className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-ink/[0.02] focus-visible:outline-none focus-visible:bg-ink/[0.04]"
                >
                  {/* Spans, not paragraphs: a <button> may only contain
                      phrasing content. */}
                  <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
                  <span className="block truncate text-xs text-mute">{user.email}</span>
                  <span className="mt-1 block truncate text-xs text-mute">
                    {user.collegeName || '—'}
                    {user.yearOfStudy ? ` · Year ${user.yearOfStudy}` : ''}
                  </span>
                  <span className="mt-2.5 flex flex-wrap items-center gap-2">
                    {verificationBadge(user.verificationStatus)}
                    <Badge variant={user.accountStatus === 'DELETED' ? 'destructive' : 'secondary'}>
                      {user.accountStatus || 'ACTIVE'}
                    </Badge>
                    <span className="ml-auto shrink-0 text-[11px] text-mute tnum">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {users?.totalPages > 1 && (
        <Pagination
          page={users.page ?? page}
          totalPages={users.totalPages}
          onPageChange={setPage}
          className="mt-2 rounded-b-lg border-x border-b border-line bg-surface"
        />
      )}

      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-ink">
                {selectedUser.name}
              </h2>
              <p className="mt-1 text-sm text-mute">{selectedUser.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {verificationBadge(selectedUser.verificationStatus)}
                <Badge variant={selectedUser.accountStatus === 'DELETED' ? 'destructive' : 'secondary'}>
                  {selectedUser.accountStatus || 'ACTIVE'}
                </Badge>
                {selectedUser.profileCompleted && <Badge variant="success">Profile done</Badge>}
              </div>

              {!loadingDetail && selectedUser.totalPoints !== undefined && (
                <div className="mt-4 flex flex-wrap items-center gap-4 text-mute">
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <Trophy className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
                    <span className="font-medium text-ink tnum">{selectedUser.totalPoints}</span> pts
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <Flame className="h-3.5 w-3.5 text-bad" aria-hidden="true" />
                    <span className="font-medium text-ink tnum">{selectedUser.currentStreakDays}</span>
                    -day streak
                  </span>
                  {selectedUser.seriousnessLevels?.map((l) => (
                    <Badge key={l.interestName} variant="primary">
                      {l.interestName}: {LEVEL_LABEL[l.level] || l.level}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {loadingDetail && <div className="text-accent-500"><Spinner size="sm" /></div>}

            <dl className="grid gap-px overflow-hidden rounded border border-line bg-line text-sm sm:grid-cols-2">
              {[
                ['College', selectedUser.collegeName],
                ['City', selectedUser.city],
                ['Course', selectedUser.course],
                ['Year', selectedUser.yearOfStudy ? `Year ${selectedUser.yearOfStudy}` : null],
                ['Joined', selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : null],
              ].map(([label, value]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-mute">{label}</dt>
                  <dd className="mt-1 text-ink">{value || '—'}</dd>
                </div>
              ))}
            </dl>

            {(selectedUser.storyPrompt1 || selectedUser.storyPrompt2 || selectedUser.storyPrompt3) && (
              <div className="divide-y divide-line border-y border-line">
                {[selectedUser.storyPrompt1, selectedUser.storyPrompt2, selectedUser.storyPrompt3]
                  .filter(Boolean)
                  .map((prompt, i) => (
                    <p key={i} className="py-3 text-sm leading-relaxed text-ink">{prompt}</p>
                  ))}
              </div>
            )}

            {selectedUser.proofOfWorkUrl && (
              <a
                href={selectedUser.proofOfWorkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent-700 underline decoration-accent-300 underline-offset-4"
              >
                Proof of work
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}

            <div className="flex justify-end border-t border-line pt-5">
              <Button variant="danger" size="sm" onClick={handleOpenDelete}>
                Delete user
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => { if (!deleting) setDeleteModalOpen(false); }}
        title="Delete user"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-bad/30 bg-bad/[0.06] p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-bad" />
            <p className="text-xs leading-relaxed text-ink/80">
              This permanently deletes <span className="font-semibold text-ink">{selectedUser?.name}</span> and
              everything tied to their account — matches, chats and messages, verification documents,
              notifications, and login sessions. This cannot be undone.
            </p>
          </div>

          <TextArea
            label="Reason for deletion"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Why is this account being deleted?"
            rows={3}
            autoFocus
          />

          <Input
            label={'Type "DELETE" to confirm'}
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              loading={deleting}
              disabled={!deleteReason.trim() || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
