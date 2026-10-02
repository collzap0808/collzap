package collzap.backend.exception;

import org.springframework.http.HttpStatus;

/** Peer matching is locked until the student reaches the unlock points (Sprout by default). */
public class MatchingLockedException extends ApiException {

    public MatchingLockedException(String message) {
        super(HttpStatus.FORBIDDEN, "matching_locked", message);
    }
}
