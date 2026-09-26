import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import Spinner from '../../components/ui/Spinner';
import { page, useReducedMotion, transition } from '../../lib/motion';

// Import all steps
import VerifyEmailStep from './steps/VerifyEmailStep';
import UploadDocumentStep from './steps/UploadDocumentStep';
import AwaitingVerificationStep from './steps/AwaitingVerificationStep';
import VerificationRejectedStep from './steps/VerificationRejectedStep';
import CompleteProfileStep from './steps/CompleteProfileStep';
import SelectProjectTypeStep from './steps/SelectProjectTypeStep';
import SelectInterestsStep from './steps/SelectInterestsStep';
import TakeSeriousnessTestStep from './steps/TakeSeriousnessTestStep';
import SelectConnectionTypeStep from './steps/SelectConnectionTypeStep';

const STEP_COMPONENTS = {
  VERIFY_EMAIL: VerifyEmailStep,
  UPLOAD_DOCUMENT: UploadDocumentStep,
  AWAITING_VERIFICATION: AwaitingVerificationStep,
  VERIFICATION_REJECTED: VerificationRejectedStep,
  COMPLETE_PROFILE: CompleteProfileStep,
  SELECT_PROJECT_TYPE: SelectProjectTypeStep,
  SELECT_INTERESTS: SelectInterestsStep,
  TAKE_SERIOUSNESS_TEST: TakeSeriousnessTestStep,
  SELECT_CONNECTION_TYPE: SelectConnectionTypeStep,
};

// Steps built as a single narrow column (header + max-w-lg form). They sit
// centred in the layout; the grid-based steps already fill its full width.
const NARROW_STEPS = new Set([
  'VERIFY_EMAIL',
  'UPLOAD_DOCUMENT',
  'AWAITING_VERIFICATION',
  'VERIFICATION_REJECTED',
  'COMPLETE_PROFILE',
  'TAKE_SERIOUSNESS_TEST',
]);

// Fixed order for the pure preference/data steps only — the ones a user can
// safely revisit and resubmit. Verification and the seriousness test are
// deliberately excluded: you can't un-verify an email, and once a test
// sitting is underway there is no going back to it either.
const BACK_TARGET = {
  SELECT_PROJECT_TYPE: 'COMPLETE_PROFILE',
  SELECT_INTERESTS: 'SELECT_PROJECT_TYPE',
  SELECT_CONNECTION_TYPE: 'SELECT_INTERESTS',
};

/**
 * BACK_TARGET assumes a from-scratch, single-project-type pass. Both hops
 * stop being safe once a second project type is involved — whether picked
 * together or added later via HomePage's "add Long-Term" flow — because the
 * setup no longer matches what the target step expects:
 *
 * - SELECT_INTERESTS -> SELECT_PROJECT_TYPE: that step only ever expects to
 *   run once, before any project type exists (see its own comment), and
 *   submits a single replacement type. Safe when this is still the only
 *   project type on the account (nothing else to lose); with a second one
 *   already there, resubmitting a single type there deletes that other
 *   type's interests and connection type outright
 *   (InterestService.selectProjectTypes replaces the whole set).
 * - SELECT_CONNECTION_TYPE -> SELECT_INTERESTS: Long-Term's interests are
 *   locked the moment they're first saved (required before the test can even
 *   start), so whenever Long-Term is one of the project types, by the time
 *   this step is reachable its tab is guaranteed to fail with "Long-term
 *   interests are set once and can't be changed" the moment Continue is
 *   pressed on it — same "no take-backs" reasoning the test itself already
 *   gets.
 */
function backTargetFor(step, onboarding) {
  const projectTypes = onboarding?.projectTypes || [];
  if (step === 'SELECT_INTERESTS' && projectTypes.length > 1) {
    return undefined;
  }
  if (step === 'SELECT_CONNECTION_TYPE' && projectTypes.includes('LONG_TERM')) {
    return undefined;
  }
  return BACK_TARGET[step];
}

export default function OnboardingPage() {
  const { onboarding, fetchOnboarding, viewStepOverride, setViewStepOverride } = useUserStore();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  // Landing here is usually the tail end of a signup/login SPA navigation, not
  // a cold page load — so the very first fetch can occasionally lose a timing
  // race (e.g. a just-issued token the backend hasn't caught up on yet) that a
  // fresh reload wouldn't hit. Retry a couple of times before ever showing a
  // dead end, so that class of blip self-heals instead of forcing a manual
  // reload every time.
  useEffect(() => {
    let cancelled = false;
    const attempt = (retriesLeft) => {
      fetchOnboarding().catch((error) => {
        if (cancelled) return;
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 500);
        } else {
          console.error(error);
          setFailed(true);
        }
      });
    };
    attempt(2);
    return () => { cancelled = true; };
  }, []);

  const step = viewStepOverride || onboarding?.step;

  // READY still leaves onboarding; the guard normally catches this first.
  useEffect(() => {
    if (step === 'READY') navigate('/home', { replace: true });
  }, [step, navigate]);

  if (!onboarding) {
    if (failed) {
      return (
        <div className="py-24 text-center">
          <p className="text-sm text-bad">Could not load your setup state.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-accent-700 underline underline-offset-4 decoration-accent-300 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            Reload
          </button>
        </div>
      );
    }
    return (
      <div className="flex justify-center py-24 text-accent-500">
        <Spinner size="lg" />
      </div>
    );
  }

  if (step === 'READY') {
    return <p className="py-24 text-center text-sm text-mute">All set. Taking you in…</p>;
  }

  const StepComponent = STEP_COMPONENTS[step];

  if (!StepComponent) {
    return (
      <p className="py-24 text-center text-sm text-mute">
        Unknown step: <span className="font-mono text-ink">{String(step)}</span>
      </p>
    );
  }

  const backTarget = backTargetFor(step, onboarding);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        layoutId={reduced ? undefined : 'onboarding-panel'}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
        transition={transition(page, reduced)}
        className={NARROW_STEPS.has(step) ? 'mx-auto w-full max-w-lg' : undefined}
      >
        {backTarget && (
          <button
            type="button"
            onClick={() => setViewStepOverride(backTarget)}
            className="mb-8 inline-flex items-center text-sm text-mute hover:text-ink transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </button>
        )}
        <StepComponent />
      </motion.div>
    </AnimatePresence>
  );
}
