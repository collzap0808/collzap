package collzap.backend.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.CollegeDtos.CollegeResponse;
import collzap.backend.dto.CommonDtos.PageResponse;
import collzap.backend.dto.CollegeDtos.CreateCollegeRequest;
import collzap.backend.dto.CollegeDtos.UpdateCollegeRequest;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.College;
import collzap.backend.repositories.CollegeRepository;
import collzap.backend.repositories.MatchGroupRepository;
import collzap.backend.repositories.UserRepository;

@Service
public class CollegeService {

    private final CollegeRepository collegeRepository;
    private final UserRepository userRepository;
    private final MatchGroupRepository matchGroupRepository;

    public CollegeService(
        CollegeRepository collegeRepository,
        UserRepository userRepository,
        MatchGroupRepository matchGroupRepository
    ) {
        this.collegeRepository = collegeRepository;
        this.userRepository = userRepository;
        this.matchGroupRepository = matchGroupRepository;
    }

    @Cacheable("colleges")
    @Transactional(readOnly = true)
    public List<CollegeResponse> listAll() {
        return collegeRepository.findAll().stream()
            .filter(College::isActive)
            .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
            .map(CollegeService::toResponse)
            .toList();
    }

    /**
     * The signup picker: every word typed must appear in the college's name, city
     * or email domain, so "iit mumbai", "pune symbiosis" or "iitb" all work.
     * Active colleges only, alphabetical, capped so a one-letter query stays cheap.
     */
    @Transactional(readOnly = true)
    public List<CollegeResponse> search(String query, int limit) {
        int size = Math.max(1, Math.min(limit, 50));
        Specification<College> spec = matching(query).and((root, q, cb) -> cb.isTrue(root.get("active")));
        return collegeRepository.findAll(spec, PageRequest.of(0, size, sortFor(query))).stream()
            .map(CollegeService::toResponse)
            .toList();
    }

