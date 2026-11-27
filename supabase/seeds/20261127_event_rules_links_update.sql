-- Idempotent update for existing public.events rows.
-- Run AFTER supabase/migrations/20261127_events_system.sql when the 2026 events already exist.
-- Adds the tappable rules and WhatsApp group links to the 21 published reference events,
-- and the provided WhatsApp links to the matching 15 draft records.

update public.events set
  rules = array['Individual participation only.', 'The topic will be given on the spot.', 'Time limit: minimum 3 minutes, maximum 5 minutes.', 'No vulgar, abusive, offensive, political, or discriminatory content.', 'Reporting time: 20 minutes before the event starts.']::text[],
  whatsapp_url = null,
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000001';

update public.events set
  rules = array['A team must have 4+1 players. Each team must have a team name.', 'Teaming up with students from other departments is strictly not allowed.', 'No WiFi and no charging points will be provided.', 'Only mobile phones are allowed. No iPad, tablet, or emulator.', 'Each qualification round has 3 matches. Room ID and password will be given before each match.', 'Any player found cheating will result in disqualification of the team.', 'At least 2 members must record their POV, and screenshots (SS) are mandatory.', 'Points: 1st rank 10, 2nd rank 9, 3rd rank 8, 4th rank 7, 5th rank 6, 6th rank 5, 7th rank 4, 8th rank 3. Per kill: 1 point.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/JvUiz9gX6E5EAoFA3G9mfi',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000002';

update public.events set
  rules = array['Participants must bring their own natural mehndi cones and materials. Chemical colours, glitter, stickers, or stencils are generally prohibited.', 'Duration: 1 hour.', 'Designs must cover one hand, including the palm side and the back of the hand up to the elbow.', 'Designs must be original and creative. No printed materials, phones, or references are allowed once the competition begins.', 'Participants may apply mehndi on their own hand or on a model''s hand that they bring themselves.', 'Breaking any rule, including using prohibited materials or excessive tardiness, may lead to disqualification.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/KZFyGt6qKCNJK2cy19Go41',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000003';

update public.events set
  rules = array['Maximum performance time: 3 minutes.', 'Audio quality must be 320 kbps or 256 kbps. Audio format must be MP3.', 'Audio must be submitted at least 5 days before the event day. No end-moment changes are allowed.', 'Props are allowed but must be handled by the participant only.', 'Stunts (fire, glass, flips, etc.) are strictly prohibited.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/KULDg4U0Lqp2Jr5S16cbTh',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000004';

update public.events set
  rules = array['Each team must have a maximum of 8 members.', 'Maximum performance time: 5 minutes.', 'Audio quality must be 320 kbps or 256 kbps. Audio format must be MP3.', 'Audio must be submitted at least 5 days before the event day. No end-moment changes are allowed.', 'Props are allowed but must be handled by the participants only.', 'Stunts (fire, glass, flips, etc.) are strictly prohibited.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/CxHt2lJT8Yr3iPE5B2w6tq',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000005';

update public.events set
  rules = array['Duration: 3 minutes.', 'Participants must bring their own music track (MP3). Audio must be submitted at least 5 days before the event day.', 'Costumes, choreography, and presentation must be creative and beyond the imagination.', 'Props are allowed, except hazardous items such as fire, water, or glitter bombs.', 'Every participant must report 30 minutes before the event for registration and sound check.']::text[],
  whatsapp_url = null,
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000006';

update public.events set
  rules = array['A team has 8+1 players. The extra 1 player is compulsory.', 'Each team is given 2 overs per match. 3 overs are given in the semi-final and final only.', 'No sidearm action is allowed.', 'One bowler bowls one over (mandatory).', 'In case of a tie, there is no super over or replay. The result will be decided as per the tournament organisers'' rules.', 'Team members cannot be changed after registration until the end of the competition.', 'Participants must bring their own bats.', 'Strict action will be taken for arguing with referees. The referee''s decision is final.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/GoWj1wgz5YJEWgpPaNb2an',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000007';

update public.events set
  rules = array['Singles and doubles categories will be played.', 'Only one board will be played per match. Best of 3 boards for the semi-final and final only.', 'Taping is considered a foul.', 'Every player must carry their own striker.', 'General carom rules will apply.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/LWdjh6gWPD57ZhARxiuo7C',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000008';

update public.events set
  rules = array['Two height categories: up to 170 cm, and 170 cm and above.', 'Top 2 athletes in each category receive a trophy, cash prize, and certificate. 3rd place receives a medal and certificate.', 'College ID is compulsory.', 'Shorts must follow the standard rules of Mr. Physique. Board shorts must not be lower than 2 inches above the knees. Any pattern or colour is acceptable, but no commercial branding or advertising is allowed. Bring shorts to event check-in for inspection.', 'Except for a wedding ring, competitors may not wear footwear, glasses, watches, pendants, earrings, wigs, or distracting ornamentation.', 'Implants or fluid injections that change the natural shape of the body are strictly prohibited and may result in disqualification.', 'Props are strictly prohibited during prejudging or the finals presentation.', 'A category runs only if it has at least 5 athletes. If not, it is combined with the next taller class where possible. If the tallest category has fewer than 5, it is combined with the closest shorter class. If still fewer than 5, more categories are combined, or eventually one open class is run.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/LJukQmm5exR7XZb1eDLsO6',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000009';

update public.events set
  rules = array['Category 1: intraday stock trading. Category 2: futures and options (F&O). Category 3: Other (details to be confirmed).', 'In Categories 1 and 2, participants may place up to 10 trades per category. Every buy or sell order counts as one trade.', 'Rules, fee, and scoring for Category 3 (Other) are to be confirmed.', 'For intraday stocks and F&O, the participant with the highest portfolio value wins.', 'Trading is intraday only. Do not hold positions overnight. Automated tools and bots are not allowed.', 'The same prize schedule applies to all three categories. Any tie will be handled at the event venue.', 'The trading platform and virtual starting capital have not been declared yet.']::text[],
  whatsapp_url = null,
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000010';

update public.events set
  rules = array['Choose one case study from the 10 provided.', 'Make a PowerPoint presentation explaining your analysis and solution.', 'Maximum 15 slides. Exceeding 15 slides results in disqualification.', 'Presentation time: 10 minutes. If a team goes over time, marks may be deducted and a penalty applies (the exact penalty is not stated).', 'Plagiarism up to 15% is allowed. More than 15% results in negative marking.', 'Submit the PowerPoint through Unstop. The submission deadline is not provided yet (8 December 2026 is unconfirmed).', 'Judging: clarity and structure 30%, depth of analysis 30%, creativity and innovation 20%, practicality 20%.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/CwUoMqlgLRPAp8cIbs789E',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000011';

update public.events set
  rules = array['Only 2 participants per group.', 'Each speaker has a fixed time limit (for example, 5 minutes), enforced by a timekeeper.', 'Arguments must be logical, relevant, and supported by evidence.', 'Conduct: maintain formal and respectful language. No personal attacks.']::text[],
  whatsapp_url = null,
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000101';

update public.events set
  rules = array['Participants must report at least 20 minutes before the start at the venue.', 'Participants must bring their own model. The model must be dressed before the event.', 'Duration: 1 hour.', 'Originality and creativity are highly encouraged. Use of mobile phones or reference images is strictly prohibited.', 'Participants must bring their own makeup tools, products, and materials, including brushes, dotting tools, glitters, stickers, rhinestones, etc.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/Ech2uSiCQzDJpPqYxVKxjY',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000102';

update public.events set
  rules = array['Participants must register before the deadline.', 'Performance time: 2 to 3 minutes. A buzzer sounds in the last 20 seconds.', 'Audio quality must be 320 kbps or 256 kbps (if any audio is used).', 'Prior notice is required to use any instrument (guitar, tabla, dhol, keyboard, etc.) during the performance.', 'Audio must be submitted at least 3 days before the event day. No end-moment changes are allowed.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/KFQ1LdHAcHh23DN78WwjT3',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000103';

update public.events set
  rules = array['Performance time: 2 to 3 minutes.', 'Audio quality must be 320 kbps or 256 kbps, with a pre-recorded instrumental or beat.', 'Participants may perform a cappella (without background music).', 'Audio must be submitted at least 5 days before the event day. No end-moment changes are allowed.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/D8oBzPb5gnTBl25Pp6Xm8Y',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000104';

update public.events set
  rules = array['Knockout format.', 'When time is over, the winner is decided by points.', 'Players must move a piece after touching it.', 'Boys and girls play separately.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = null,
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000105';

update public.events set
  rules = array['A squad has 12 players (6 playing and 6 substitutes).', 'Only bonafide college students with a valid ID card are allowed.', 'Matches are best of 3 sets, played as per International Volleyball Federation (IVF) rules.', 'Walkover if a team does not report within 15 minutes of the scheduled time.', 'No player can play for two colleges or two teams.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/DjFOJkSEfDFJHKeT4ld8sX',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000106';

update public.events set
  rules = array['A squad has 12 players (6 playing and 6 substitutes).', 'Only bonafide college students with a valid ID card are allowed.', 'Matches are best of 3 sets, played as per International Volleyball Federation (IVF) rules.', 'Walkover if a team does not report within 15 minutes of the scheduled time.', 'No player can play for two colleges or two teams.', 'Changes in rules, schedule, or draws are at the discretion of the WCCBM sports committee.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/DjFOJkSEfDFJHKeT4ld8sX',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000107';

update public.events set
  rules = array['A team must have 4+1 players. Each team must have a team name.', 'Teaming up with students from other departments is strictly not allowed.', 'Teams or squads must sit together.', 'No WiFi and no charging points will be provided.', 'Only mobile phones are allowed. No iPad, tablet, or emulator.', '3 matches will be played. Room ID and password will be given before each match.', 'Abusive language is strictly prohibited during the game.', 'Any player found cheating will result in disqualification of the team.', 'At least 2 members must record their POV, and screenshots (SS) are mandatory.', 'Points: 1st rank 10, 2nd rank 6, 3rd rank 5, 4th rank 4, 5th rank 3, 6th rank 2, 7th rank 1, 8th rank 1. Per kill: 1 point.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/FwBRyZgTjowAyDwFCIuajn',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000108';

update public.events set
  rules = array['Submit one creative photo and one advertisement reel of 10 to 25 seconds. Both must use the same idea or message.', 'You may show the product or leave it unseen, but viewers must understand the message.', 'Follow the assigned topic, which may focus on a product or an idea.', 'AI-generated visuals, downloaded photos or videos, and copyrighted music are not allowed.', 'Do not include vulgar, hateful, violent, offensive, or unsafe content.', 'The submission deadline is the event day.', 'A surprise creative challenge may take place on the event day. Its task and details are still to be decided.', 'Judging considers creativity, clarity of message, visual quality, originality, and how well the advertisement communicates its idea. Scoring weights are not stated.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/IP0fNXq97q1HxwvZZfBepk',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000109';

update public.events set
  rules = array['A team may have up to 4 members. Only registered members may take part, and every team member must attend.', 'Each team has 15 minutes to pitch, followed by 5 minutes for questions and answers.', 'The pitch should explain the problem, solution, target market, business model, what makes the idea different, finances, funding requested, and the share of the business offered in return.', 'A PowerPoint, prototype, or other visual aid is optional. The submission method, deadline, and file requirements will be decided later.', 'Only one person should speak at a time unless the judges ask otherwise.', 'Be professional, respect the judges, and arrive on time. Late teams may lose their slot.', 'Do not present copied ideas, illegal or unethical concepts, misleading claims, or offensive content.', 'Disqualification may occur for repeated time-limit violations, offensive content, rule-breaking, late reporting, or plagiarism.', 'Arrive 30 minutes early for registration, setup, and briefing.', 'Bring any laptop, charger, pen drive, or props you need. Organisers are not responsible for device problems. Tell organisers about special technical needs in advance.', 'Event photos and videos may be used for promotion. Your business idea remains your intellectual property.', 'Judging considers creativity, problem-solution fit, market understanding, feasibility, financial clarity, presentation skills, and teamwork. Scoring weights are not stated.', 'Funding is not guaranteed. The funding amount, selection process, timing, and terms are still to be decided.']::text[],
  whatsapp_url = 'https://chat.whatsapp.com/LlDgpiBb9BNL7Fcz8tmTpe',
  updated_at = now()
where id = '00000000-0000-4000-8000-000000000110';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/JvUiz9gX6E5EAoFA3G9mfi',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000002';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/KZFyGt6qKCNJK2cy19Go41',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000003';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/KULDg4U0Lqp2Jr5S16cbTh',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000004';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/CxHt2lJT8Yr3iPE5B2w6tq',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000005';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/GoWj1wgz5YJEWgpPaNb2an',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000007';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/LWdjh6gWPD57ZhARxiuo7C',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000008';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/LJukQmm5exR7XZb1eDLsO6',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000010';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/CwUoMqlgLRPAp8cIbs789E',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000012';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/IP0fNXq97q1HxwvZZfBepk',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000013';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/Ech2uSiCQzDJpPqYxVKxjY',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000015';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/KFQ1LdHAcHh23DN78WwjT3',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000016';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/D8oBzPb5gnTBl25Pp6Xm8Y',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000017';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/DjFOJkSEfDFJHKeT4ld8sX',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000019';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/FwBRyZgTjowAyDwFCIuajn',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000020';

update public.events set
  whatsapp_url = 'https://chat.whatsapp.com/LlDgpiBb9BNL7Fcz8tmTpe',
  updated_at = now()
where id = '20260000-0000-4000-8000-000000000022';
