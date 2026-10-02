/**
 * Blog content.
 *
 * Deliberately plain ESM with no JSX, no asset imports and no `import.meta.env`
 * — `scripts/prerender.mjs` imports this file directly in plain Node to build
 * its route list and the sitemap, so the app and the build can never disagree
 * about which posts exist. Keep it that way.
 *
 * Body is structured blocks rather than a markdown string: no parser to own,
 * and the semantic HTML each post produces is explicit, which is the whole
 * point of publishing these.
 *
 *   { t: 'p',  x }            paragraph
 *   { t: 'h2', x }            section heading
 *   { t: 'h3', x }            sub-heading
 *   { t: 'ul', items: [] }    bullet list
 *   { t: 'ol', items: [] }    numbered list
 *   { t: 'quote', x }         pull quote
 */

export const BLOG_BASE = '/blog';

const collzapIntro =
  'CollZap is built around exactly this problem — it matches verified students inside the same college on shared interests, goals and how seriously they are approaching them.';

export const POSTS = [
  {
    slug: 'find-your-circle-in-college',
    title: 'CollZap: Helping College Students Find Their Right Circle, Build Connections and Grow Together',
    description:
      'College is full of people, but finding the right people is hard. How CollZap helps students discover peers inside their own college who share their interests, goals and mindset.',
    date: '2026-09-17',
    readingMinutes: 9,
    tags: ['CollZap', 'Student networking'],
    blocks: [
      { t: 'p', x: 'College is full of people, but finding the right people can be difficult.' },
      {
        t: 'p',
        x: 'College life is one of the most important phases of a student’s journey. Students meet new people, attend classes, join clubs, learn new skills and explore different career opportunities.',
      },
      {
        t: 'p',
        x: 'However, many students still struggle to find people who share the same interests, goals and mindset.',
      },
      {
        t: 'p',
        x: 'One student may be interested in building a startup. Another may want to learn coding. Someone may be passionate about content creation, while another student may be searching for a serious study partner or project teammate.',
      },
      {
        t: 'p',
        x: 'Most of the time, students make friends because they sit in the same classroom, live in the same hostel or belong to the same group. But these connections are not always based on shared interests or future goals.',
      },
      { t: 'p', x: 'This is where CollZap comes in.' },

      { t: 'h2', x: 'What is CollZap?' },
      {
        t: 'p',
        x: 'CollZap is a student-focused platform that helps college students find like-minded people from their own college or university.',
      },
      { t: 'quote', x: 'Find Your Circle Before College Passes You By.' },
      { t: 'p', x: 'CollZap helps students discover people who share similar:' },
      {
        t: 'ul',
        items: [
          'Interests',
          'Skills',
          'Goals and ambitions',
          'Learning mindset',
          'Career interests',
          'Startup interests',
          'Personal growth mindset',
        ],
      },
      {
        t: 'p',
        x: 'Instead of randomly connecting with people, students can use CollZap to discover meaningful connections based on what they actually want to learn, build or achieve.',
      },
      {
        t: 'p',
        x: 'Whether a student wants to find a project partner, study partner, co-founder, creator, developer or a group of motivated friends, CollZap is designed to make that process easier.',
      },

      { t: 'h2', x: 'Why finding the right circle matters in college' },
      {
        t: 'p',
        x: 'The people around us can influence our learning, confidence, habits and future opportunities.',
      },
      {
        t: 'p',
        x: 'A student who wants to learn coding may progress faster when they have a coding partner. A student who wants to build a startup may need a designer, developer or marketing person. A student preparing for competitive exams may need a focused study group.',
      },

      { t: 'h3', x: '1. Learn new skills' },
      {
        t: 'p',
        x: 'Students can connect with others who are interested in learning the same skills, such as coding and development, digital marketing, design, public speaking, finance, entrepreneurship, content creation, communication, leadership, or research and innovation.',
      },
      { t: 'p', x: 'Learning with the right people can make the process more engaging and consistent.' },

      { t: 'h3', x: '2. Find project partners' },
      { t: 'p', x: 'Many students have project ideas but struggle to find the right teammates.' },
      {
        t: 'ul',
        items: [
          'A developer may need a designer.',
          'A founder may need a marketing partner.',
          'A content creator may need a video editor.',
          'A researcher may need someone with similar interests.',
          'A business student may need a technical co-founder.',
        ],
      },
      {
        t: 'p',
        x: 'CollZap helps students discover people from their campus who may be interested in working together.',
      },

      { t: 'h3', x: '3. Build startups and businesses' },
      { t: 'p', x: 'College is a great time to explore entrepreneurship.' },
      {
        t: 'p',
        x: 'Many students have ideas but do not know where to begin. They may need people who can help with product development, marketing, sales, research, design, technology, operations or business strategy.',
      },
      {
        t: 'p',
        x: 'Through student networking and collaboration, students can find people who share their entrepreneurial interests and want to build something together.',
      },

      { t: 'h3', x: '4. Create a focused study circle' },
      { t: 'p', x: 'Not every student enjoys studying alone.' },
      {
        t: 'p',
        x: 'Some students prefer learning with a small group of serious and motivated people. CollZap can help students find peers interested in similar subjects, exams or learning goals. A focused college student community can help students exchange knowledge, discuss problems and stay motivated.',
      },

      { t: 'h3', x: '5. Make meaningful friendships' },
      { t: 'p', x: 'College friendships should not only be based on location or classroom seating.' },
      {
        t: 'p',
        x: 'Students may find stronger connections when they share similar interests, values and goals. CollZap focuses on helping students discover meaningful connections in college, rather than simply collecting followers or joining random groups.',
      },

      { t: 'h2', x: 'How does CollZap work?' },
      { t: 'p', x: 'CollZap is designed to make student discovery simple and relevant.' },

      { t: 'h3', x: 'Step 1: Discover students from your college' },
      {
        t: 'p',
        x: 'Students can discover people from their own college or university. This helps make connections more relevant because students belong to the same campus environment.',
      },

      { t: 'h3', x: 'Step 2: Select your interests' },
      {
        t: 'p',
        x: 'Students can choose areas they are interested in — startups, coding, business, content creation, sports, design, music, reading, public speaking, learning or personal development. These interests help create a better understanding of what students want to explore.',
      },

      { t: 'h3', x: 'Step 3: Share your goals and intent' },
      { t: 'p', x: 'Every student has a different reason for connecting.' },
      {
        t: 'p',
        x: 'Some students want friendship, some want learning partners, while others want to build projects or startups. CollZap focuses on intent-based connections, helping students connect according to their interests and goals.',
      },

      { t: 'h3', x: 'Step 4: Choose your connection type' },
      { t: 'p', x: 'Students may want to connect in different ways:' },
      {
        t: 'ul',
        items: [
          'One-to-one connection',
          'Small group',
          'Project team',
          'Study circle',
          'Interest-based community',
          'Startup or business team',
        ],
      },
      {
        t: 'p',
        x: 'This gives students more flexibility to build the type of circle they are comfortable with.',
      },

      { t: 'h3', x: 'Step 5: Connect and grow together' },
      {
        t: 'p',
        x: 'After discovering relevant people, students can connect, communicate and explore opportunities together. The goal is to help students move from “I want to learn or build something” to “let’s find the right people and do it together”.',
      },

      { t: 'h2', x: 'What makes CollZap different?' },
      {
        t: 'p',
        x: 'There are already many social media and messaging platforms available today. However, most of them are not specifically designed to help students find the right people inside their own college.',
      },
      {
        t: 'p',
        x: 'Traditional social media is mainly designed for content, entertainment and followers, so finding a serious project partner or study circle can be difficult. Group chats are useful for communication, but many groups become crowded, inactive or unrelated to a student’s actual interests. Professional networking platforms are useful for career connections, but they may not focus on everyday college friendships, student communities and campus-based collaboration.',
      },
      { t: 'p', x: 'CollZap focuses on:' },
      {
        t: 'ul',
        items: [
          'College-specific connections',
          'Interest-based student discovery',
          'Intent-based matching',
          'Student collaboration',
          'Project and startup teams',
          'Learning and growth circles',
          'Meaningful campus communities',
        ],
      },
      { t: 'p', x: 'CollZap is not just about finding more people. It is about finding the right people.' },

      { t: 'h2', x: 'Who can use CollZap?' },
      {
        t: 'p',
        x: 'CollZap is designed for students who want to make their college experience more meaningful.',
      },
      {
        t: 'ul',
        items: [
          'Students interested in startups, entrepreneurship and business ideas.',
          'Developers and coders who want to work on projects, applications and websites.',
          'Content creators looking for video editors, designers, writers and photographers.',
          'Students looking for study partners and focused study circles.',
          'Ambitious students who want to improve their skills, habits and career opportunities.',
          'Community builders who want to organise events, create clubs and make an impact on campus.',
        ],
      },

      { t: 'h2', x: 'The vision behind CollZap' },
      {
        t: 'p',
        x: 'The vision of CollZap is to help students build better connections during their college journey.',
      },
      {
        t: 'p',
        x: 'Many students have talent, ideas and ambition, but they do not always have access to the right people or opportunities. A student may have a great idea but no team. Another student may have useful skills but no project. Someone may want to learn but may not have a supportive community.',
      },
      { t: 'p', x: 'CollZap wants to reduce this gap by helping students find each other.' },
      {
        t: 'p',
        x: 'Our long-term vision is to build a strong student networking platform where college students can discover like-minded peers, build friendships, learn together, work on projects, start businesses, find communities, share opportunities and support each other’s growth.',
      },
      {
        t: 'p',
        x: 'We believe that every student deserves the opportunity to find a circle that understands their interests and ambitions.',
      },

      { t: 'h2', x: 'Building a better college experience' },
      { t: 'p', x: 'College is not only about attending classes and passing exams.' },
      {
        t: 'p',
        x: 'It is also about exploring interests, building confidence, developing skills, meeting new people, creating projects, learning from others, finding opportunities and understanding your own potential.',
      },
      {
        t: 'p',
        x: 'The right people can make this journey more productive, exciting and meaningful.',
      },

      { t: 'h2', x: 'Our message to college students' },
      { t: 'p', x: 'You do not need to follow the same path as everyone else.' },
      {
        t: 'p',
        x: 'If you are interested in startups, find people who want to build. If you love coding, find people who want to create. If you enjoy learning, find people who want to grow. If you want to build something meaningful, find people who believe in your vision.',
      },
      {
        t: 'p',
        x: 'Your college may already have the people you are looking for. You just need a better way to discover them.',
      },
      { t: 'quote', x: 'Find Your Circle Before College Passes You By.' },
    ],
  },

  {
    slug: 'how-to-find-project-teammates-in-college',
    title: 'How to Find Project Teammates in College (Without Relying on Luck)',
    description:
      'Most students end up with whoever sat nearby. A practical guide to finding project teammates in college who actually finish what they start.',
    date: '2026-09-17',
    readingMinutes: 7,
    tags: ['Projects', 'How-to'],
    blocks: [
      {
        t: 'p',
        x: 'Almost every student ends up on a project team the same way: whoever was sitting nearby when the lecturer said "groups of four". It works out sometimes. Often it produces a team where one person writes the code, one person makes the slides at 2am, and two people are never heard from again.',
      },
      {
        t: 'p',
        x: 'The problem is not that your college lacks capable people. It is that there is no reliable way to find them. Here is how to fix that deliberately rather than hoping.',
      },

      { t: 'h2', x: 'Decide what you actually need before you look' },
      {
        t: 'p',
        x: 'Most people start by asking "who wants to join my project?" — the vaguest possible question, and the one most likely to attract people who will drop out. Before approaching anybody, get specific about three things.',
      },
      {
        t: 'ol',
        items: [
          'The role, not the person. "I need someone who can build a REST API" is findable. "I need a tech person" is not.',
          'The time commitment, honestly. Six hours a week for ten weeks is a real number people can say yes or no to. "It won’t take much time" is how you end up with someone who quietly disappears in week three.',
          'What they get out of it. A portfolio piece? A grade? Equity? Learning a specific skill? If you cannot answer this, you are asking for a favour, not offering a collaboration.',
        ],
      },
      {
        t: 'p',
        x: 'Writing these down takes ten minutes and eliminates most of the mismatches that kill student projects.',
      },

      { t: 'h2', x: 'Look where intent is already visible' },
      {
        t: 'p',
        x: 'The people most likely to finish a project with you have already shown some signal that they care about the thing. Those signals exist on every campus if you know where to look.',
      },
      {
        t: 'ul',
        items: [
          'Hackathon participants — they have already proven they will give up a weekend to build something.',
          'Club committees, not just club members. The difference between attending and organising is the difference between interest and commitment.',
          'People who ask questions in class, or who have a GitHub profile with more than a tutorial follow-along on it.',
          'Seniors who have shipped a project before. They know what the last two weeks actually feel like.',
        ],
      },
      {
        t: 'p',
        x: 'Notice that none of these are "my friends". Friendship is a poor predictor of whether someone will hit a deadline with you, and mixing the two badly can cost you both.',
      },

      { t: 'h2', x: 'Ask in a way that is easy to say no to' },
      {
        t: 'p',
        x: 'Counter-intuitive, but true: the easier you make it to decline, the better the people who say yes. A vague, high-pressure ask gets you polite agreement from people who never intended to show up.',
      },
      {
        t: 'p',
        x: 'A good ask is short and contains the specifics from step one. Something like: "I’m building a campus event app, I need someone on the backend, roughly six hours a week until November, you’d own the API end to end. Interested, or know someone who might be?"',
      },
      {
        t: 'p',
        x: 'That last clause matters more than people expect. Most good introductions come second-hand.',
      },

      { t: 'h2', x: 'Test with something small first' },
      {
        t: 'p',
        x: 'Never commit to a semester-long project with someone you have not worked with for a week. Run a trial: a weekend build, one feature, one small deliverable with a real deadline.',
      },
      { t: 'p', x: 'What you are actually testing is not skill. It is three other things.' },
      {
        t: 'ul',
        items: [
          'Do they reply? Not instantly — but within a day, reliably.',
          'Do they say when something is going wrong, or do they go quiet and hope?',
          'Do they finish the small thing? People who finish small things finish big ones.',
        ],
      },
      {
        t: 'p',
        x: 'Somebody brilliant who goes silent for a week will cost you more than somebody average who communicates. This is the single most common mistake students make when picking teammates.',
      },

      { t: 'h2', x: 'Agree on the boring things in writing' },
      {
        t: 'p',
        x: 'Before real work starts, get four things written down somewhere you both can see — a shared doc is fine.',
      },
      {
        t: 'ol',
        items: [
          'Who owns what. Not "we will figure it out" — actual names against actual parts.',
          'When you check in. A fifteen-minute call every Sunday beats a three-hour crisis meeting in week nine.',
          'What "done" means for the first milestone.',
          'What happens if someone needs to leave. Saying this out loud early removes the guilt that makes people ghost instead of quitting cleanly.',
        ],
      },
      {
        t: 'p',
        x: 'This feels excessive for a college project. It takes twenty minutes and prevents the failure mode that ends most of them.',
      },

      { t: 'h2', x: 'Where CollZap fits' },
      {
        t: 'p',
        x: `Everything above is findable manually — it just takes persistence and a lot of asking around. ${collzapIntro} Instead of hoping the right person happens to be in your lecture hall, you can filter for people on your campus who have already said they want to work on the same kind of thing.`,
      },
      {
        t: 'p',
        x: 'The advice still applies either way. Be specific, test small, write down the boring parts. The platform shortens the search; it does not replace the judgement.',
      },
    ],
  },

  {
    slug: 'how-to-find-a-co-founder-in-college',
    title: 'How to Find a Co-Founder in College',
    description:
      'College is the cheapest time in your life to start something. A practical guide to finding a co-founder on campus, what to look for, and the mistakes that end student startups early.',
    date: '2026-09-17',
    readingMinutes: 8,
    tags: ['Startups', 'How-to'],
    blocks: [
      {
        t: 'p',
        x: 'College is the cheapest time in your life to start something. Your fixed costs are low, your schedule is more flexible than it will ever be again, and you are surrounded by thousands of people with complementary skills who are not yet expensive to work with.',
      },
      {
        t: 'p',
        x: 'It is also the time when most people fail to take advantage of that, because finding a genuine co-founder is much harder than finding someone who says they are interested.',
      },

      { t: 'h2', x: 'A co-founder is not a teammate' },
      {
        t: 'p',
        x: 'This distinction gets blurred constantly, and blurring it is expensive. A teammate helps you build the thing. A co-founder shares the risk, the decisions and the ownership of the thing.',
      },
      {
        t: 'p',
        x: 'That means the bar is different. For a project teammate you are assessing whether they can do the work. For a co-founder you are assessing whether you can survive disagreeing with them for several years.',
      },
      {
        t: 'p',
        x: 'Most student startups do not die because the product was bad. They die because two people who liked each other discovered they wanted completely different things, and had never talked about it.',
      },

      { t: 'h2', x: 'What to actually look for' },
      { t: 'h3', x: 'Complementary skills, overlapping standards' },
      {
        t: 'p',
        x: 'Two developers building a product neither can sell is a common failure. So is a business student and a developer who disagree about whether something is ready to ship.',
      },
      {
        t: 'p',
        x: 'You want skills that do not overlap and standards that do. If one of you thinks "good enough" means it compiles and the other thinks it means it is tested, you will fight about everything forever.',
      },

      { t: 'h3', x: 'Evidence of finishing things' },
      {
        t: 'p',
        x: 'Ideas are not a differentiator; everyone has them. Look for evidence that this person has taken something from nothing to actually-exists, however small. A shipped side project, a club they actually ran, an event they organised end to end, a YouTube channel they kept going for a year.',
      },
      {
        t: 'p',
        x: 'Consistency over eighteen months tells you far more than brilliance over one weekend.',
      },

      { t: 'h3', x: 'How they behave when things go badly' },
      {
        t: 'p',
        x: 'You cannot assess this in a coffee chat. You can assess it by working together on something real and low-stakes first, and watching what happens the first time a deadline slips.',
      },
      {
        t: 'p',
        x: 'Do they communicate early, or do they go quiet? Do they take responsibility, or is it always circumstances? This is the highest-signal thing you will learn about someone, and you only learn it under mild pressure.',
      },

      { t: 'h2', x: 'Where to look on campus' },
      {
        t: 'ul',
        items: [
          'E-cells and entrepreneurship clubs — obvious, but go for the people organising rather than the people attending.',
          'Hackathons and case competitions. A weekend of forced pressure reveals more than a month of conversation.',
          'Other departments. The strongest founding pairs are usually cross-disciplinary, and your own department is the least likely place to find someone complementary.',
          'Seniors one or two years ahead who have already tried something and have scar tissue.',
        ],
      },
      {
        t: 'p',
        x: 'A warning about the most convenient option: your closest friend is the easiest person to start with and often the worst person to start with. Not always — some of the best founding teams are old friends — but the failure is much more costly, because you lose the friendship too. If you go that route, be more rigorous about the conversations below, not less.',
      },

      { t: 'h2', x: 'The conversation to have before you commit' },
      {
        t: 'p',
        x: 'Have this deliberately, early, and out loud. It is awkward for about ten minutes and saves you a year.',
      },
      {
        t: 'ol',
        items: [
          'What does success look like to you? A profitable small business and a funded company chasing scale are incompatible answers, and both are legitimate.',
          'What happens after graduation? If one of you is committed to a job offer and the other is going full-time, you need to know now.',
          'How many hours a week, realistically, during exam season?',
          'How do we split equity, and does it vest? Unvested equity is how people who left in month two still own a third of something four years later.',
          'How do we decide when we disagree and neither of us is obviously right?',
          'What would make you want to walk away?',
        ],
      },
      {
        t: 'p',
        x: 'If someone will not have this conversation, that is your answer. Wanting to skip it is itself the red flag.',
      },

      { t: 'h2', x: 'Start before you commit' },
      {
        t: 'p',
        x: 'Do not sign anything or announce a company. Build something together for four to six weeks first — a prototype, a landing page with real traffic, ten customer interviews you both sat in on.',
      },
      {
        t: 'p',
        x: 'You are testing the working relationship, and the cost of discovering a mismatch in week five is nearly zero. The cost of discovering it in year two, with equity split and users depending on you, is enormous.',
      },

      { t: 'h2', x: 'Where CollZap fits' },
      {
        t: 'p',
        x: `The hardest part of all of this is the first step — finding candidates at all when you cannot see past your own department. ${collzapIntro} You can look for people on your campus who have specifically said they are interested in building something long-term, rather than guessing.`,
      },
      {
        t: 'p',
        x: 'The filtering is still on you. Nothing replaces working with someone for a month before you commit to them for years.',
      },
    ],
  },

  {
    slug: 'build-a-study-group-that-actually-works',
    title: 'How to Build a Study Group That Doesn’t Die After Two Weeks',
    description:
      'Most college study groups collapse within a month. Why they fail, and how to structure one that survives the semester and actually improves your marks.',
    date: '2026-09-17',
    readingMinutes: 6,
    tags: ['Studying', 'How-to'],
    blocks: [
      {
        t: 'p',
        x: 'Almost every student has joined a study group that started with enthusiasm and a group chat, met twice, and then quietly became a place where people forward memes. The pattern is so reliable it is worth asking why.',
      },
      {
        t: 'p',
        x: 'Study groups do not fail because people are lazy. They fail because of four specific structural mistakes, all of which are fixable.',
      },

      { t: 'h2', x: 'Why most study groups collapse' },
      { t: 'h3', x: 'They are too big' },
      {
        t: 'p',
        x: 'Eight people is a social event. Beyond about five, someone can be silently absent without it being noticed, and once that is possible it becomes normal. Three to five is the range where every person is visibly load-bearing.',
      },

      { t: 'h3', x: 'They have no agenda' },
      {
        t: 'p',
        x: '"Let’s meet and study" produces two hours of parallel silence at best, and conversation at worst. Without a specific target for the session, there is no way to tell whether it worked, so nobody feels the loss when it stops happening.',
      },

      { t: 'h3', x: 'They mix commitment levels' },
      {
        t: 'p',
        x: 'This is the big one. Someone aiming for the top of the class and someone aiming to pass are not wrong, but they need different things from the same two hours. The mismatch is quietly frustrating for both, and the more committed person eventually stops showing up.',
      },

      { t: 'h3', x: 'They depend on everyone being free at once' },
      {
        t: 'p',
        x: 'Five students’ timetables have almost no common ground, so the meeting slides a little each week until it stops existing. A fixed slot that occasionally runs with three people beats a perfect slot that never happens.',
      },

      { t: 'h2', x: 'A structure that survives' },
      { t: 'h3', x: 'Same time, same place, no negotiation' },
      {
        t: 'p',
        x: 'Pick one slot and defend it. The group runs whether or not everyone can make it — quorum is two. Removing the weekly scheduling conversation removes the weekly opportunity to cancel.',
      },

      { t: 'h3', x: 'One person owns each session' },
      {
        t: 'p',
        x: 'Rotate it. That person picks what the session covers and brings the problems. It takes fifteen minutes of preparation and it is the difference between a study group and a room with people in it.',
      },
      {
        t: 'p',
        x: 'It also produces the single most effective study technique available, almost by accident: you will be explaining something to other people, which is where you find out what you do not actually understand.',
      },

      { t: 'h3', x: 'Work first, talk after' },
      {
        t: 'p',
        x: 'A structure that works well: fifty minutes of silent individual work on the same material, ten minutes comparing where people got stuck, repeat once, then twenty minutes of open discussion at the end.',
      },
      {
        t: 'p',
        x: 'The silence is not antisocial. It is what makes the discussion afterwards worth having, because everyone has hit the same wall.',
      },

      { t: 'h3', x: 'End every session by naming the next one' },
      {
        t: 'p',
        x: 'Before anyone leaves: what are we covering next week, and who is running it? Thirty seconds. This one habit does more for continuity than anything else on this list.',
      },

      { t: 'h2', x: 'Be honest about the commitment level' },
      {
        t: 'p',
        x: 'When you form the group, say out loud what you are aiming for and how many hours a week you intend to put in. Let people self-select out. A group of three people who all want the same thing will outlast a group of eight who never discussed it.',
      },
      {
        t: 'p',
        x: 'This feels unfriendly. It is the opposite — it is what stops the group from slowly becoming an obligation that everyone resents and nobody wants to be the first to leave.',
      },

      { t: 'h2', x: 'Where CollZap fits' },
      {
        t: 'p',
        x: `Matching on the subject is the easy part. Matching on how seriously people are approaching it is what actually determines whether the group survives, and it is the thing you usually only discover a month in. ${collzapIntro}`,
      },
      {
        t: 'p',
        x: 'Structure still does the real work. But starting with people whose commitment level genuinely matches yours removes the most common reason these groups fall apart.',
      },
    ],
  },

  {
    slug: 'why-i-built-collzap',
    title: "Why I Built CollZap — The Story Behind India's First Campus Peer Matching Platform",
    description:
      "Nitish Kumar, founder of CollZap, shares the real story behind building India's first campus peer matching platform — why he built it, what problem it solves, and how it works for college students.",
    date: '2026-09-17',
    readingMinutes: 10,
    tags: ['Founder Story', 'CollZap', 'EdTech India'],
    blocks: [
      { t: 'p', x: 'By Nitish Kumar, Founder & CEO, CollZap' },

      { t: 'h2', x: 'The Day I Realized I Had the Wrong Circle' },
      { t: 'p', x: 'It was my first week of college.' },
      {
        t: 'p',
        x: 'I walked into a classroom full of strangers, sat next to whoever was available, and within days — almost without thinking — those people became my friend group. Not because we had the same goals. Not because we were serious about the same things. Simply because we were in the same place at the same time.',
      },
      { t: 'p', x: 'I did not choose my circle. My circle chose me — by accident.' },
      {
        t: 'p',
        x: 'For months, I kept that to myself. I assumed it was just me — that everyone else had figured it out. But the more I spoke to students across different colleges, the more I realized this was not a personal problem. It was a shared, silent epidemic that nobody was talking about.',
      },
      { t: 'p', x: 'That realization became the foundation of CollZap.' },

      { t: 'h2', x: 'The Problem Nobody Was Solving' },
      { t: 'p', x: 'I started asking questions.' },
      {
        t: 'p',
        x: 'I talked to students from engineering colleges, management institutes, arts colleges. I conducted over 120 face-to-face conversations with college students. I asked them one simple question:',
      },
      {
        t: 'quote',
        x: 'Do you have at least one peer in your college who is as serious about your interest as you are?',
      },
      { t: 'p', x: 'The answers broke my heart.' },
      {
        t: 'p',
        x: 'Most students said no. Not because serious peers did not exist on their campus — but because they had no way to find them. They ended up in circles built by chance — hostel floors, classroom seats, canteen tables. Random proximity, not shared purpose.',
      },
      { t: 'p', x: 'The numbers backed up what I was hearing:' },
      {
        t: 'ul',
        items: [
          'More than 50% of college students globally report feeling lonely on campus',
          '69.9% of Indian college students experience moderate to high anxiety',
          'Students today spend 70% less time with peers in person than two decades ago',
          '82% of Indian youth say the wrong peer circle slowed down their personal growth',
        ],
      },
      {
        t: 'p',
        x: 'These were not small numbers. This was a generation of ambitious students growing alone — surrounded by people, but genuinely disconnected from anyone who matched their drive.',
      },

      { t: 'h2', x: 'What I Tried Before Building CollZap' },
      { t: 'p', x: 'Like every student, I tried the obvious solutions.' },
      {
        t: 'p',
        x: 'WhatsApp groups — good for staying connected with people I already knew. Useless for discovering someone new who shared my serious interests.',
      },
      {
        t: 'p',
        x: 'LinkedIn — too formal, too transactional. Nobody connects on LinkedIn to find a study partner or a startup co-founder from their own college.',
      },
      {
        t: 'p',
        x: 'Instagram DMs — I once sent a message to someone whose posts I admired. It felt weird. It was weird. No structure, no context, no safety.',
      },
      {
        t: 'p',
        x: 'Asking around — I literally asked friends "do you know anyone serious about startups on campus?" The answer was always vague. Someone knew someone who knew someone.',
      },
      {
        t: 'p',
        x: 'None of these worked because they were all designed for a different purpose. There was no platform built specifically for one thing — helping a college student find a serious, verified peer within their own campus.',
      },
      { t: 'p', x: 'That gap was so obvious I could not believe nobody had filled it.' },

      { t: 'h2', x: 'The Moment CollZap Was Born' },
      {
        t: 'p',
        x: 'I was sitting alone in my room one evening — frustrated after another unproductive attempt at finding someone serious to work with on an idea I had.',
      },
      { t: 'p', x: 'I thought — what if there was a platform where:' },
      {
        t: 'ul',
        items: [
          'You could verify that the other person actually goes to your college',
          'You could filter by interest — not just "tech" but specifically coding, or AI, or startups',
          'You could assess seriousness — not just what someone claims to be interested in, but how deeply they are actually committed',
          'And then match you automatically with the right person at the right level',
        ],
      },
      {
        t: 'p',
        x: 'Not a social media app. Not a dating app with a study partner twist. Something entirely new — a campus-based peer matching platform built specifically for ambitious students who want to grow.',
      },
      { t: 'p', x: 'I opened my notebook and wrote three words at the top of the page.' },
      { t: 'quote', x: 'Find Your People.' },
      { t: 'p', x: 'CollZap was born that night.' },

      { t: 'h2', x: 'What CollZap Actually Does' },
      { t: 'p', x: "CollZap is India's first campus-based peer matching platform. Here is how it works:" },

      { t: 'h3', x: 'Step 1 — Verify' },
      {
        t: 'p',
        x: 'Students sign up with their college email or upload their college ID. Only real, verified students from your campus get access.',
      },

      { t: 'h3', x: 'Step 2 — Select interest' },
      {
        t: 'p',
        x: 'Choose from 17 long-term interests — Coding, AI and Data Science, Startups, Finance, Design, Music, Writing, Fitness, Sports, Gaming, and more. Or pick from 7 short-term activities for specific goal-based collaboration.',
      },

      { t: 'h3', x: 'Step 3 — Take the seriousness assessment' },
      {
        t: 'p',
        x: 'Answer 20 behavioural and commitment-based questions. CollZap places you at one of four levels — Explorer, Learner, Practitioner, or Builder. This is not a test you can fake — it measures what you actually do, not what you claim.',
      },

      { t: 'h3', x: 'Step 4 — Get matched' },
      {
        t: 'p',
        x: 'CollZap automatically matches you with a peer from your own campus who shares your interest and is at the same level. You connect as a 1-on-1 pair, a Short Group of up to 4, or join a campus-wide Society.',
      },

      { t: 'h3', x: 'Step 5 — Grow together' },
      {
        t: 'p',
        x: 'The match opens a chat. Built-in conversation suggestions help you go from first message to fixing a real campus meeting fast.',
      },
      { t: 'p', x: 'No random connections. No noise. Just the right person, at the right level, from your own campus.' },

      { t: 'h2', x: 'Why "Campus-Based" Matters So Much' },
      { t: 'p', x: 'This is the part most people underestimate.' },
      {
        t: 'p',
        x: 'When I first described CollZap to people, they would ask — why limit it to one campus? Why not match students from across India?',
      },
      { t: 'p', x: 'The answer is simple.' },
      { t: 'p', x: 'The peer relationship only works when it is physically possible.' },
      {
        t: 'p',
        x: 'If your accountability partner is in Mumbai and you are in Jind, Haryana — you can never sit down together, study in the same library, attend the same hackathon, or push each other in person. The match becomes another WhatsApp contact you never really connect with.',
      },
      {
        t: 'p',
        x: 'Campus proximity is not a limitation — it is the entire point. CollZap is designed to create relationships that spill out of the app and into real life. A coffee in the canteen. A study session in the library. A late-night coding sprint in the hostel room.',
      },
      { t: 'p', x: 'That is the kind of peer relationship that actually changes your college years.' },

      { t: 'h2', x: 'The Validation That Convinced Me to Keep Going' },
      { t: 'p', x: 'Before writing a single line of code, I went to colleges and talked to students.' },
      {
        t: 'p',
        x: 'At Lovely Professional University alone, I surveyed over 120 students. 87% of them said they would use CollZap if it existed on their campus.',
      },
      { t: 'p', x: 'More importantly, the conversations I had in those interviews stayed with me.' },
      {
        t: 'quote',
        x: 'I have been looking for someone like this since Day 1 of college. Someone who is actually serious. I just did not know how to find them.',
      },
      {
        t: 'quote',
        x: 'I do not want people browsing my profile like a shopping app. I just want someone to be automatically matched with me — someone who actually wants to build things.',
      },
      { t: 'p', x: 'Those words are why I wake up and work on CollZap every day.' },

      { t: 'h2', x: 'What We Are Building Toward' },
      {
        t: 'p',
        x: 'CollZap launched its beta version at collzap.com and is currently onboarding its first campus cohort.',
      },
      { t: 'p', x: 'The vision is bigger than a college app.' },
      {
        t: 'p',
        x: 'We are building the infrastructure for intentional peer relationships at every stage of student life. Today it is campus matching. Tomorrow it is mentorship, collaborative learning, and eventually — a verified network of serious people who found each other at the right time.',
      },
      {
        t: 'p',
        x: 'India has 45 million college students. Most of them are growing alone — not because serious peers do not exist, but because there has never been a platform to bring them together deliberately.',
      },
      { t: 'p', x: 'CollZap is that platform.' },

      { t: 'h2', x: 'A Note to Every Ambitious Student Reading This' },
      {
        t: 'p',
        x: 'If you have ever felt like the smartest, most driven person in your friend group — and hated that feeling — this is for you.',
      },
      {
        t: 'p',
        x: 'If you have ever wished you had just one person who was as serious as you, who pushed you, who held you accountable, who understood the obsession — this is for you.',
      },
      { t: 'p', x: 'You are not alone. The peer you are looking for is on your campus right now — waiting to be found.' },
      { t: 'quote', x: 'Go to collzap.com and find them.' },
      {
        t: 'p',
        x: 'Nitish Kumar is the Founder and CEO of CollZap — India’s first campus-based peer matching platform. He is a BBA student at Chaudhary Ranbir Singh University, Jind, Haryana, and has been building CollZap while completing his degree. You can reach him at nitishkumar@collzap.com.',
      },
    ],
  },

  {
    slug: 'wrong-peer-circle-in-college',
    title: 'The Wrong Circle Is Silently Stealing Your Best Years — And Nobody Is Talking About It',
    description:
      'The wrong peer circle in college silently destroys your potential — and most students never realize it until it is too late. Learn how the wrong circle works, what it costs you, and how CollZap helps you find the right peers on your campus.',
    date: '2026-09-18',
    readingMinutes: 12,
    tags: ['Peer Circle', 'College Life India', 'CollZap'],
    blocks: [
      { t: 'p', x: 'By Nitish Kumar, Founder & CEO, CollZap' },

      { t: 'h2', x: 'You Arrived at College With Everything. Then Something Happened.' },
      { t: 'p', x: 'You remember the feeling.' },
      {
        t: 'p',
        x: 'First day of college. New city, new campus, new chapter. You had goals. You had energy. You had this quiet, burning belief that college was going to be the time you finally became who you were meant to be.',
      },
      { t: 'p', x: 'Then the weeks passed.' },
      {
        t: 'p',
        x: 'Without thinking, without choosing, without realizing — you ended up with a circle. The person who sat next to you in the first lecture. The roommate assigned to you in the hostel. The group that formed because everyone was equally lost and equally bored in those first few days.',
      },
      { t: 'p', x: 'You did not choose them. They just appeared.' },
      { t: 'p', x: 'And slowly — so slowly you barely noticed — that circle started shaping you.' },

      { t: 'h2', x: 'The Most Dangerous Thing in College Is Not Failure. It Is the Wrong Circle.' },
      {
        t: 'p',
        x: 'Most people talk about wrong choices in college — the wrong branch, the wrong city, the wrong college. Nobody talks about the wrong circle.',
      },
      { t: 'p', x: 'But here is the truth that nobody told you before you left home:' },
      {
        t: 'quote',
        x: 'Your peer circle in college will determine more about your future than your degree, your grades, or your professors.',
      },
      { t: 'p', x: 'Research backs this up completely.' },
      {
        t: 'p',
        x: 'Studies show that the people you spend the most time with directly influence your habits, your ambitions, your risk tolerance, and your outcomes. Psychologists and behavioral economists have studied this for decades.',
      },
      {
        t: 'quote',
        x: 'You are the average of the five people you spend the most time with. — Jim Rohn',
      },
      {
        t: 'p',
        x: 'In college, you spend more time with your peer circle than with anyone else. More than your family. More than your professors. More than anyone.',
      },
      { t: 'p', x: 'Which means if your circle is not serious — you will stop being serious too.' },
      { t: 'p', x: 'Not dramatically. Not all at once. Just quietly, gradually, inevitably.' },

      { t: 'h2', x: 'What the Wrong Circle Actually Does to You' },
      { t: 'p', x: 'It does not happen overnight. That is what makes it so dangerous.' },
      {
        t: 'p',
        x: 'The wrong circle does not destroy your potential in one big moment. It chips away at it — slowly, consistently, invisibly — until one day you look up and realize that two years have passed and you are nowhere near where you wanted to be.',
      },
      { t: 'p', x: 'Here is exactly how it happens:' },

      { t: 'h3', x: 'Your Standards Drop Without You Noticing' },
      {
        t: 'p',
        x: 'When nobody around you is working on something serious, seriousness starts to feel abnormal. You stop talking about your goals because nobody around you has any. You stop working late because everyone else is watching reels. You stop pushing yourself because there is nobody pushing back.',
      },
      { t: 'p', x: 'The bar lowers. And the terrifying thing is — you lower with it.' },

      { t: 'h3', x: 'Your Time Gets Consumed by the Lowest Common Denominator' },
      {
        t: 'p',
        x: 'Every group has a lowest common denominator — the activity that everyone agrees on. In most college circles, that activity is not studying, building, or growing. It is hanging out, scrolling, and doing nothing in particular.',
      },
      {
        t: 'p',
        x: 'The wrong circle does not force you to waste time. It simply makes wasting time the path of least resistance. And humans — especially tired, stressed college students — always take the path of least resistance.',
      },

      { t: 'h3', x: 'Your Ambitions Start to Feel Embarrassing' },
      { t: 'p', x: 'This one hurts to say but it is true.' },
      {
        t: 'p',
        x: 'When you talk about your goals — your startup idea, your plan to crack a competitive exam, your dream of becoming a serious coder — and nobody around you takes it seriously, something shifts inside you. You start qualifying your ambitions. You stop saying them out loud. Eventually you stop believing them yourself.',
      },
      {
        t: 'p',
        x: 'The wrong circle does not mock your dreams directly. It just creates an atmosphere where dreaming feels uncool.',
      },

      { t: 'h3', x: 'Your Growth Slows to a Crawl' },
      {
        t: 'p',
        x: 'Serious growth requires friction. It requires someone who challenges you, questions your assumptions, pushes you harder than you would push yourself, and holds you accountable when you want to give up.',
      },
      {
        t: 'p',
        x: 'The wrong circle provides none of this. There is no friction. No accountability. No one to challenge you. No one who even notices when you stop trying.',
      },
      { t: 'p', x: 'You plateau. And you mistake the plateau for contentment.' },

      { t: 'h2', x: 'The Numbers Tell a Brutal Story' },
      { t: 'p', x: 'This is not just a feeling. The data is stark.' },
      {
        t: 'ul',
        items: [
          '82% of Indian youth say the wrong peer circle directly slowed down their personal and professional growth',
          '50% of college students globally report feeling lonely on campus despite being surrounded by thousands of people',
          '69.9% of Indian college students experience moderate to high levels of anxiety, with peer isolation cited as a contributing factor',
          'Students today report spending significantly less time in meaningful peer interaction than students did two decades ago',
        ],
      },
      {
        t: 'p',
        x: 'The loneliness on Indian campuses is real. And it is not the loneliness of having no friends. It is the deeper, quieter loneliness of having friends who do not understand what you are trying to become.',
      },

      { t: 'h2', x: 'The Worst Part — You Probably Do Not Even Realize It Is Happening' },
      { t: 'p', x: 'Ask yourself these questions honestly:' },
      {
        t: 'ul',
        items: [
          'When did you last have a conversation with someone from your college about something you are genuinely working on?',
          'Does anyone in your current circle hold you accountable when you say you are going to do something?',
          'Do the people around you make you feel more ambitious or less ambitious?',
          'Have your standards for yourself gone up or down since you started college?',
          'Are you the most driven person in your circle — or is someone consistently pushing you to be better?',
        ],
      },
      { t: 'p', x: 'If those questions made you uncomfortable, you already know the answer.' },
      {
        t: 'p',
        x: 'The wrong circle is not always loud and obvious. Sometimes it is just a group of decent, likeable people who are not going anywhere in particular — and who will very gently, very kindly take you nowhere with them.',
      },

      { t: 'h2', x: 'The Compounding Cost of Wasted College Years' },
      { t: 'p', x: 'Here is something nobody calculates.' },
      {
        t: 'p',
        x: 'College is four years. That is 1,460 days. Roughly 35,000 waking hours. In those 35,000 hours, the difference between a student with the right circle and a student with the wrong circle compounds dramatically.',
      },

      { t: 'h3', x: 'The student with the right circle' },
      {
        t: 'ul',
        items: [
          'Builds something real — a project, a skill, a body of work',
          'Develops accountability habits that carry into their career',
          'Gets introduced to opportunities through their peer network',
          'Grows their confidence by being around people who believe in growth',
          'Enters the real world with momentum',
        ],
      },

      { t: 'h3', x: 'The student with the wrong circle' },
      {
        t: 'ul',
        items: [
          'Consumes more than they create',
          'Develops habits of comfort and avoidance',
          'Misses opportunities they never even heard about',
          'Enters the real world starting from scratch',
        ],
      },
      {
        t: 'p',
        x: 'Four years. 35,000 hours. The same intelligence, the same potential, the same starting point — but completely different outcomes. Because of the circle.',
      },

      { t: 'h2', x: 'It Is Not Your Fault. But It Is Your Responsibility.' },
      {
        t: 'p',
        x: 'The wrong circle is not usually a choice. It happens by default — by proximity, by accident, by the randomness of which seat you sat in on the first day.',
      },
      {
        t: 'p',
        x: 'So this is not about blame. This is not about feeling bad about where you are. This is about recognizing what is happening and deciding to change it.',
      },
      {
        t: 'p',
        x: 'Because here is the truth — the right peers exist on your campus right now. The serious coder who is building something real. The finance student who actually tracks markets. The person who is preparing for competitive exams with the same obsession you have. The startup-minded student who has been looking for exactly the kind of person you are.',
      },
      { t: 'p', x: 'They exist. You just have not found each other yet.' },
      { t: 'p', x: 'Because until now, there was no system for finding them.' },

      { t: 'h2', x: 'What the Right Circle Actually Does For You' },
      {
        t: 'p',
        x: 'The right peer circle is not just the absence of bad influence. It is an active accelerant. When you find even one person who is as serious as you about the same thing — everything changes.',
      },
      {
        t: 'ul',
        items: [
          'Your standards rise automatically — when the person next to you is working harder than you, you work harder. Not out of competition, out of inspiration.',
          'Your consistency improves — accountability is not about someone checking on you, it is about not wanting to show up to your next conversation with nothing to report.',
          'Your ideas get better — thinking alongside someone who challenges your assumptions produces sharper thinking than thinking alone ever could.',
          'Your network opens up — the right peer introduces you to their network, and opportunities compound.',
          'Your belief in yourself grows — when someone serious believes in what you are doing, it becomes easier to believe in it yourself.',
        ],
      },
      {
        t: 'p',
        x: 'One right peer can change the entire trajectory of your college years. That is not an exaggeration.',
      },

      { t: 'h2', x: 'The Problem With Every Existing Solution' },
      { t: 'p', x: 'You have probably already tried to solve this on your own.' },
      {
        t: 'p',
        x: 'WhatsApp groups — you joined the coding group, the finance group, the startup group. For two weeks there was activity. Then silence. Because groups are not relationships. And the people in those groups are from everywhere — not your campus.',
      },
      {
        t: 'p',
        x: 'LinkedIn — too professional, too performative. Nobody admits vulnerability on LinkedIn. Nobody says "I am stuck and I need a peer." It is all highlight reels.',
      },
      {
        t: 'p',
        x: 'Instagram DMs — you found someone whose posts you respected. You sent a DM. It was awkward. Nothing came of it. No structure, no context, no reason for them to trust a random message.',
      },
      {
        t: 'p',
        x: 'Asking around — you asked friends if they knew anyone serious about a particular thing. They said maybe, they would ask around. Nothing happened.',
      },
      {
        t: 'p',
        x: 'Every solution failed for the same reason: they were not built for this specific problem. They were built for networking, socializing, or entertainment — not for deliberately finding a serious, verified, compatible peer within your own campus.',
      },

      { t: 'h2', x: 'CollZap Was Built for Exactly This Moment' },
      { t: 'p', x: "CollZap is India's first campus-based peer matching platform." },
      {
        t: 'p',
        x: 'It does one thing — and it does it specifically. It helps you find a serious, verified, interest-matched peer from your own campus — at your exact knowledge level — so you can grow together in person.',
      },
      {
        t: 'ul',
        items: [
          'Verified identity — every user is verified through their college email or college ID. No outsiders. No fake profiles. Only real students from your campus.',
          'Interest-based matching — choose from 17 serious long-term interests. Not "tech" — specifically Coding, AI and Data Science, Startups, Finance, Design, Music, Writing, Sports, and more.',
          'Seriousness assessment — answer 20 behavioral questions that measure what you actually do, not what you say you do. Get placed at Explorer, Learner, Practitioner, or Builder level.',
          'Automatic matching — CollZap finds someone from your campus at the same interest and the same level. You do not browse. You do not swipe. You get matched.',
          'Built-in conversation flow — smart suggestions help your first conversation go from hello to fixing a real campus meeting, fast.',
        ],
      },
      {
        t: 'p',
        x: 'This is not another social app. This is not a study group finder. This is a system designed to give every ambitious student the peer they deserve — on their own campus.',
      },

      { t: 'h2', x: 'Your College Years Are Not Gone Yet' },
      {
        t: 'p',
        x: 'If you are reading this and feeling the weight of time already lost — stop.',
      },
      { t: 'p', x: 'The best time to find the right peer was Day 1 of college. The second best time is today.' },
      {
        t: 'p',
        x: 'Your remaining college years — whether it is one semester or three — are worth fighting for. The right peer found today can still change everything.',
      },
      { t: 'p', x: 'Go to collzap.com right now. Sign up. Take the assessment. Get matched.' },
      { t: 'p', x: 'Find the person on your campus who has been waiting for someone exactly like you.' },
      { t: 'quote', x: 'The wrong circle already had too much of your time. Do not give it one more day.' },
      {
        t: 'p',
        x: 'Nitish Kumar is the Founder and CEO of CollZap — India’s first campus-based peer matching platform. Built for every ambitious Indian college student who deserves a serious peer. Visit collzap.com to get matched with your peer today.',
      },
    ],
  },
  {
    slug: 'how-to-pick-hackathon-teammates-in-college',
    title: 'How to Pick Hackathon Teammates in College (Without Ruining the Weekend)',
    description:
      'Most hackathon teams fall apart because of mismatched effort, not skill. The roles you need, a 10-minute compatibility test, red flags to watch for, and where to find teammates beyond your friend group.',
    date: '2026-09-20',
    readingMinutes: 7,
    tags: ['Hackathons', 'Project teams'],
    blocks: [
      {
        t: 'p',
        x: 'You have the idea, the registration is done and the hackathon starts on Friday. Then you realise you have no team. So you ask your roommate, two friends from your hostel and someone from class who "knows a bit of coding". By Saturday afternoon one person has gone quiet, another is building something completely different, and you are alone at 3 AM fixing a bug you do not understand.',
      },
      {
        t: 'p',
        x: 'This happens to a lot of teams, and it is rarely about talent. Choosing hackathon teammates is a decision that shapes the next 24 to 48 hours, yet most students make it in five minutes on a WhatsApp group. Here is a better way to do it.',
      },
      { t: 'h2', x: 'Why hackathon teams actually fall apart' },
      {
        t: 'p',
        x: 'When a team fails, people usually say "we did not have enough skills". Look closer and the cause is more often one of these:',
      },
      {
        t: 'ul',
        items: [
          'Mismatched effort. One person is treating it as a serious build, another as a fun weekend, and neither has said so out loud.',
          'Mismatched availability. Someone has a lab test on Saturday and never mentioned it.',
          'No decision maker. Four people, four ideas, and two hours lost arguing about the tech stack.',
          'Everyone can do the same thing. Four backend developers and nobody to design the screen, write the pitch or test the demo.',
          'Team chosen for friendship, not fit. Friends are great, but being friends does not mean you work well under pressure.',
        ],
      },
      { t: 'h2', x: 'The roles a team of three or four really needs' },
      {
        t: 'p',
        x: 'You do not need a big team. Three or four people covering different jobs beats six people doing the same one. Think in roles, not in job titles:',
      },
      {
        t: 'ul',
        items: [
          'The builder: turns the idea into something that runs. Usually one strong developer, ideally two who can split frontend and backend.',
          'The designer or UX thinker: makes it usable and good to look at. Judges see the demo first, not your code.',
          'The idea owner: understands the problem and the user, and keeps the team from building features nobody asked for.',
          'The presenter: writes the pitch, tells the story and handles questions. A working product with a confusing pitch loses to a simpler one that is explained well.',
        ],
      },
      {
        t: 'p',
        x: 'One person can cover two roles, and in a team of three they will have to. What matters is that every role has a name next to it before the clock starts.',
      },
      { t: 'h2', x: 'A 10-minute compatibility test before you commit' },
      {
        t: 'p',
        x: 'Before you say yes to a team, spend ten minutes on a call and ask a few direct questions. It feels awkward the first time, and it saves you a bad weekend.',
      },
      {
        t: 'ol',
        items: [
          'How much time can you really give? Ask for actual hours, not "I will try".',
          'What is your goal: win, learn something, or build for your portfolio? Neither answer is wrong, but a mismatch is.',
          'What tools and languages are you comfortable with? Agree on the stack now, not at midnight.',
          'Tell me about a team project that went badly. What happened and what would you change? How people answer this tells you more than any skill list.',
          'When two of us disagree, how should we decide? Agree on a tiebreaker or a decision maker in advance.',
        ],
      },
      { t: 'h2', x: 'Red flags worth taking seriously' },
      {
        t: 'ul',
        items: [
          'They join the group but never reply to the planning messages.',
          '"I will join properly at the last hour." Hackathons do not have a last hour to spare.',
          'They will not commit to a time slot or a role.',
          'They want to change the whole idea the moment the team forms, without listening to the rest.',
          'Nobody in the team has shipped anything before, and nobody is willing to say so.',
        ],
      },
      {
        t: 'quote',
        x: 'A slightly less skilled teammate who shows up, communicates and finishes their part is worth more than a brilliant one who disappears.',
      },
      { t: 'h2', x: 'Where to find teammates beyond your own friend group' },
      {
        t: 'p',
        x: 'If everyone you know has the same skills as you, the team will have the same gaps as you. Widen the search:',
      },
      {
        t: 'ul',
        items: [
          'Club and department channels. Coding clubs, design societies and E-Cells often have members looking for a team.',
          'Your own classes. Look for the person who asks good questions or quietly ships side projects.',
          'Project fairs, workshops and previous hackathon teams in your college. People who have already done one know what it takes.',
          'Seniors and juniors. A different batch brings different skills and fewer friendship-group politics.',
          'Matching platforms built for this. CollZap, for example, matches verified students inside the same college by interest and by how seriously they approach it, so you meet people with the same level of effort rather than whoever happens to be in the group chat.',
        ],
      },
      { t: 'h2', x: 'A pre-hackathon checklist' },
      {
        t: 'ol',
        items: [
          'Confirm team size and the exact roles before registration closes.',
          'Write down each person’s availability for the whole event.',
          'Agree on the goal, the stack and one person who makes the final call.',
          'Set up a shared repository and a group chat the day before, not during.',
          'Decide what "done" means for the demo, and cut everything else.',
          'Plan sleep. A team that rests in shifts ships better than one that is awake for 30 hours.',
        ],
      },
      { t: 'h2', x: 'Pick people, not just skills' },
      {
        t: 'p',
        x: 'A hackathon compresses months of teamwork into a weekend, so the strengths and weaknesses of your team show up fast. Choose teammates for effort, honesty and reliability first and skill second, cover the four roles, and have the difficult conversations at the start rather than at 3 AM.',
      },
      {
        t: 'p',
        x: 'And if you cannot find the right people around you, look wider inside your own college. The right teammate is often a few classrooms away, just not in the group you already know.',
      },
    ],
  },
  {
    slug: 'why-campus-societies-fade-after-first-year',
    title: 'Why Your College Society Was Buzzing in First Year and Empty by Third',
    description:
      'Campus clubs fill up in orientation week and empty out by third year — not because students stop caring, but because of how those groups get built in the first place. Why small, interest-matched circles outlast big batch-based societies, and how CollZap is built around the ones that actually last.',
    date: '2026-09-24',
    readingMinutes: 9,
    tags: ['Clubs & Societies', 'Community Building', 'CollZap'],
    blocks: [
      {
        t: 'p',
        x: 'Every college has a WhatsApp group like this: two hundred-something members, everyone added during orientation week, the group name still has last year’s fest hashtag in it, and the only messages in the last month are an admin reposting an event flyer nobody replies to.',
      },
      {
        t: 'p',
        x: 'You joined at least one club or society in your first year. Almost everyone does — it feels like the fastest way to find people who are into the same things you are. And for a few weeks, it actually works. The induction is packed. The first meeting has energy. You exchange numbers with three people you are sure you will stay in touch with.',
      },
      {
        t: 'p',
        x: 'Then the meetings get smaller. The “core team” quietly becomes the same five people who ran things last year too. By third year, the group chat that once buzzed with induction photos is where event reminders go to be left on read.',
      },
      {
        t: 'p',
        x: 'This is not because your college runs its societies badly, and it is not because students stopped caring about the thing the society was for. It is because of how societies get built in the first place — and once you see the structure underneath it, the pattern stops feeling like bad luck.',
      },

      { t: 'h2', x: 'Societies are built to peak once a year, not to last' },
      {
        t: 'p',
        x: 'A campus society’s busiest day is almost always its induction. That is not a coincidence — it is the only day the group has a hard deadline and a room full of people with nowhere else to be yet. Everything after that depends on people choosing, again and again, to show up with no deadline forcing them to.',
      },
      {
        t: 'p',
        x: 'A few structural things make that hard:',
      },
      {
        t: 'ul',
        items: [
          'They run on a fixed academic calendar. A society’s whole reason to gather is usually one fest, one competition or one series of events a semester — once that is over, there is no default reason left to meet.',
          'Membership means attendance, not commitment. Signing up at a stall during orientation week costs nothing, so societies end up measuring their size in sign-ups, not in people who actually turn up to do anything.',
          'Leadership resets every single year. The seniors who built the momentum graduate or step back, and the incoming committee inherits a name, a logo and a follower count — not the relationships that actually made it work.',
          'You were sorted by year and branch, not by what you actually wanted to build. A society’s first filter is usually “which batch are you in,” not “what are you serious about” — so the group ends up wide, but rarely deep.',
        ],
      },

      { t: 'h2', x: 'Why the small groups are the ones still standing' },
      {
        t: 'p',
        x: 'Ask any final-year student what is still active from their first year, and it is almost never the forty-person club. It is the four people who kept building side projects together. The coding pair who still ping each other with a bug at midnight. The two people preparing for the same exam who never missed a study session, three years running.',
      },
      {
        t: 'p',
        x: 'What these have in common is not luck. They were not assigned by a sign-up sheet — they were chosen, around one specific thing both people actually cared about, in a group small enough that skipping a session meant someone would notice and ask where you were.',
      },
      {
        t: 'quote',
        x: 'A circle survives on accountability, and accountability only works in groups small enough that your absence is actually noticed.',
      },
      {
        t: 'p',
        x: 'Size and specificity are doing more work here than they get credit for. In a group of forty, responsibility diffuses — everyone assumes someone else will keep it going. In a group of three or four, there is nowhere to hide. And “we are all in the same department” is not a strong enough reason to keep showing up the way “we are both trying to ship this by Friday” is. A vague shared label fades; a specific shared goal does not.',
      },

      { t: 'h2', x: 'The wanting was never the problem' },
      {
        t: 'p',
        x: 'Nobody signs up for a society in week one hoping it fizzles out by year three. Every fresher standing at that sign-up table genuinely wants a group that lasts. The gap between wanting that and getting it comes down to how people end up in the same room in the first place — sorted by year and branch and who happened to walk past the stall, rather than by shared seriousness about one specific thing.',
      },
      {
        t: 'p',
        x: 'That is a matching problem, not a motivation problem. And matching problems have matching solutions.',
      },

      { t: 'h2', x: 'What actually has to be true for a group to last' },
      {
        t: 'ol',
        items: [
          'It has to be small enough that everyone’s presence — and absence — is actually noticed.',
          'Everyone in it has to be there for the same specific reason, not a broad umbrella like a department or a year.',
          'Everyone needs to be operating at roughly the same level of seriousness — someone building a real project and someone who joined for the certificate will not stay in sync for long.',
          'It needs a reason to reconvene that has nothing to do with the college’s event calendar.',
        ],
      },

      { t: 'h2', x: 'This is exactly the gap CollZap is built to close' },
      {
        t: 'p',
        x: `${collzapIntro} Not another college-wide group to join and quietly mute — a way to find the specific people worth building the small, lasting version of a circle with.`,
      },
      {
        t: 'p',
        x: 'CollZap even has its own version of a society — a shared community room for everyone at your college around one interest. The difference is what sorts you into it in the first place:',
      },
      {
        t: 'ul',
        items: [
          'Verified students only — every account is tied to a real college email or ID, so the people in a group actually go to your college, not friends-of-friends who wandered in.',
          'Matched by specific interest, not by branch or year — you are grouped with people who picked the same specific thing you did, not everyone who happened to share your timetable.',
          'A short seriousness check places you at a compatible level, so a one-on-one or small-group match is not paired with someone at a completely different stage of commitment.',
          'No calendar dependency — there is no fest or induction week driving when the group exists. It opens the moment you are matched and stays open for as long as you both keep showing up.',
        ],
      },
      {
        t: 'p',
        x: 'None of this makes the forty-person club pointless — it is still a fine way to spend an afternoon at a fest. It just was never built to be the thing that carries you through three more years. That was always going to need something smaller, chosen on purpose.',
      },

      { t: 'h2', x: 'Your third year does not have to look like your society’s group chat' },
      {
        t: 'p',
        x: 'If the club you joined in week one already looks like a group chat nobody opens, that is not a verdict on you or on the people who ran it. It is just what happens to groups sorted by administrative convenience instead of shared seriousness.',
      },
      {
        t: 'quote',
        x: 'You do not need another two-hundred-person group. You need the two or three people who were going to notice if you stopped showing up.',
      },
      {
        t: 'p',
        x: 'Go to collzap.com, pick the one thing on your campus you are actually serious about, and get matched with someone at your own college who is serious about it too — before this year’s induction photos are next year’s group chat nobody opens.',
      },
    ],
  },
  {
    slug: 'how-to-stay-consistent-in-college',
    title: 'How to Stay Consistent in College: Why 30 Minutes a Day Beats Weekend Sprints',
    description:
      'Big weekend plans rarely survive a semester. A practical guide to building skills in college with small daily tasks, streaks and people who keep you going.',
    date: '2026-10-02',
    readingMinutes: 7,
    tags: ['Habits', 'How-to'],
    blocks: [
      {
        t: 'p',
        x: 'Sunday night, the plan is perfect. This weekend you are finally going to learn React, or finish the portfolio, or get through the first half of that machine learning course. Saturday goes brilliantly. Then a lab report lands, the fest committee needs you, mid-sems are closer than they looked, and the next free weekend is three weeks away. By then the plan has quietly disappeared.',
      },
      {
        t: 'p',
        x: 'If that sounds familiar, the problem is almost never motivation. You clearly had plenty of it on Sunday night. The problem is the shape of the plan. College schedules punish big, rare bursts of effort and reward small, boring, daily ones — and almost nobody sets things up that way on purpose.',
      },

      { t: 'h2', x: 'Why weekend sprints fail in college' },
      {
        t: 'p',
        x: 'A weekend sprint looks efficient: one long block, no context switching, real focus. In practice it fails in college for a few predictable reasons.',
      },
      {
        t: 'ul',
        items: [
          'Your schedule is not yours. Assignments, labs, tests, events and family visits arrive on their own timetable. A plan that needs a clear weekend will lose to whatever claims the weekend first.',
          'It is all or nothing. Miss one weekend and you have not lost a day, you have lost a whole week of progress — and the gap makes it feel harder to restart.',
          'There is no feedback. When you work once a week, nobody sees the work until it is far too late to correct the direction.',
          'You are doing it alone. A plan that only exists in your head has no one to notice when it stops.',
        ],
      },

      { t: 'h2', x: 'Why small daily work wins' },
      {
        t: 'p',
        x: 'Thirty focused minutes a day does not sound like much. Over a semester it is more reliable than any weekend plan, because it survives the weeks a weekend plan does not.',
      },
      {
        t: 'ul',
        items: [
          'It compounds. Each day starts from where yesterday ended, so the skill builds on itself instead of restarting every Saturday.',
          'The habit forms around showing up, not around how you feel. After a couple of weeks, the question is no longer whether to work today, only what to work on.',
          'Starting is easy. Opening a laptop for thirty minutes takes far less willpower than blocking out an entire day.',
          'Problems show up while they are small. When you touch the work every day, a confusing concept or a broken build is a ten-minute fix, not a lost weekend.',
        ],
      },

      { t: 'h2', x: 'How to set it up' },
      { t: 'h3', x: '1. Pick one direction for the semester' },
      {
        t: 'p',
        x: 'Not five. One. Web development, competitive programming, design, a research topic, a startup idea — whatever you actually care about this semester. Daily work only compounds if it points the same way every day. You can switch at the end of the semester; switching every week just means starting over every week.',
      },
      { t: 'h3', x: '2. Make the daily unit tiny' },
      {
        t: 'p',
        x: 'Aim for 30 to 45 minutes, something you can finish in one sitting even on a bad day. "Learn React" is not a daily unit. "Build one component that fetches and shows a list" is. If you regularly fail to finish a day’s unit, it is too big — cut it in half rather than giving up on the habit.',
      },
      { t: 'h3', x: '3. Make every day produce something you could show' },
      {
        t: 'p',
        x: 'A commit, a page of notes, a solved problem, a sketch, a short write-up of what you learned. Output beats hours: "studied for two hours" is easy to fake, even to yourself; "here is what I made today" is not. It also gives you a trail of real work to point to later, in interviews or applications.',
      },
      { t: 'h3', x: '4. Track it simply, and never miss twice' },
      {
        t: 'p',
        x: 'A calendar where you mark each day you did the work is enough. Streaks are motivating, but the rule that matters is simpler: you will miss days, so never miss two in a row. One missed day is life; two is the start of quitting.',
      },
      { t: 'h3', x: '5. Plan for bad days in advance' },
      {
        t: 'p',
        x: 'Decide now what your ten-minute version looks like — reading one page of the docs, fixing one small bug, reviewing yesterday’s notes. During exam week or a packed fest week, do the ten-minute version and count it. The goal on bad days is not progress, it is keeping the habit alive.',
      },

      { t: 'h2', x: 'The part most people skip: other people' },
      {
        t: 'p',
        x: 'Most consistency advice stops at systems and trackers. In practice, the strongest thing keeping people going is another person who notices. Someone who sees what you made today, tells you honestly whether it is any good, and expects to see the next piece tomorrow.',
      },
      {
        t: 'p',
        x: 'That person works best when they are close to where you are: on your own campus, dealing with the same exam calendar, at a similar level in the same thing. An internet stranger three years ahead of you will not notice when you go quiet. A peer two hostels away, working on the same kind of project at the same pace, will.',
      },
      {
        t: 'quote',
        x: 'Motivation gets you to day one. Someone who notices whether you showed up gets you to day sixty.',
      },

      { t: 'h2', x: 'A simple 4-week starter plan' },
      {
        t: 'ol',
        items: [
          'Week 1 — Set the routine. Pick your one direction, choose a fixed time of day, and do a 30-minute unit every day. Do not optimise anything yet; just show up.',
          'Week 2 — Define your minimum version. Write down your ten-minute fallback and use it on any day the full unit will not happen. Keep the never-miss-twice rule.',
          'Week 3 — Share the work. Find one person working on something similar and send them what you made each day, or a short weekly summary. Look at theirs too.',
          'Week 4 — Review what stuck. Look back at four weeks of output. Make the daily unit a little bigger only if you finished almost every day; otherwise keep it the same and keep going.',
        ],
      },

      { t: 'h2', x: 'Common mistakes' },
      {
        t: 'ul',
        items: [
          'Making the daily unit too ambitious, failing it twice, and deciding daily work "does not work for you".',
          'Switching goals every week, so nothing ever compounds.',
          'Measuring hours instead of outputs, which hides days where time passed but nothing got made.',
          'Quitting after one broken streak instead of simply restarting the next day.',
          'Keeping the whole plan private, so nobody notices — including you — when it quietly stops.',
        ],
      },

      { t: 'h2', x: 'How CollZap builds this in' },
      {
        t: 'p',
        x: `${collzapIntro} It is also built around the small-daily-work idea from the very first day:`,
      },
      {
        t: 'ul',
        items: [
          'One short task a day for each interest you pick, reviewed by the CollZap team, so your work gets real feedback from the start.',
          'Approved tasks earn points and build a personal streak — your own progress, with no leaderboard.',
          'At 500 points, peer matching opens: you are matched with verified students on your own campus who share your interest and are at a similar level.',
          'Once you are matched, your group gets a daily task too, and you review each other’s work, so the person who notices whether you showed up is right there in your group.',
        ],
      },
      {
        t: 'p',
        x: 'Consistency in college is not about finding more willpower or a perfect free weekend. It is about a small unit of work, done most days, seen by someone who cares whether you keep going. Pick your one thing, start with thirty minutes today, and if you want the structure and the people built in, find your circle at collzap.com.',
      },
    ],
  },
];

/** Newest first, which is the order the index page and sitemap both want. */
export const POSTS_BY_DATE = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));

export const POST_PATHS = POSTS.map((p) => `${BLOG_BASE}/${p.slug}`);

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug) || null;
}
