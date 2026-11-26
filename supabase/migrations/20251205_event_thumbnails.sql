update public.events as e
set image_url = thumbs.image_url,
    image_alt = thumbs.image_alt,
    updated_at = now()
from (values
  ('Dance – Solo', '/solo%20dance.jpg', 'Solo dance performance'),
  ('Dance – Group', '/group%20dance.jpg', 'Group dance performance'),
  ('Ramp Walk (Face of Galaxia)', '/ramp%20walk.jpg', 'Ramp walk contestants'),
  ('Box Cricket (Boundary Breakers)', '/box%20cricket.jpg', 'Box cricket match'),
  ('Carrom (Orbit Strike)', '/carrom.jpg', 'Carrom board'),
  ('Body Posing', '/body%20posing.jpg', 'Body posing performance'),
  ('Stalk the Stock', '/stock%20the%20shock.jpg', 'Stock market challenge'),
  ('Case Toh Banta Hai', '/case%20tho%20banta%20hai.jpg', 'Case competition'),
  ('Debate (Clash of Minds)', '/debate.jpg', 'Debate competition'),
  ('Party Makeup (Infinite Glam)', '/party%20make%20up.jpg', 'Party makeup artists'),
  ('Singing (Echo of Orbit)', '/singing.jpg', 'Singing performance'),
  ('Rap (Cosmic Cypher)', '/Rap.jpg', 'Rap performance'),
  ('Volleyball (Male)', '/vollyball%20male.jpg', 'Men''s volleyball match'),
  ('Volleyball (Female)', '/vollyball%20femail.jpg', 'Women''s volleyball match'),
  ('BGMI (Space Battle)', '/bgmi.jpg', 'BGMI gaming tournament'),
  ('Into the Adverse', '/into%20the%20advise.jpg', 'Adventure challenge'),
  ('Bizz-War', '/bizz%20words.jpg', 'Business war competition')
) as thumbs(event_name, image_url, image_alt)
where e.event_name = thumbs.event_name;
