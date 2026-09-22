-- Seed Galaxia 2025
insert into events (id, title, subtitle, description, date, venue, address, college_name, contact_email, contact_phone, instagram_url, youtube_url, x_url, hero_cta, hero_secondary_cta, about_title, about_text1, about_text2, seo_title, seo_description)
values (
  'galaxia-2025',
  'GALAXIA',
  'WHERE MUSIC MEETS THE COSMOS',
  'Three days. Four stages. Fifty thousand souls under one nebula sky. The largest college music festival returns for its most electrifying edition yet.',
  'Dec 19–21 · 2025',
  'Western College of Business Management',
  'Western College Campus, Main Ground, Mumbai, Maharashtra',
  'Western College of Business Management',
  'hello@galaxiafest.in',
  '+91 98765 43210',
  '#',
  '#',
  '#',
  'Reserve My Pass',
  'Watch Highlights',
  'A festival out of this world.',
  'Galaxia is not just a festival — it is an interstellar rite of passage. Born on a college campus in 2013 with a single stage and a dream, we have become the most anticipated cultural gathering in the region.',
  'From bass-shaking headliners and student anthems, to hackathons under the stars, cosplay parades, cinema on the lawn and midnight art installations — every corner of Galaxia is designed to feel like stepping through a wormhole into a universe built by, and for, the next generation.',
  'Galaxia 2025 — Where Music Meets the Cosmos',
  'Galaxia is the premier college music festival by Western College of Business Management — a galactic fusion of sound, light, and celebration.'
) on conflict (id) do nothing;

insert into passes (id, event_id, name, slug, description, benefits, price, capacity, sold_count, is_active, display_order) values
('regular','galaxia-2025','Regular','regular','General admission — common & back rows','["General entry — all 3 days","Back rows & standing zone","Access to 4 stages","Food court access"]',499,2000,342,true,1),
('silver','galaxia-2025','Silver','silver','Mid-tier — middle rows, elevated view','["Everything in Regular","Middle rows reserved","Priority entry lane","Exclusive Silver lounge"]',999,800,412,true,2),
('gold','galaxia-2025','Gold Premium','gold-premium','Front rows — closest to stage, premium','["Everything in Silver","Front rows — closest to stage","Meet & greet lottery","Premium bar + merch kit","Backstage photo zone"]',1999,300,178,true,3)
on conflict (id) do nothing;

insert into artists (id, event_id, name, bio, genre, role, year, image_url, display_order, featured, size, orbit, duration, start_angle, spin, label, glow, accent) values
('arijit','galaxia-2025','ARIJIT SINGH','The voice of a generation. Soulful anthems and unforgettable melodies.','Bollywood · Playback','Main Stage Headliner · Sun 21','2025','https://images.unsplash.com/photo-1595422656857-ced3a4a0ce25?auto=format&fit=crop&w=600&q=80',1,true,118,190,34,20,5,'#EC4899','rgba(236,72,153,0.65)','#F9A8D4'),
('raftaar','galaxia-2025','RAFTAAR','Delhi-born hip-hop machine. Machine-gun flows and stadium energy.','Hip-Hop · Rap','Void Stage · Sat 20','2025','https://images.unsplash.com/photo-1591251436930-a1e858c633a1?auto=format&fit=crop&w=600&q=80',2,true,96,270,46,140,4,'#8B5CF6','rgba(139,92,246,0.6)','#C084FC'),
('neha','galaxia-2025','NEHA KAKKAR','Chart-topping pop powerhouse. Non-stop dance floor bangers.','Pop · Bollywood','Cosmos Stage · Fri 19','2025','https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?auto=format&fit=crop&w=600&q=80',3,false,88,350,60,260,6,'#22D3EE','rgba(34,211,238,0.55)','#67E8F9'),
('diljit','galaxia-2025','DILJIT DOSANJH','Global Punjabi icon. From Coachella to the cosmos.','Punjabi · Global Pop','Main Stage Co-Headliner · Sat 20','2025','https://images.unsplash.com/photo-1587397845856-e6cf49176c70?auto=format&fit=crop&w=600&q=80',4,true,104,430,74,60,4.5,'#F59E0B','rgba(245,158,11,0.55)','#FCD34D'),
('shreya','galaxia-2025','SHREYA GHOSHAL','Voice that stops galaxies. Starlight condensed into sound.','Classical · Playback','Cosmos Stage · Fri 19','2025','https://images.unsplash.com/photo-1522863602463-afebb8886ab2?auto=format&fit=crop&w=600&q=80',5,false,82,510,88,200,7,'#5EEAD4','rgba(94,234,212,0.55)','#99F6E4'),
('apdhillon','galaxia-2025','AP DHILLON','Modern Punjabi wave. Moody synths, hazy vocals.','Punjabi · R&B','Void Stage · Sun 21','2025','https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&w=600&q=80',6,false,92,590,104,320,5.5,'#F472B6','rgba(244,114,182,0.55)','#F9A8D4')
on conflict (id) do nothing;

insert into schedule_items (id, event_id, time, title, description, venue, display_order) values
('s1','galaxia-2025','Fri 19 — 04:00 PM','Cosmic Gates Open','Wristband collection & nebula entrance','Main Ground',1),
('s2','galaxia-2025','Fri 19 — 07:00 PM','Shreya Ghoshal · Neha Kakkar','Cosmos Stage double header','Cosmos Stage',2),
('s3','galaxia-2025','Sat 20 — 06:30 PM','Raftaar · Diljit Dosanjh','Hip-hop to global Punjabi takeover','Main + Void Stage',3),
('s4','galaxia-2025','Sun 21 — 08:00 PM','Arijit Singh · AP Dhillon','Grand finale under the nebula sky','Main Stage',4)
on conflict (id) do nothing;

insert into faqs (id, event_id, question, answer, display_order) values
('f1','galaxia-2025','Where is Galaxia held?','At Western College of Business Management campus, Main Ground. Exact map pins will be emailed after booking.',1),
('f2','galaxia-2025','Are passes per day or for all 3 days?','All passes cover all 3 days (Dec 19–21). Single-day upgrades can be requested at the help desk.',2),
('f3','galaxia-2025','What’s the difference between Regular / Silver / Gold?','Regular = back/standing, Silver = middle reserved + lounge, Gold Premium = front rows + meet & greet lottery + merch kit.',3),
('f4','galaxia-2025','Can I transfer my pass?','Passes are tied to email/phone but transfer is allowed until Dec 18 via support.',4),
('f5','galaxia-2025','Is there an age limit?','Open to all college students & guests. Carry valid college ID.',5),
('f6','galaxia-2025','Refunds?','Full refund until Dec 10, 50% until Dec 15, no refund after door opens.',6)
on conflict (id) do nothing;
