import { Helmet } from 'react-helmet-async';
import Nav from './landing/sections/Nav';
import Footer from './landing/sections/Footer';

/**
 * One correction against the source draft, for consistency with
 * PrivacyPage.jsx's section 9: "within 30 days" became "immediately" in
 * section 12.1 — UserService.deleteAccount() is a single synchronous hard
 * delete, so the two legal documents should not make different claims about
 * the same fact.
 *
 * Section 4.2's "manual verification within 24 hours" is left as written —
 * that's an operational commitment, not something the code enforces or
 * contradicts, so it isn't this file's call to soften.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Helmet>
        <title>Terms and Conditions · CollZap</title>
        <meta
          name="description"
          content="The terms that govern using CollZap — eligibility, account verification, acceptable conduct, and how matching and chat work."
        />
        <link rel="canonical" href="https://collzap.com/terms" />
        <meta property="og:url" content="https://collzap.com/terms" />
        <meta property="og:title" content="Terms and Conditions · CollZap" />
      </Helmet>

      <Nav />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:px-8 sm:pt-40">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-mute">
          <span className="grad-brand h-1 w-6 rounded-full" />
          Legal
        </p>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tightest text-ink sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-sm text-mute">Last updated: September 2026 &middot; collzap.com</p>

        <div className="prose-legal mt-12 space-y-10">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using CollZap at collzap.com, you agree to be bound by these Terms and
              Conditions. If you do not agree to these terms, please do not use our platform.
            </p>
            <p>
              These Terms apply to all users of CollZap including students, visitors, and any other
              persons who access the platform.
            </p>
          </section>

          <section>
            <h2>2. About CollZap</h2>
            <p>
              CollZap is India&rsquo;s first campus-based peer matching platform. It connects college
              students with verified, serious, like-minded peers within their own campus &mdash;
              matched by interest and knowledge level.
            </p>
            <p>CollZap is operated by Nitish Kumar, Founder &amp; CEO, based in Jind, Haryana, India.</p>
          </section>

          <section>
            <h2>3. Eligibility</h2>
            <p>To use CollZap, you must:</p>
            <ul>
              <li>Be a current student enrolled at a recognized college or university in India</li>
              <li>Be 17 years of age or older</li>
              <li>Have a valid college email address or college identity document for verification</li>
              <li>Agree to these Terms and Conditions and our Privacy Policy</li>
            </ul>
            <p>By creating an account, you confirm that you meet these eligibility requirements.</p>
          </section>

          <section>
            <h2>4. Account Registration and Verification</h2>
            <h3>4.1 Account creation</h3>
            <p>
              You must provide accurate, complete, and current information when creating your
              account. You are responsible for maintaining the confidentiality of your login
              credentials and for all activity that occurs under your account.
            </p>
            <h3>4.2 College verification</h3>
            <p>CollZap requires all users to verify their college enrollment through:</p>
            <ul>
              <li>A valid college email address (OTP verification), or</li>
              <li>Upload of a college ID card or fee slip (manual verification within 24 hours)</li>
            </ul>
            <p>
              Providing false or misleading information during verification is strictly prohibited
              and will result in immediate account termination.
            </p>
            <h3>4.3 One account per person</h3>
            <p>Each user may maintain only one active account on CollZap. Creating multiple accounts is prohibited.</p>
          </section>

          <section>
            <h2>5. User Conduct</h2>
            <p>By using CollZap, you agree to:</p>
            <ul>
              <li>Use the platform only for lawful purposes</li>
              <li>Treat all other users with respect and courtesy</li>
              <li>Not harass, bully, threaten, or intimidate any other user</li>
              <li>Not share, post, or transmit any content that is offensive, obscene, defamatory, or harmful</li>
              <li>Not misrepresent your identity, interests, or seriousness level</li>
              <li>Not use CollZap for commercial solicitation, spam, or promotional purposes</li>
              <li>Not attempt to access, scrape, or extract data from CollZap through unauthorized means</li>
              <li>Not use CollZap to collect personal information of other users for unauthorized purposes</li>
              <li>Promptly report any abuse, harassment, or suspicious activity to CollZap</li>
            </ul>
          </section>

          <section>
            <h2>6. Matching and Chat</h2>
            <h3>6.1 Matching</h3>
            <p>
              CollZap&rsquo;s matching algorithm pairs users based on college, interest, seriousness
              level, and connection type preference. We do not guarantee any specific match outcome,
              response time, or number of matches.
            </p>
            <h3>6.2 Chat</h3>
            <p>
              Chat between matched users is a feature provided to facilitate genuine peer
              connections. Users are responsible for the content of their own messages. CollZap is
              not responsible for the content of messages exchanged between users.
            </p>
            <h3>6.3 Meeting in person</h3>
            <p>
              CollZap encourages users to meet peers on campus. When doing so, exercise the same
              caution you would with any new person you meet.
            </p>
          </section>

          <section>
            <h2>7. Content and Intellectual Property</h2>
            <h3>7.1 Your content</h3>
            <p>
              You retain ownership of any content you submit to CollZap &mdash; including profile
              information, story prompts, and messages. By submitting content, you grant CollZap a
              non-exclusive, royalty-free license to use, display, and process that content for the
              purpose of providing our services.
            </p>
            <h3>7.2 CollZap&rsquo;s content</h3>
            <p>
              All other content on CollZap &mdash; including but not limited to the platform design,
              matching algorithm, seriousness assessment questions, brand identity, and written
              content &mdash; is the intellectual property of CollZap and may not be copied,
              reproduced, or used without written permission.
            </p>
          </section>

          <section>
            <h2>8. Prohibited Activities</h2>
            <p>The following are strictly prohibited on CollZap:</p>
            <ul>
              <li>Impersonating another person or creating a false identity</li>
              <li>Uploading fake college documents for verification</li>
              <li>Sharing another user&rsquo;s personal information without their consent</li>
              <li>Using the platform to solicit money, products, or services</li>
              <li>Posting or sharing illegal, obscene, or harmful content</li>
              <li>Attempting to hack, disrupt, or interfere with the platform</li>
              <li>Creating bots, automated accounts, or scraping tools</li>
              <li>Using CollZap to promote or recruit for competing platforms</li>
            </ul>
            <p>
              Violation of any prohibited activity may result in immediate account suspension or
              termination and legal action where appropriate.
            </p>
          </section>

          <section>
            <h2>9. Reporting and Moderation</h2>
            <p>
              CollZap provides a reporting mechanism for users to flag inappropriate behavior. We
              review all reports and take appropriate action which may include:
            </p>
            <ul>
              <li>Warning the reported user</li>
              <li>Temporary suspension of the reported user&rsquo;s account</li>
              <li>Permanent termination of the reported user&rsquo;s account</li>
            </ul>
            <p>
              CollZap reserves the right to remove any content or suspend any account at our sole
              discretion if we determine it violates these Terms.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              CollZap is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, either express or implied. We do not warrant that:
            </p>
            <ul>
              <li>The platform will be error-free, uninterrupted, or secure at all times</li>
              <li>Any specific match will be found or will result in a successful peer relationship</li>
              <li>The information provided by other users is accurate or complete</li>
            </ul>
            <p>Use of CollZap is at your own risk.</p>
          </section>

          <section>
            <h2>11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CollZap and its founder shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from your
              use of the platform &mdash; including but not limited to damages from interactions with
              other users, data loss, or platform unavailability.
            </p>
            <p>
              CollZap&rsquo;s total liability to any user for any claim arising from use of the
              platform shall not exceed the amount paid by that user to CollZap in the preceding 12
              months.
            </p>
          </section>

          <section>
            <h2>12. Termination</h2>
            <h3>12.1 By you</h3>
            <p>
              You may delete your account at any time through the platform settings. Upon deletion,
              your profile and personal data are permanently deleted immediately.
            </p>
            <h3>12.2 By CollZap</h3>
            <p>
              CollZap reserves the right to suspend or terminate your account at any time without
              notice if you violate these Terms, engage in prohibited activities, or for any other
              reason at our sole discretion.
            </p>
          </section>

          <section>
            <h2>13. Changes to Terms</h2>
            <p>
              We may update these Terms and Conditions from time to time. When we do, we will update
              the &ldquo;Last Updated&rdquo; date and notify active users by email. Continued use of
              CollZap after any changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2>14. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the
              laws of India. Any disputes arising from these Terms shall be subject to the
              jurisdiction of courts in Haryana, India.
            </p>
          </section>

          <section>
            <h2>15. Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions, please contact us:</p>
            <div className="mt-4 rounded-lg border border-line bg-surface p-5 text-sm not-prose">
              <p className="font-semibold text-ink">Nitish Kumar</p>
              <p className="text-mute">Founder &amp; CEO, CollZap</p>
              <p className="mt-2">
                <a href="mailto:nitishkumar@collzap.com" className="text-accent-700 underline decoration-accent-300 underline-offset-4 hover:text-accent-800">
                  nitishkumar@collzap.com
                </a>
              </p>
              <p className="text-mute">collzap.com</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
