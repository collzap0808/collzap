package collzap.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import collzap.backend.models.TaskBankItem;

public interface TaskBankItemRepository extends JpaRepository<TaskBankItem, UUID> {

    Optional<TaskBankItem> findByTaskBankIdAndDayIndex(UUID taskBankId, int dayIndex);

    List<TaskBankItem> findByTaskBankIdOrderByDayIndexAsc(UUID taskBankId);

    /** The bank's next day after {@code dayIndex}. Banks needn't start at day 1 (a "Month 2" bank starts at 31). */
    Optional<TaskBankItem> findFirstByTaskBankIdAndDayIndexGreaterThanOrderByDayIndexAsc(UUID taskBankId, int dayIndex);
}
