package collzap.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.TaskBankDtos.DailyTaskItemDto;
import collzap.backend.dto.TaskBankDtos.TaskBankItemResponse;
import collzap.backend.dto.TaskBankDtos.TaskBankResponse;
import collzap.backend.dto.TaskBankDtos.UploadTaskBankRequest;
import collzap.backend.enums.TaskTrack;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.Interest;
import collzap.backend.models.TaskBank;
import collzap.backend.models.TaskBankItem;
import collzap.backend.repositories.InterestRepository;
import collzap.backend.repositories.TaskBankItemRepository;
import collzap.backend.repositories.TaskBankRepository;

/**
 * Admin management of daily task banks. A bank is immutable once created —
 * "editing" is uploading a new one, which deactivates whichever bank was
 * previously active for that interest. Existing {@code GroupTaskProgress} rows
 * keep the bank they already started on, so replacing a bank never shifts the
 * day-mapping of a group already mid-sequence.
 */
@Service
public class TaskBankService {

    private final TaskBankRepository taskBankRepository;
    private final TaskBankItemRepository taskBankItemRepository;
    private final InterestRepository interestRepository;

    public TaskBankService(
        TaskBankRepository taskBankRepository,
        TaskBankItemRepository taskBankItemRepository,
        InterestRepository interestRepository
    ) {
        this.taskBankRepository = taskBankRepository;
        this.taskBankItemRepository = taskBankItemRepository;
        this.interestRepository = interestRepository;
    }

    @Transactional
    public TaskBankResponse upload(UploadTaskBankRequest request) {
        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> new NotFoundException("Interest not found"));

        long distinctDays = request.tasks().stream().map(DailyTaskItemDto::dayIndex).distinct().count();
        if (distinctDays != request.tasks().size()) {
            throw new BadRequestException("Two tasks share the same day number — each day must be unique");
        }

        // One live bank per (interest, track): a new solo bank replaces the old solo
        // bank and leaves the group bank alone, and vice versa.
        TaskTrack track = request.track() == null ? TaskTrack.GROUP : request.track();
        (track == TaskTrack.SOLO
            ? taskBankRepository.findActiveSoloBank(interest.getId())
            : taskBankRepository.findActiveGroupBank(interest.getId()))
            .ifPresent(existing -> {
                existing.setActive(false);
                taskBankRepository.save(existing);
            });

        TaskBank newBank = new TaskBank(interest, request.title().trim());
        newBank.setTrack(track);
        TaskBank bank = taskBankRepository.save(newBank);
        for (DailyTaskItemDto task : request.tasks()) {
            taskBankItemRepository.save(new TaskBankItem(
                bank,
                task.dayIndex(),
                task.title().trim(),
                trimToNull(task.learnResource()),
                task.description().trim(),
                trimToNull(task.submissionInstructions()),
                task.points(),
                trimToNull(task.durationLabel())
            ));
        }
        return toResponse(bank, request.tasks().size());
    }

    @Transactional(readOnly = true)
    public List<TaskBankResponse> listForInterest(UUID interestId) {
        return taskBankRepository.findAllByInterestIdOrderByCreatedAtDesc(interestId).stream()
            .map(bank -> toResponse(bank, taskBankItemRepository.findByTaskBankIdOrderByDayIndexAsc(bank.getId()).size()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskBankResponse> listAll() {
        return taskBankRepository.findAllWithInterest().stream()
            .map(bank -> toResponse(bank, taskBankItemRepository.findByTaskBankIdOrderByDayIndexAsc(bank.getId()).size()))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskBankItemResponse> items(UUID taskBankId) {
        return taskBankItemRepository.findByTaskBankIdOrderByDayIndexAsc(taskBankId).stream()
            .map(TaskBankService::toItemResponse)
            .toList();
    }

    /** Turns a bank off without replacing it — new groups get no bank for this interest until one is uploaded. */
    @Transactional
    public void deactivate(UUID taskBankId) {
        TaskBank bank = taskBankRepository.findById(taskBankId)
            .orElseThrow(() -> new NotFoundException("Task bank not found"));
        bank.setActive(false);
        taskBankRepository.save(bank);
    }

    private static TaskBankResponse toResponse(TaskBank bank, int itemCount) {
        return new TaskBankResponse(
            bank.getId(),
            bank.getInterest().getId(),
            bank.getInterest().getName(),
            bank.getTitle(),
            bank.isActive(),
            itemCount,
            bank.getCreatedAt(),
            bank.track()
        );
    }

    private static TaskBankItemResponse toItemResponse(TaskBankItem item) {
        return new TaskBankItemResponse(
            item.getId(),
            item.getDayIndex(),
            item.getTitle(),
            item.getLearnResource(),
            item.getDescription(),
            item.getSubmissionInstructions(),
            item.getPoints(),
            item.getDurationLabel()
        );
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
