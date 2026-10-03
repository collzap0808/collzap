package collzap.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.google.analytics.data.v1beta.BetaAnalyticsDataClient;
import com.google.analytics.data.v1beta.BetaAnalyticsDataSettings;
import com.google.analytics.data.v1beta.DateRange;
import com.google.analytics.data.v1beta.Dimension;
import com.google.analytics.data.v1beta.Filter;
import com.google.analytics.data.v1beta.FilterExpression;
import com.google.analytics.data.v1beta.Metric;
import com.google.analytics.data.v1beta.Row;
import com.google.analytics.data.v1beta.RunReportRequest;
import com.google.analytics.data.v1beta.RunReportResponse;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;

import collzap.backend.config.CollzapProperties;
import collzap.backend.dto.AdminDtos.LandingAnalyticsResponse;
import collzap.backend.dto.AdminDtos.LandingVisitDay;
import collzap.backend.exception.ApiException;
import jakarta.annotation.PreDestroy;

/**
 * Landing-page visitors per day, read from Google Analytics 4 through the Data
 * API. The frontend (react-ga4) sends a page view for "/" only, and every
 * report here is filtered to that path as well, so app pages never count.
 *
 * <p>
 * Results are kept in memory for ten minutes: GA itself only refreshes a few
 * times an hour, and the Data API has a per-property quota.
 */
@Service
public class LandingAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(LandingAnalyticsService.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter GA_DATE = DateTimeFormatter.BASIC_ISO_DATE;
    private static final String LANDING_PATH = "/";

    private final CollzapProperties.Analytics config;
    private final Map<Integer, Cached> cache = new ConcurrentHashMap<>();
    private volatile BetaAnalyticsDataClient client;

    private record Cached(LandingAnalyticsResponse value, Instant at) {
    }

    public LandingAnalyticsService(CollzapProperties properties) {
        this.config = properties.getAnalytics();
    }

    public LandingAnalyticsResponse landingVisits(int days) {
        int range = Math.clamp(days, 1, 365);
        if (!isConfigured()) {
            return new LandingAnalyticsResponse(false, range, 0, 0, 0, List.of());
        }
        Cached hit = cache.get(range);
        if (hit != null && hit.at().plus(CACHE_TTL).isAfter(Instant.now())) {
            return hit.value();
        }
        LandingAnalyticsResponse fresh = fetch(range);
        cache.put(range, new Cached(fresh, Instant.now()));
        return fresh;
    }

    private boolean isConfigured() {
        return !config.getPropertyId().isBlank() && !config.getCredentialsBase64().isBlank();
    }

    private LandingAnalyticsResponse fetch(int days) {
        DateRange dates = DateRange.newBuilder()
            .setStartDate((days - 1) + "daysAgo")
            .setEndDate("today")
            .build();
        try {
            RunReportResponse daily = client().runReport(baseRequest(dates)
                .addDimensions(Dimension.newBuilder().setName("date"))
                .build());
            // A second request without the date dimension: unique visitors across the range.
            RunReportResponse total = client().runReport(baseRequest(dates).build());

            Map<String, Row> byDate = new HashMap<>();
            for (Row row : daily.getRowsList()) {
                byDate.put(row.getDimensionValues(0).getValue(), row);
            }
            // Every day in the range, oldest first, with zeros where GA has no row.
            LocalDate today = LocalDate.now(ZONE);
            List<LandingVisitDay> out = new ArrayList<>(days);
            for (int i = days - 1; i >= 0; i--) {
                LocalDate day = today.minusDays(i);
                Row row = byDate.get(day.format(GA_DATE));
                out.add(new LandingVisitDay(day.toString(), metric(row, 0), metric(row, 1), metric(row, 2)));
            }
            Row sum = total.getRowsCount() > 0 ? total.getRows(0) : null;
            return new LandingAnalyticsResponse(true, days, metric(sum, 0), metric(sum, 1), metric(sum, 2), out);
        } catch (ApiException e) {
            throw e;
        } catch (RuntimeException e) {
            log.warn("Google Analytics report failed", e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ANALYTICS_UNAVAILABLE",
                "Could not load data from Google Analytics. Check the property ID and service-account access.");
        }
    }

    private RunReportRequest.Builder baseRequest(DateRange dates) {
        return RunReportRequest.newBuilder()
            .setProperty("properties/" + config.getPropertyId().trim())
            .addDateRanges(dates)
            .addMetrics(Metric.newBuilder().setName("activeUsers"))
            .addMetrics(Metric.newBuilder().setName("newUsers"))
            .addMetrics(Metric.newBuilder().setName("screenPageViews"))
            .setDimensionFilter(FilterExpression.newBuilder()
                .setFilter(Filter.newBuilder()
                    .setFieldName("pagePath")
                    .setStringFilter(Filter.StringFilter.newBuilder()
                        .setMatchType(Filter.StringFilter.MatchType.EXACT)
                        .setValue(LANDING_PATH))));
    }

    private static long metric(Row row, int index) {
        if (row == null) {
            return 0;
        }
        try {
            return Long.parseLong(row.getMetricValues(index).getValue());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** Built on first use, so a missing or bad key never stops the app from starting. */
    private BetaAnalyticsDataClient client() {
        BetaAnalyticsDataClient c = client;
        if (c != null) {
            return c;
        }
        synchronized (this) {
            if (client == null) {
                try {
                    byte[] json = Base64.getDecoder().decode(config.getCredentialsBase64().trim());
                    GoogleCredentials credentials = GoogleCredentials
                        .fromStream(new ByteArrayInputStream(json))
                        .createScoped("https://www.googleapis.com/auth/analytics.readonly");
                    // HTTP/JSON transport: lighter than gRPC for a few requests an hour.
                    BetaAnalyticsDataSettings settings = BetaAnalyticsDataSettings.newHttpJsonBuilder()
                        .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                        .build();
                    client = BetaAnalyticsDataClient.create(settings);
                } catch (IOException | IllegalArgumentException e) {
                    log.warn("Google Analytics credentials could not be loaded", e);
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "ANALYTICS_CREDENTIALS",
                        "The Google Analytics service-account key is invalid.");
                }
            }
            return client;
        }
    }

    @PreDestroy
    void close() {
        if (client != null) {
            client.close();
        }
    }
}
