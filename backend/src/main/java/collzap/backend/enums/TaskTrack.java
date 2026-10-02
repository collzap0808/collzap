package collzap.backend.enums;

/**
 * Who a task bank is written for. GROUP banks feed matched groups (peer-reviewed);
 * SOLO banks feed students who haven't unlocked matching yet (admin-reviewed).
 */
public enum TaskTrack {
    GROUP,
    SOLO
}
