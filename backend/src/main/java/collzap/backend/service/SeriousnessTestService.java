package collzap.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.config.CollzapProperties;
import collzap.backend.dto.TestDtos.AnswerAcceptedResponse;
import collzap.backend.dto.TestDtos.InterestResultResponse;
import collzap.backend.dto.TestDtos.SubmitAnswerRequest;
import collzap.backend.dto.TestDtos.TestEligibilityResponse;
import collzap.backend.dto.TestDtos.TestQuestionResponse;
import collzap.backend.dto.TestDtos.TestResultResponse;
import collzap.backend.dto.TestDtos.TestSessionResponse;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.enums.TestAttemptStatus;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.Interest;
import collzap.backend.models.SeriousnessTestAnswer;
import collzap.backend.models.SeriousnessTestAttempt;
import collzap.backend.models.SeriousnessTestQuestion;
import collzap.backend.models.SeriousnessTestAttemptQuestion;
import collzap.backend.models.User;
import collzap.backend.models.UserInterestSelection;
import collzap.backend.repositories.SeriousnessTestAnswerRepository;
import collzap.backend.repositories.SeriousnessTestAttemptRepository;
import collzap.backend.repositories.SeriousnessTestQuestionRepository;
import collzap.backend.repositories.SeriousnessTestAttemptQuestionRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserProjectTypeSelectionRepository;

/**
 * The Long-Term seriousness test. One sitting covers every Long-Term interest the
 * user picked: the configured question total is split across them, drawn at random
 * from each interest's bank, and scored here on the server.
 *
 * <p>The timer is silent by design — nothing in the session payload tells the
 * client how long is left. When it runs out the sitting is submitted with whatever
 * was answered, and unanswered questions simply score zero.
 */
@Service
public class SeriousnessTestService {

    private static final Logger log = LoggerFactory.getLogger(SeriousnessTestService.class);

    private final SeriousnessTestAttemptQuestionRepository sessionQuestionRepository;
    private final SeriousnessTestAttemptRepository attemptRepository;
    private final SeriousnessTestAnswerRepository answerRepository;
    private final SeriousnessTestQuestionRepository questionRepository;
    private final UserInterestSelectionRepository selectionRepository;
    private final UserProjectTypeSelectionRepository projectTypeRepository;
    private final UserService userService;
    private final CollzapProperties properties;

