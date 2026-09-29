import { useEffect, useMemo, useState } from 'react';
import { Camera, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import FileUpload from '../../components/ui/FileUpload';
import ShortTermInterestModal from '../home/ShortTermInterestModal';
import { useUserStore } from '../../store/useUserStore';
import { useInterestStore } from '../../store/useInterestStore';
import { useTaskStore } from '../../store/useTaskStore';
import {
  AboutCard, ActivityCard, CompletionMeter, CurrentGoal, FunFact, LookingToWorkOn, ProfileHeader, SkillsCard,
} from './ProfileSections';
import { completion, normaliseInterests } from './profileData';

// The three free-text answers, labelled for what they are on a profile.
const PROMPTS = [
  { key: 'storyPrompt1', label: 'Short intro', hint: 'Shown under your name. What are you actually into?' },
  { key: 'storyPrompt2', label: 'Working on right now', hint: 'What’s open on your laptop these days?' },
  { key: 'storyPrompt3', label: 'Something people find out late', hint: 'One thing that surprises people.' },
];

export default function ProfilePage() {
  const { profile, fetchMe, updateProfile, updatePhoto, loading } = useUserStore();
  const { myInterests, fetchMyInterests } = useInterestStore();
  const { myStats, fetchMyStats } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  useEffect(() => {
    fetchMe().catch(console.error);
    fetchMyInterests().catch(console.error);
    fetchMyStats().catch(console.error);
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        profilePhotoUrl: profile.profilePhotoUrl || '',
        yearOfStudy: profile.yearOfStudy?.toString() || '1',
        city: profile.city || '',
        course: profile.course || '',
        storyPrompt1: profile.storyPrompt1 || '',
        storyPrompt2: profile.storyPrompt2 || '',
        storyPrompt3: profile.storyPrompt3 || '',
        // Sent back on every save so editing the rest never clears it.
        proofOfWorkUrl: profile.proofOfWorkUrl || '',
      });
    }
  }, [profile, isEditing]);

  const interests = useMemo(() => normaliseInterests(myInterests), [myInterests]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      await updateProfile({
        ...formData,
        proofOfWorkUrl: formData.proofOfWorkUrl?.trim() || null,
        collegeId: profile?.collegeId,
        yearOfStudy: parseInt(formData.yearOfStudy, 10),
      });
      toast.success('Profile saved');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Could not save that');
    }
  };

  const handlePhotoUploaded = async (url) => {
    try {
      await updatePhoto(url);
      setShowPhotoUpload(false);
      toast.success('Photo updated');
    } catch (error) {
      toast.error(error.message || 'Could not update photo');
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center py-24 text-accent-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-24 text-center text-sm text-bad">Could not load your profile.</p>;
  }

  const verified = profile.verificationStatus === 'APPROVED';
  const goal = interests.find((i) => i.projectType === 'SHORT_TERM');
  const { pct, missing } = completion(profile, interests);
  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const avatarSlot = (
    <div className="group relative">
      <Avatar src={profile.profilePhotoUrl} name={profile.name} size="2xl" className="max-sm:h-20 max-sm:w-20" />
      <button
        type="button"
        onClick={() => setShowPhotoUpload((o) => !o)}
        className="absolute inset-0 flex items-center justify-center rounded bg-ink/0 transition-colors hover:bg-ink/40 focus-visible:bg-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-label="Change profile photo"
      >
        <Camera className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" strokeWidth={1.5} />
      </button>
    </div>
  );

  const actions = !isEditing ? (
    <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setIsEditing(true)}>
      Edit profile
    </Button>
  ) : (
    <>
      <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setShowPhotoUpload(false); }}>Cancel</Button>
      <Button size="sm" onClick={handleSubmit} loading={loading}>Save</Button>
    </>
  );

  return (
    <div className="space-y-5">
      <ProfileHeader
        profile={profile}
        interests={interests}
        verified={verified}
        stats={myStats}
        actions={actions}
        avatarSlot={avatarSlot}
      >
        {!isEditing && <CompletionMeter pct={pct} missing={missing} onComplete={() => setIsEditing(true)} />}
      </ProfileHeader>

      {showPhotoUpload && (
        <div className="max-w-sm">
          <FileUpload
            category="PROFILE_PHOTO"
            label="Change profile photo"
            onUploadComplete={handlePhotoUploaded}
            existingUrl={profile.profilePhotoUrl}
          />
        </div>
      )}

      {!isEditing ? (
        // One flow on phones (priority order via `order`), two columns from lg.
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-4 empty:hidden lg:order-none"><AboutCard profile={profile} owner /></div>
            <div className="order-3 empty:hidden lg:order-none"><SkillsCard interests={interests} /></div>
            <div className="order-5 empty:hidden lg:order-none"><FunFact text={profile.storyPrompt3} /></div>
          </div>
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-1 empty:hidden lg:order-none"><LookingToWorkOn interests={interests} nowText={profile.storyPrompt2} /></div>
            <div className="order-2 empty:hidden lg:order-none"><CurrentGoal goal={goal} owner onChange={() => setGoalModalOpen(true)} /></div>
            <div className="order-6 empty:hidden lg:order-none"><ActivityCard stats={myStats} /></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">The basics</h2>
              <FileUpload
                category="PROFILE_PHOTO"
                label="Profile photo"
                onUploadComplete={(url) => setFormData({ ...formData, profilePhotoUrl: url })}
                existingUrl={formData.profilePhotoUrl}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Full name" value={formData.name} onChange={set('name')} required />
                <Input label="City" value={formData.city} onChange={set('city')} required />
                <Input label="Course" placeholder="e.g. B.Tech CSE" value={formData.course} onChange={set('course')} required />
                <Select
                  label="Year"
                  value={formData.yearOfStudy}
                  onChange={set('yearOfStudy')}
                  options={[
                    { value: '1', label: '1st year' }, { value: '2', label: '2nd year' },
                    { value: '3', label: '3rd year' }, { value: '4', label: '4th year' },
                    { value: '5', label: '5th year' }, { value: '6', label: '6th+ year' },
                  ]}
                />
              </div>
              <Input
                label="Portfolio or project link"
                placeholder="GitHub, Behance, a live project…"
                value={formData.proofOfWorkUrl}
                onChange={set('proofOfWorkUrl')}
              />
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">In your words</h2>
              {PROMPTS.map(({ key, label, hint }) => (
                <div key={key}>
                  <TextArea label={label} value={formData[key]} onChange={set(key)} rows={2} />
                  <p className="mt-1 text-[11px] text-mute">{hint}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5">
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Save profile</Button>
          </div>
        </form>
      )}

      <ShortTermInterestModal open={goalModalOpen} onClose={() => { setGoalModalOpen(false); fetchMyInterests().catch(() => {}); }} />
    </div>
  );
}
