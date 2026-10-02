package collzap.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * The few schema changes {@code ddl-auto=update} cannot make on its own.
 *
 * <p>Hibernate adds a CHECK constraint listing every enum value when it first
 * creates an {@code @Enumerated(STRING)} column, and never updates it. Adding a
 * {@code NotificationType} value would then make every insert of that type fail
 * on an existing database. Dropping the constraint leaves the column as plain
 * varchar, which the enum mapping already guards on the Java side. Idempotent.
 */
@Component
public class SchemaFixups implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixups.class);

    private final JdbcTemplate jdbc;

    public SchemaFixups(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
        } catch (RuntimeException ex) {
            log.warn("Could not drop notifications_type_check; new notification types may fail to save", ex);
        }
    }
}
