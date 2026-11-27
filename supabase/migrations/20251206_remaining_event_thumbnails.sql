update public.events as e
set image_url = thumbs.image_url,
    image_alt = thumbs.image_alt,
    updated_at = now()
from (values
  ('Elocution', '/Elocution.jpg', 'Elocution competition'),
  ('FF (Final Zone Arena)', '/ff%20zone%20arena.jpg', 'Final Zone Arena gaming'),
  ('Mehndi (Starlit Hands)', '/menhindi.jpg', 'Mehndi art'),
  ('Treasure Hunt (Unlock the Infinity)', '/treasure%20hunt.jpg', 'Treasure hunt challenge')
) as thumbs(event_name, image_url, image_alt)
where e.event_name = thumbs.event_name;
