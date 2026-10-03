package collzap.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * The ONE place that knows where student points live.
 * Defaults match a table  user_task_stats(user_id, total_points).
 * If your table or columns are named differently, set these in application-local.properties:
 *   collzap.certificate.points-table=...
 *   collzap.certificate.points-user-column=...
 *   collzap.certificate.points-column=...
 */
@Service
public class CertificatePointsService {

    private static final Pattern IDENT = Pattern.compile("[a-z_][a-z0-9_]*");

    private final JdbcTemplate jdbc;
    private final String pointsOfSql;
    private final String countAtLeastSql;

    public CertificatePointsService(
            JdbcTemplate jdbc,
            @Value("${collzap.certificate.points-table:user_task_stats}") String table,
            @Value("${collzap.certificate.points-user-column:user_id}") String userCol,
            @Value("${collzap.certificate.points-column:total_points}") String pointsCol) {
        for (String s : new String[] {table, userCol, pointsCol}) {
            if (!IDENT.matcher(s).matches()) {
                throw new IllegalArgumentException("Invalid SQL identifier in certificate points config: " + s);
            }
        }
        this.jdbc = jdbc;
        this.pointsOfSql = "SELECT COALESCE(SUM(%s), 0) FROM %s WHERE %s = ?".formatted(pointsCol, table, userCol);
        this.countAtLeastSql =
                "SELECT COUNT(*) FROM (SELECT %s AS uid, SUM(%s) AS pts FROM %s GROUP BY %s) t WHERE t.pts >= ?"
                        .formatted(userCol, pointsCol, table, userCol);
    }

    public long pointsOf(UUID userId) {
        Long v = jdbc.queryForObject(pointsOfSql, Long.class, userId);
        return v == null ? 0 : v;
    }

    public long countAtLeast(long points) {
        Long v = jdbc.queryForObject(countAtLeastSql, Long.class, points);
        return v == null ? 0 : v;
    }
}