    /** Admin list: every college (active or not), searchable the same way, one page at a time. */
    @Transactional(readOnly = true)
    public PageResponse<CollegeResponse> adminPage(String query, Pageable pageable) {
        Pageable sorted = PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100), sortFor(query));
        Page<College> page = collegeRepository.findAll(matching(query), sorted);
        return PageResponse.from(page, CollegeService::toResponse);
    }

    private static Sort byName() {
        return Sort.by(Sort.Order.asc("name").ignoreCase());
    }

    /** With a query the ranking is applied inside {@link #matching}; without one, plain A–Z. */
    private static Sort sortFor(String query) {
        return query == null || query.isBlank() ? byName() : Sort.unsorted();
    }

    private static String likeEscape(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static Specification<College> matching(String query) {
        List<String> words = new ArrayList<>();
        if (query != null) {
            for (String w : query.toLowerCase(Locale.ROOT).trim().split("[\\s,]+")) {
                if (!w.isBlank()) words.add(w);
            }
        }
        return (root, q, cb) -> {
            if (words.isEmpty()) {
                return cb.conjunction();
            }
            var haystack = cb.lower(cb.concat(cb.concat(cb.concat(root.get("name"), " "),
                cb.concat(cb.coalesce(root.get("city"), ""), " ")), root.get("emailDomain")));
            // Best matches first, so typing "vel" lists colleges that start with "Vel"
            // before ones that merely contain it somewhere ("deVELopment"):
            //   0 name starts with what was typed      ("Vellore Institute…")
            //   1 email domain starts with it          ("vit.ac.in" for "vit", "iitb.ac.in")
            //   2 a word in the name starts with it    ("… College, Vellore")
            //   3 city starts with it                  (city Vellore)
            //   4 anywhere else
            // then A–Z within each group. Not applied to the count query.
            if (Long.class != q.getResultType()) {
                String phrase = likeEscape(String.join(" ", words));
                var name = cb.lower(root.get("name"));
                var rank = cb.selectCase()
                    .when(cb.like(name, phrase + "%", '\\'), 0)
                    .when(cb.like(cb.lower(root.get("emailDomain")), phrase + "%", '\\'), 1)
                    .when(cb.like(name, "% " + phrase + "%", '\\'), 2)
                    .when(cb.like(cb.lower(cb.coalesce(root.get("city"), "")), phrase + "%", '\\'), 3)
                    .otherwise(4);
                q.orderBy(cb.asc(rank), cb.asc(name));
            }
            return cb.and(words.stream()
                .map(w -> cb.like(haystack, "%" + likeEscape(w) + "%", '\\'))
                .toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    @Transactional(readOnly = true)
    public College getById(UUID id) {
        return collegeRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("College not found"));
    }

    /**
     * Resolves the college that owns an email address. This is the gate that keeps
     * signups to recognised college domains.
     */
    @Cacheable(value = "collegeByDomain", key = "#email.trim().toLowerCase()")
    @Transactional(readOnly = true)
    public College requireByEmail(String email) {
        String domain = extractDomain(email);
        return collegeRepository.findByEmailDomainIgnoreCase(domain)
            .filter(College::isActive)
            .orElseThrow(() -> new BadRequestException(
                "%s is not a recognised college email domain yet. Contact support to add your college."
                    .formatted(domain)));
    }

    @CacheEvict(value = {"colleges", "collegeByDomain"}, allEntries = true)
    @Transactional
    public CollegeResponse create(CreateCollegeRequest request) {
        String domain = normalizeDomain(request.emailDomain());
        if (collegeRepository.existsByEmailDomainIgnoreCase(domain)) {
            throw new ConflictException("A college with that email domain already exists");
        }
        if (collegeRepository.findByNameIgnoreCase(request.name().trim()).isPresent()) {
            throw new ConflictException("A college with that name already exists");
        }
        College college = new College(request.name().trim(), domain, trimToNull(request.city()));
        return toResponse(collegeRepository.save(college));
    }

    @CacheEvict(value = {"colleges", "collegeByDomain"}, allEntries = true)
    @Transactional
    public CollegeResponse update(UUID id, UpdateCollegeRequest request) {
        College college = getById(id);
        String domain = normalizeDomain(request.emailDomain());
        String name = request.name().trim();

        if (!domain.equalsIgnoreCase(college.getEmailDomain())
            && collegeRepository.existsByEmailDomainIgnoreCase(domain)) {
            throw new ConflictException("A college with that email domain already exists");
        }
        if (!name.equalsIgnoreCase(college.getName())
            && collegeRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("A college with that name already exists");
        }

        college.setName(name);
        college.setEmailDomain(domain);
        college.setCity(trimToNull(request.city()));
        return toResponse(collegeRepository.save(college));
    }

    /**
     * Blocked outright if any student or match group already references this
     * college — those aren't safe to cascade silently, same rule as deleting an
     * interest. A mistakenly-added college with nobody enrolled yet can go
     * straight through.
     */
    @CacheEvict(value = {"colleges", "collegeByDomain"}, allEntries = true)
    @Transactional
    public void delete(UUID id) {
        College college = getById(id);
        long userCount = userRepository.countByCollegeId(id);
        long matchCount = matchGroupRepository.countByCollegeId(id);
        if (userCount > 0 || matchCount > 0) {
            List<String> reasons = new java.util.ArrayList<>();
            if (userCount > 0) reasons.add(userCount + " student(s)");
            if (matchCount > 0) reasons.add(matchCount + " match group(s)");
            throw new ConflictException(
                "Cannot delete \"" + college.getName() + "\": " + String.join(", ", reasons) + " still reference it"
            );
        }
        collegeRepository.delete(college);
    }

    static String extractDomain(String email) {
        String normalized = OtpService.normalize(email);
        int at = normalized.lastIndexOf('@');
        if (at < 0 || at == normalized.length() - 1) {
            throw new BadRequestException("Enter a valid college email address");
        }
        return normalized.substring(at + 1);
    }

    private static String normalizeDomain(String domain) {
        String normalized = OtpService.normalize(domain);
        if (normalized.startsWith("@")) {
            normalized = normalized.substring(1);
        }
        if (normalized.isBlank() || !normalized.contains(".")) {
            throw new BadRequestException("Enter a valid email domain, for example iitb.ac.in");
        }
        return normalized;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static CollegeResponse toResponse(College college) {
        return new CollegeResponse(
            college.getId(),
            college.getName(),
            college.getEmailDomain(),
            college.getCity()
        );
    }
}
