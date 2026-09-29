import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, MoreHorizontal, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Dropdown from '../../components/ui/Dropdown';
import Modal from '../../components/ui/Modal';
import TextArea from '../../components/ui/TextArea';
import Spinner from '../../components/ui/Spinner';
import { useUserStore } from '../../store/useUserStore';
import { useModerationStore } from '../../store/useModerationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { AboutCard, CurrentGoal, FunFact, LookingToWorkOn, ProfileHeader, SkillsCard } from './ProfileSections';
import { normaliseInterests } from './profileData';

export default function PeerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const { peerProfile, fetchPeerProfile, loading } = useUserStore();
  const { blockUser, reportUser, loading: moderationLoading } = useModerationStore();
  const { chatList, fetchChatList } = useChatStore();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [loaded, setLoaded] = useState(false);

  const authUser = useAuthStore((state) => state.user);
  const myProfile = useUserStore((state) => state.profile);
  const myId = authUser?.id || myProfile?.id;

  // The store keeps a single peerProfile, populated by fetchPeerProfile below.
  const profile = peerProfile?.id === userId ? peerProfile : null;
  const interests = useMemo(() => normaliseInterests(profile?.interests), [profile]);

  // A conversation you already share with them — 1:1 first, else any group.
  const sharedChat = useMemo(() => {
    const rooms = (Array.isArray(chatList) ? chatList : []).filter((c) => c.members?.some((m) => m.userId === userId));
    return rooms.find((c) => c.type === 'ONE_ON_ONE') || rooms[0] || null;
  }, [chatList, userId]);

  useEffect(() => {
    if (myId && userId === myId) {
      navigate('/profile', { replace: true });
      return;
    }
    setLoaded(false);
    fetchChatList().catch(() => {});
    fetchPeerProfile(userId)
      .catch(() => {
        toast.error('Could not load that profile');
        navigate('/matches');
      })
      .finally(() => setLoaded(true));
  }, [userId, myId]);

  const handleBlock = async () => {
    try {
      await blockUser(userId);
      toast.success('Blocked');
      navigate('/matches');
    } catch (error) {
      toast.error(error.message || 'Could not block');
    } finally {
      setBlockModalOpen(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Say what happened first');
      return;
    }
    try {
      await reportUser(userId, reportReason);
      toast.success('Sent to moderation');
      setReportModalOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error(error.message || 'Could not send that');
    }
  };

  if (!profile && (loading || !loaded)) {
    return (
      <div className="flex justify-center py-24 text-accent-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-24 text-center text-sm text-mute">No such profile.</p>;
  }

  const goal = interests.find((i) => i.projectType === 'SHORT_TERM');
  const firstName = profile.name?.split(' ')[0];

  const actions = (
    <>
      {sharedChat ? (
        <Button size="sm" icon={<MessageSquare className="h-4 w-4" />} onClick={() => navigate(`/chat/${sharedChat.chatRoomId}`)}>
          Message
        </Button>
      ) : (
        <Button size="sm" variant="secondary" icon={<Users className="h-4 w-4" />} onClick={() => navigate('/matches')}>
          Find matches
        </Button>
      )}
      <Dropdown
        align="right"
        label="More options"
        trigger={(
          <span className="grid h-9 w-9 place-items-center rounded-md border border-line text-mute transition-colors hover:text-ink">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        items={[
          { label: 'Report', onClick: () => setReportModalOpen(true) },
          { label: 'Block', onClick: () => setBlockModalOpen(true), danger: true },
        ]}
      />
    </>
  );

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center rounded-sm text-sm text-mute transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <ProfileHeader profile={profile} interests={interests} actions={actions} />

      {/* One flow on phones (priority order via `order`), two columns from lg. */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="order-4 empty:hidden lg:order-none"><AboutCard profile={profile} /></div>
          <div className="order-3 empty:hidden lg:order-none"><SkillsCard interests={interests} /></div>
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-5">
          <div className="order-1 empty:hidden lg:order-none"><LookingToWorkOn interests={interests} nowText={profile.storyPrompt2} name={firstName} /></div>
          <div className="order-2 empty:hidden lg:order-none"><CurrentGoal goal={goal} /></div>
          <div className="order-5 empty:hidden lg:order-none"><FunFact text={profile.storyPrompt3} /></div>
        </div>
      </div>

      <Modal open={blockModalOpen} onClose={() => setBlockModalOpen(false)} title="Block this person">
        <p className="text-sm leading-relaxed text-mute">
          {profile.name} will not show up in your matches or chats again, and
          cannot reach you.
        </p>
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setBlockModalOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleBlock} loading={moderationLoading}>Block</Button>
        </div>
      </Modal>

      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report this person">
        <p className="mb-4 text-sm leading-relaxed text-mute">
          Say what happened. A human reads these.
        </p>
        <TextArea
          placeholder="What they did…"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          rows={4}
          aria-label="Reason for reporting"
        />
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setReportModalOpen(false)}>Cancel</Button>
          <Button onClick={handleReport} loading={moderationLoading}>Send</Button>
        </div>
      </Modal>
    </div>
  );
}