    public SeriousnessTestService(
        SeriousnessTestAttemptQuestionRepository sessionQuestionRepository,
        SeriousnessTestAttemptRepository attemptRepository,
        SeriousnessTestAnswerRepository answerRepository,
        SeriousnessTestQuestionRepository questionRepository,
        UserInterestSelectionRepository selectionRepository,
        UserProjectTypeSelectionRepository projectTypeRepository,
        UserService userService,
        CollzapProperties properties
    ) {
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.questionRepository = questionRepository;
        this.selectionRepository = selectionRepository;
        this.projectTypeRepository = projectTypeRepository;
        this.userService = userService;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public TestEligibilityResponse eligibility(UUID userId) {
        userService.requireSelf(userId);
        List<SeriousnessTestAttempt> activeAttempts = attemptRepository
            .findActiveAttemptsByUserId(userId);

        if (!activeAttempts.isEmpty()) {
            return new TestEligibilityResponse(
                true,
                null,
                null,
                true
            );
        }

        if (!projectTypeRepository.existsByUserIdAndProjectType(userId, ProjectType.LONG_TERM)) {
            return new TestEligibilityResponse(
                false,
                "The seriousness test is only for Long-Term Peer matching.",
                null,
                false
            );
        }

        List<UserInterestSelection> selections = longTermSelections(userId);
        if (selections.isEmpty()) {
            return new TestEligibilityResponse(
                false,
                "Pick your Long-Term interests first.",
                null,
                false
            );
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate lockedUntil = null;
        for (UserInterestSelection selection : selections) {
            SeriousnessTestAttempt attempt = latestSubmitted(userId, selection.getInterest().getId()).orElse(null);
            if (attempt != null && attempt.getEarnedPoints() > 0 && attempt.getNextRetakeDate() != null && attempt.getNextRetakeDate().isAfter(today)) {
                if (lockedUntil == null || attempt.getNextRetakeDate().isAfter(lockedUntil)) {
                    lockedUntil = attempt.getNextRetakeDate();
                }
            }
        }
        if (lockedUntil != null) {
            return new TestEligibilityResponse(
                false,
                "You can retake the test on %s.".formatted(lockedUntil),
                lockedUntil,
                false
            );
        }
        return new TestEligibilityResponse(
            true,
            null,
            null,
            !activeAttempts.isEmpty()
        );
    }

    /**
     * Builds a fresh sitting. Any sitting still open is abandoned first, which is
     * also what the back button relies on: going back and starting again gives a new
     * randomised paper from question one.
     */
    @Transactional
    public TestSessionResponse start(UUID userId) {
        User user = userService.requireSelf(userId);
        TestEligibilityResponse eligibility = eligibility(userId);
        if (!eligibility.eligible()) {
            throw new ConflictException(eligibility.reason());
        }

        attemptRepository.findActiveAttemptsByUserId(userId)
            .forEach(open -> {
                open.setStatus(TestAttemptStatus.ABANDONED);
                attemptRepository.save(open);
            });

        List<UserInterestSelection> selections = longTermSelections(userId);
        List<Interest> interests = selections.stream().map(UserInterestSelection::getInterest).toList();
        Map<Interest, List<SeriousnessTestQuestion>> paper = drawPaper(interests);

        int orderIndex = 0;
        for (Map.Entry<Interest, List<SeriousnessTestQuestion>> entry : paper.entrySet()) {
            int maxPoints = entry.getValue().stream().mapToInt(SeriousnessTestQuestion::maxPoints).sum();
            SeriousnessTestAttempt attempt = attemptRepository.save(new SeriousnessTestAttempt(
                user,
                entry.getKey(),
                entry.getValue().size(),
                maxPoints
            ));
            for (SeriousnessTestQuestion question : entry.getValue()) {
                sessionQuestionRepository.save(
                    new SeriousnessTestAttemptQuestion(attempt, question, orderIndex++));
            }
        }
        return describe(userId);
    }

    @Transactional(readOnly = true)
    public TestSessionResponse currentSession(UUID userId) {
        userService.requireSelf(userId);
        List<SeriousnessTestAttempt> attempts = attemptRepository.findActiveAttemptsByUserId(userId);
        if (attempts.isEmpty()) {
            throw new NotFoundException("No test in progress");
        }
        return describe(userId);
    }

    @Transactional
    public AnswerAcceptedResponse answer(UUID userId, SubmitAnswerRequest request) {
        userService.requireSelf(userId);
        List<SeriousnessTestAttempt> attempts = attemptRepository.findActiveAttemptsByUserId(userId);
        if (attempts.isEmpty()) {
            throw new ConflictException("No test in progress");
        }

        SeriousnessTestAttemptQuestion paperEntry = sessionQuestionRepository
            .findByUserIdAndQuestionIdInProgress(userId, request.questionId())
            .orElseThrow(() -> new NotFoundException("That question is not part of this test"));

        SeriousnessTestQuestion question = paperEntry.getQuestion();
        int selected = request.selectedOptionIndex();
        if (selected >= question.getOptions().size()) {
            throw new BadRequestException("That option does not exist for this question");
        }

        SeriousnessTestAttempt attempt = paperEntry.getAttempt();
        int points = question.getOptions().get(selected).points();
        answerRepository.upsert(UUID.randomUUID(), attempt.getId(), question.getId(), selected, points);

        int totalQuestions = attempts.stream().mapToInt(SeriousnessTestAttempt::getQuestionCount).sum();
        long answeredCount = attempts.stream()
            .mapToLong(a -> answerRepository.findByAttemptId(a.getId()).size())
            .sum();

        return new AnswerAcceptedResponse(
            (int) answeredCount,
            totalQuestions
        );
    }

    @Transactional
    public TestResultResponse submit(UUID userId) {
        userService.requireSelf(userId);
        List<SeriousnessTestAttempt> attempts = attemptRepository.findActiveAttemptsByUserId(userId);
        if (attempts.isEmpty()) {
            throw new ConflictException("This test was abandoned. Start a new one.");
        }
        Instant now = Instant.now();
        finalise(attempts, now);
        return result(userId);
    }

    @Transactional(readOnly = true)
    public TestResultResponse result(UUID userId) {
        return latestResult(userId);
    }

    @Transactional(readOnly = true)
    public TestResultResponse latestResult(UUID userId) {
        userService.requireSelf(userId);
        List<SeriousnessTestAttempt> submitted = attemptRepository.findSubmittedByUserIdNewestFirst(userId);
        if (submitted.isEmpty()) {
            throw new NotFoundException("You have not taken the test yet");
        }
        
        // Find the most recent submission timestamp
        Instant latestSubmit = submitted.get(0).getSubmittedAt();
        
        // Group all attempts submitted at the same time
        List<SeriousnessTestAttempt> latestBatch = submitted.stream()
            .filter(a -> a.getSubmittedAt().equals(latestSubmit))
            .toList();

        return buildResult(latestBatch);
    }



    /**
     * Splits the question total evenly across the chosen interests, giving the
     * remainder to the earlier ones. Insertion order is preserved so the client can
     * show its divider screen when the interest changes.
     */
    private Map<Interest, List<SeriousnessTestQuestion>> drawPaper(List<Interest> interests) {
        int total = properties.getSeriousnessTest().getTotalQuestions();
        int base = total / interests.size();
        int remainder = total % interests.size();

        Map<Interest, List<SeriousnessTestQuestion>> paper = new LinkedHashMap<>();
        for (int i = 0; i < interests.size(); i++) {
            Interest interest = interests.get(i);
            int wanted = base + (i < remainder ? 1 : 0);
            List<SeriousnessTestQuestion> drawn =
                questionRepository.pickRandomForInterest(interest.getId(), wanted);
            if (drawn.isEmpty()) {
                throw new ConflictException(
                    "The question bank for %s is not ready yet. Try again later."
                        .formatted(interest.getName()));
            }
            if (drawn.size() < wanted) {
                log.warn("Question bank for interest {} holds {} of the {} questions needed",
                    interest.getName(), drawn.size(), wanted);
            }
            paper.put(interest, drawn);
        }
        return paper;
    }

    /** Scores every attempt and closes it. */
    private void finalise(List<SeriousnessTestAttempt> attempts, Instant now) {
        LocalDate retakeDate = LocalDate.now(ZoneOffset.UTC)
            .plusDays(properties.getSeriousnessTest().getRetakeLockDays());

        for (SeriousnessTestAttempt attempt : attempts) {
            int earned = answerRepository.sumPointsEarnedByAttemptId(attempt.getId());
            attempt.setEarnedPoints(earned);
            attempt.setScore(percent(earned, attempt.getMaxPoints()));
            attempt.setLevel(SeriousnessLevel.fromScore(attempt.getScore()));
            attempt.setStatus(TestAttemptStatus.SUBMITTED);
            attempt.setSubmittedAt(now);
            attempt.setNextRetakeDate(retakeDate);
            attemptRepository.save(attempt);
        }
    }

    private TestResultResponse buildResult(List<SeriousnessTestAttempt> attempts) {
        int totalEarned = attempts.stream().mapToInt(SeriousnessTestAttempt::getEarnedPoints).sum();
        int totalMax = attempts.stream().mapToInt(SeriousnessTestAttempt::getMaxPoints).sum();
        int overallScore = percent(totalEarned, totalMax);
        SeriousnessLevel overallLevel = SeriousnessLevel.fromScore(overallScore);

        LocalDate nextRetake = attempts.stream()
            .map(SeriousnessTestAttempt::getNextRetakeDate)
            .filter(java.util.Objects::nonNull)
            .max(LocalDate::compareTo)
            .orElse(null);

        List<InterestResultResponse> perInterest = attempts.stream()
            .map(attempt -> new InterestResultResponse(
                attempt.getInterest().getId(),
                attempt.getInterest().getName(),
                attempt.getQuestionCount(),
                attempt.getEarnedPoints(),
                attempt.getMaxPoints(),
                attempt.getScore() == null ? 0 : attempt.getScore(),
                attempt.getLevel(),
                attempt.getLevel() == null ? null : attempt.getLevel().message(),
                attempt.getNextRetakeDate()
            ))
            .toList();

        Instant submittedAt = attempts.isEmpty() ? null : attempts.get(0).getSubmittedAt();

        return new TestResultResponse(
            submittedAt,
            false,
            overallScore,
            overallLevel,
            overallLevel.message(),
            nextRetake,
            perInterest
        );
    }

    private TestSessionResponse describe(UUID userId) {
        List<SeriousnessTestAttemptQuestion> paper = sessionQuestionRepository.findPaperByUserId(userId);
        
        int totalQuestions = paper.size();

        Map<UUID, Integer> selectedByQuestion = new HashMap<>();
        List<SeriousnessTestAttempt> attempts = attemptRepository.findActiveAttemptsByUserId(userId);
        for (SeriousnessTestAttempt attempt : attempts) {
            for (SeriousnessTestAnswer answer : answerRepository.findByAttemptId(attempt.getId())) {
                selectedByQuestion.put(answer.getQuestion().getId(), answer.getSelectedOptionIndex());
            }
        }

        List<TestQuestionResponse> questions = new ArrayList<>(paper.size());
        for (SeriousnessTestAttemptQuestion entry : paper) {
            SeriousnessTestQuestion question = entry.getQuestion();
            questions.add(new TestQuestionResponse(
                entry.getOrderIndex(),
                question.getId(),
                question.getInterest().getId(),
                question.getInterest().getName(),
                question.getQuestionText(),
                question.getOptions().stream().map(collzap.backend.models.QuestionOption::text).toList(),
                selectedByQuestion.get(question.getId())
            ));
        }

        return new TestSessionResponse(
            totalQuestions,
            selectedByQuestion.size(),
            questions
        );
    }

    private List<UserInterestSelection> longTermSelections(UUID userId) {
        return selectionRepository.findAllWithInterestByUserIdAndProjectType(userId, ProjectType.LONG_TERM);
    }

    private Optional<SeriousnessTestAttempt> latestSubmitted(UUID userId, UUID interestId) {
        return attemptRepository.findFirstByUserIdAndInterestIdAndStatusOrderBySubmittedAtDesc(
            userId, interestId, TestAttemptStatus.SUBMITTED);
    }

    static int percent(int correct, int total) {
        if (total <= 0) {
            return 0;
        }
        return (int) Math.round(100.0 * correct / total);
    }

    @Transactional
    public void emergencyReset(UUID userId) {
        userService.requireSelf(userId);
        attemptRepository.findActiveAttemptsByUserId(userId)
            .forEach(open -> {
                open.setStatus(TestAttemptStatus.ABANDONED);
                attemptRepository.save(open);
            });
    }
}
