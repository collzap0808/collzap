package collzap.backend.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/** All Collzap-specific tunables, bound from the {@code collzap.*} namespace. */
@Getter
@Setter
@ConfigurationProperties(prefix = "collzap")
public class CollzapProperties {

    private Jwt jwt = new Jwt();
    private Otp otp = new Otp();
    private Mail mail = new Mail();
    private Admin admin = new Admin();
    private SeriousnessTest seriousnessTest = new SeriousnessTest();
    private Matching matching = new Matching();
    private Cors cors = new Cors();
    private Cloudinary cloudinary = new Cloudinary();
    private Analytics analytics = new Analytics();

    @Getter
    @Setter
    public static class Jwt {
        /**
         * HMAC-SHA signing key. Must be at least 32 characters. The default is a
         * development-only value and the app refuses to start with it when the
         * {@code prod} profile is active.
         */
        private String secret = "collzap-development-only-secret-change-me-in-production";
        private String issuer = "collzap";
        private Duration accessTokenTtl = Duration.ofHours(2);
        private Duration refreshTokenTtl = Duration.ofDays(30);
    }

    @Getter
    @Setter
    public static class Otp {
        private int length = 6;
        private Duration ttl = Duration.ofMinutes(10);
        /** Wrong guesses allowed before the code is burned. */
        private int maxAttempts = 5;
        /** Codes that may be requested per address inside {@link #rateLimitWindow}. */
        private int maxPerWindow = 5;
        private Duration rateLimitWindow = Duration.ofHours(1);
    }

    @Getter
    @Setter
    public static class Mail {
        /** Resend API key. When blank, OTP emails are logged instead of sent. */
        private String resendApiKey = "";
        private String fromAddress = "otp@collzap.com";
        private String fromName = "Collzap";
        private String apiUrl = "https://api.resend.com/emails";
        /** Logs the OTP at INFO. Handy locally, must stay false in production. */
        private boolean logCodes = false;
    }

    @Getter
    @Setter
    public static class Admin {
        /** Bootstrap operator, created on first startup if the table is empty. */
        private String bootstrapUsername = "admin";
        /** Blank generates and logs a random password once, instead of a fixed default. */
        private String bootstrapPassword = "";
        /** Demo colleges/interests/questions on an empty database. Off in production. */
        private boolean seedDemoData = true;
    }

    @Getter
    @Setter
    public static class SeriousnessTest {
        /** Total questions in one sitting, spread across the user's interests. */
        private int totalQuestions = 25;
        /** Silent background timer. Elapsing auto-submits whatever was answered. */
        private Duration duration = Duration.ofMinutes(20);
        private int retakeLockDays = 30;
    }

    @Getter
    @Setter
    public static class Matching {
        /** Cadence of the background sweep that drains the waiting queue. */
        private Duration sweepInterval = Duration.ofSeconds(30);
        /** Allow matching one seriousness level either side. */
        private boolean levelToleranceEnabled = true;
        /** Level assumed for short-term buddies, who do not sit the test. */
        private String shortTermDefaultLevel = "LEARNING";
        /**
         * Points a student needs before peer matching opens; until then they do
         * admin-reviewed solo tasks. Lowering it later unlocks people at once.
         */
        private int unlockPoints = 500;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://collzap.com",
            "https://www.collzap.com"
        );
    }

    @Getter
    @Setter
    public static class Cloudinary {
        private String cloudName = "";
        private String apiKey = "";
        private String apiSecret = "";
    }

    @Getter
    @Setter
    public static class Analytics {
        /** Numeric GA4 property ID (Admin, Property settings), not the G-XXXX measurement ID. */
        private String propertyId = "";
        /**
         * Base64 of the service-account JSON key that has Viewer access on the
         * property. When either value is blank the admin Analytics page says
         * "not configured" instead of failing.
         */
        private String credentialsBase64 = "";
    }
}
