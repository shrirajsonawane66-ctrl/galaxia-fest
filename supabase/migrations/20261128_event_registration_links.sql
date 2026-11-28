-- Add public registration links and refresh the 2026 WhatsApp group links.
-- Idempotent: safe to run once via `supabase db push` or the SQL editor.

alter table public.events
  add column if not exists form_url text;

with aliases(alias, event_key) as (
  values
    ('mehndi-starlit-hands', 'mehndi'),
    ('ff-final-zone-arena', 'ff-final-zone-arena'),
    ('box-cricket-boundary-breakers', 'box-cricket'),
    ('carrom-orbit-strike', 'carrom'),
    ('ramp-walk-face-of-galaxia', 'ramp-walk'),
    ('body-posing-titans-of-anantara-or-galaxia', 'body-posing'),
    ('football-astro-legends', 'football'),
    ('debate-clash-of-minds', 'debate'),
    ('party-makeup-infinite-glam', 'party-makeup'),
    ('singing-echo-of-orbit', 'singing'),
    ('rap-cosmic-cypher', 'rap'),
    ('treasure-hunt-unlock-the-infinity', 'treasure-hunt'),
    ('treasure-hunt-unlock-the-infinity-chess', 'treasure-hunt'),
    ('bgmi-space-battle', 'bgmi'),
    ('volleyball-male', 'volleyball'),
    ('volleyball-female', 'volleyball'),
    ('volleyball-cosmic-smashes', 'volleyball'),
    ('chess-mind-master', 'chess')
),
links(event_key, whatsapp_url, form_url) as (
  values
    ('elocution', 'https://chat.whatsapp.com/KbhQpRF3wFNClJWFu9KPZl?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjI2LCJ0ZW5hbnRJZCI6M30='),
    ('ff-final-zone-arena', 'https://chat.whatsapp.com/JvUiz9gX6E5EAoFA3G9mfi?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjI3LCJ0ZW5hbnRJZCI6M30='),
    ('mehndi', 'https://chat.whatsapp.com/KZFyGt6qKCNJK2cy19Go41?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjI4LCJ0ZW5hbnRJZCI6M30='),
    ('dance-solo', 'https://chat.whatsapp.com/KULDg4U0Lqp2Jr5S16cbTh?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjI5LCJ0ZW5hbnRJZCI6M30='),
    ('dance-group', 'https://chat.whatsapp.com/CxHt2lJT8Yr3iPE5B2w6tq?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjMwLCJ0ZW5hbnRJZCI6M30='),
    ('box-cricket', 'https://chat.whatsapp.com/GoWj1wgz5YJEWgpPaNb2an?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjMxLCJ0ZW5hbnRJZCI6M30='),
    ('carrom', 'https://chat.whatsapp.com/LWdjh6gWPD57ZhARxiuo7C?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjMyLCJ0ZW5hbnRJZCI6M30='),
    ('into-the-adverse', 'https://chat.whatsapp.com/IP0fNXq97q1HxwvZZfBepk?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQxLCJ0ZW5hbnRJZCI6M30='),
    ('stalk-the-stock', 'https://chat.whatsapp.com/J3cN9CFQCjXLHajFg9bvII', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQzLCJ0ZW5hbnRJZCI6M30='),
    ('case-toh-banta-hai', 'https://chat.whatsapp.com/CwUoMqlgLRPAp8cIbs789E?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ0LCJ0ZW5hbnRJZCI6M30='),
    ('football', 'https://chat.whatsapp.com/DaUtVlm7PCFEfH7nAyUEfg', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ5LCJ0ZW5hbnRJZCI6M30='),
    ('debate', 'https://chat.whatsapp.com/DB9hmaW77sSJKNXxsJeYjY?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjMzLCJ0ZW5hbnRJZCI6M30='),
    ('party-makeup', 'https://chat.whatsapp.com/Ech2uSiCQzDJpPqYxVKxjY?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM0LCJ0ZW5hbnRJZCI6M30='),
    ('singing', 'https://chat.whatsapp.com/KFQ1LdHAcHh23DN78WwjT3?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM1LCJ0ZW5hbnRJZCI6M30='),
    ('rap', 'https://chat.whatsapp.com/D8oBzPb5gnTBl25Pp6Xm8Y?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM2LCJ0ZW5hbnRJZCI6M30='),
    ('treasure-hunt', 'https://chat.whatsapp.com/LBK0Q6i6dbQ17yeTabpW3v?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM3LCJ0ZW5hbnRJZCI6M30='),
    ('bgmi', 'https://chat.whatsapp.com/FwBRyZgTjowAyDwFCIuajn?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM4LCJ0ZW5hbnRJZCI6M30='),
    ('ramp-walk', 'https://chat.whatsapp.com/Hj9KpfJbwU8IzNFHI4SHjk?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjM5LCJ0ZW5hbnRJZCI6M30='),
    ('body-posing', 'https://chat.whatsapp.com/LJukQmm5exR7XZb1eDLsO6?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQwLCJ0ZW5hbnRJZCI6M30='),
    ('bizz-war', 'https://chat.whatsapp.com/LlDgpiBb9BNL7Fcz8tmTpe?s=qt&p=i&mlu=4&ilr=4&iam=2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ1LCJ0ZW5hbnRJZCI6M30='),
    ('brand-battle', 'https://chat.whatsapp.com/Cgyxax9Gmh3K78X7zyKz5P', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ2LCJ0ZW5hbnRJZCI6M30='),
    ('sale-star', 'https://chat.whatsapp.com/K1uasTNzlyj795o96wgu3e', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQyLCJ0ZW5hbnRJZCI6M30='),
    ('volleyball', 'https://chat.whatsapp.com/I1qMuZRzFumK2p22SkEfhV', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ4LCJ0ZW5hbnRJZCI6M30='),
    ('chess', 'https://chat.whatsapp.com/BxTboS0mi8c42xpTDQfAf2', 'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ3LCJ0ZW5hbnRJZCI6M30=')
),
normalized as (
  select
    e.id,
    regexp_replace(
      regexp_replace(lower(coalesce(e.event_name, e.heading, '')), '[^a-z0-9]+', '-', 'g'),
      '^-+|-+$',
      '',
      'g'
    ) as event_key
  from public.events e
)
update public.events e
set
  whatsapp_url = l.whatsapp_url,
  form_url = coalesce(nullif(e.form_url, ''), l.form_url),
  updated_at = now()
from normalized n
join links l on l.event_key = coalesce(
  (select a.event_key from aliases a where a.alias = n.event_key),
  n.event_key
)
where e.id = n.id;

-- Events from the supplied master list that were missing from the published set.
insert into public.events (
  id, slug, day, theme, starts_at, rules, whatsapp_url, form_url, is_published,
  heading, description, date, start_time, event_name, location, category,
  action_type, status, featured, sort_order, created_at, updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000111', '2026-12-17-football', 1, '', null,
    array['5 players per side (5-a-side). 2 rolling substitutes.', 'Duration: 10 minutes + 2 minute break + 10 minutes.', 'The referee''s decision is final.', 'Lots and draws are finalised only by the organising committee.', 'Team members cannot be changed after registration until the end of the competition.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
    'https://chat.whatsapp.com/DaUtVlm7PCFEfH7nAyUEfg',
    'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ5LCJ0ZW5hbnRJZCI6M30=',
    true, 'Day 1', 'Part of Day 1 at Galaxia i-Fest.', '2026-12-17', '00:00',
    'Football', 'Venue to be announced', 'Sports', 'none', 'published', false, 12,
    '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000112', '2026-12-18-brand-battle', 2, '', null,
    array['Each team may register up to 4 participants. Registration fee: ₹300 per team.', 'All participants must be students of a recognised college or educational institution.', 'Organisers assign each team a brand from a pair of competitors (for example, Coca-Cola and Pepsi, or Jio and Airtel). Teams may not change their assigned brand.', 'Teams receive preparation time before each debate. After the first round, teams get 10 minutes to prepare for the next match, including arguments and speaking order.', 'Each team defends its assigned brand and explains why it is better than its competitor. Discussion may cover brand strengths, product quality, customer appeal, market positioning, and competitive advantages.', 'Arguments must be relevant, logical, and supported by reasonable evidence.', 'All four team members are encouraged to contribute. Teams should divide speaking roles before the debate. No interrupting opponents outside the designated rebuttal period.', 'False information, personal attacks, offensive language, and inappropriate arguments are not allowed.', 'Mobile phones and internet access are not permitted during preparation unless the organisers explicitly allow them.', 'Knockout format: the winning team advances and the losing team is eliminated, until the finalists compete for the championship. Organisers may arrange preliminary matches or byes if needed.', 'Judges use the published scoring criteria, and the team with the higher score wins. In a tie, judges may ask both teams an additional question. The judges'' decision is final.']::text[],
    'https://chat.whatsapp.com/Cgyxax9Gmh3K78X7zyKz5P',
    'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ2LCJ0ZW5hbnRJZCI6M30=',
    true, 'Day 2', 'Part of Day 2 at Galaxia i-Fest.', '2026-12-18', '00:00',
    'Brand Battle', 'Venue to be announced', 'General', 'none', 'published', false, 11,
    '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000113', '2026-12-18-sale-star', 2, '', null,
    array['Each participant randomly selects one product from the mystery box. Participants may not choose a product in advance or exchange the selected item.', 'Preparation: exactly 3 minutes to examine the product and prepare a pitch. Mobile phones, internet access, and outside assistance are not allowed during preparation.', 'Sales pitch: maximum 5 minutes to sell the assigned product to the judge. Participants may demonstrate the product and explain its usefulness, benefits, and value in their own approach, as long as the pitch stays relevant to the product.', 'The judge acts as a buyer and may ask questions, raise objections, or challenge the product''s value. The judge is not required to accept the offer.', 'The host gives a warning when about 1 minute remains. Participants must stop when selling time expires.', 'Use only the assigned product. Do not make false claims about its features, performance, or benefits. Offensive language, inappropriate behaviour, or deliberate disruption may lead to disqualification.', 'Judges apply the same criteria to all participants. The decision is based on the quality of the pitch, not confidence or entertainment value alone. The judges'' decision is final. In a tie, they may ask the tied participants one additional question.']::text[],
    'https://chat.whatsapp.com/K1uasTNzlyj795o96wgu3e',
    'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQyLCJ0ZW5hbnRJZCI6M30=',
    true, 'Day 2', 'Part of Day 2 at Galaxia i-Fest.', '2026-12-18', '00:00',
    'Sale Star', 'Venue to be announced', 'General', 'none', 'published', false, 12,
    '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  ),
  (
    '00000000-0000-4000-8000-000000000114', '2026-12-18-chess', 2, 'Mind Master', null,
    array['Knockout format.', 'When time is over, the winner is decided by points.', 'Players must move a piece after touching it.', 'Boys and girls play separately.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
    'https://chat.whatsapp.com/BxTboS0mi8c42xpTDQfAf2',
    'https://ves-admin.learnqoch.com/eventform/eyJmb3JtSWQiOjQ3LCJ0ZW5hbnRJZCI6M30=',
    true, 'Day 2', 'Mind Master.', '2026-12-18', '00:00',
    'Chess', 'Venue to be announced', 'Sports', 'none', 'published', false, 13,
    '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
  )
on conflict (id) do update set
  slug = excluded.slug,
  day = excluded.day,
  theme = excluded.theme,
  rules = excluded.rules,
  whatsapp_url = excluded.whatsapp_url,
  form_url = excluded.form_url,
  is_published = excluded.is_published,
  heading = excluded.heading,
  description = excluded.description,
  date = excluded.date,
  start_time = excluded.start_time,
  event_name = excluded.event_name,
  location = excluded.location,
  category = excluded.category,
  action_type = excluded.action_type,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();
