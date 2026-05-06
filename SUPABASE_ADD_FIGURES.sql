-- Aura Farmer — additional figures
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Safe to run multiple times (ON CONFLICT DO NOTHING skips duplicates)

insert into figures (name, slug, description, avatar_initials, avatar_color, score)
values
  -- Streamers & creators
  ('IShowSpeed',       'ishowspeed',       'Streamer & YouTube phenomenon',          'IS', '#c62828', 3800),
  ('Kai Cenat',        'kai-cenat',        'Twitch record-breaker & AMP member',     'KC', '#1565c0', 4200),
  ('MrBeast',          'mrbeast',          'YouTube philanthropist & game show host','MB', '#2e7d32', 5100),
  ('xQc',              'xqc',              'Twitch superstar & variety streamer',    'XQ', '#4527a0', 2300),
  ('Adin Ross',        'adin-ross',        'Streamer & internet personality',        'AR', '#e65100', 1100),
  ('Pokimane',         'pokimane',         'Twitch streamer & content creator',      'PO', '#ad1457', 2700),
  ('KSI',              'ksi',              'YouTuber, boxer & music artist',         'KS', '#283593', 3400),
  ('Logan Paul',       'logan-paul',       'YouTuber, boxer & WWE star',             'LP', '#f57f17', 1600),
  ('Ninja',            'ninja',            'Pro gamer & Fortnite icon',              'NI', '#1565c0', 1200),
  ('Shroud',           'shroud',           'FPS god & former pro CS player',         'SH', '#37474f', 1800),
  ('Valkyrae',         'valkyrae',         'YouTube gaming streamer',                'VA', '#6a1b9a', 2100),
  ('Hasan Piker',      'hasan-piker',      'Political streamer & commentator',       'HP', '#b71c1c', 1400),

  -- Anime characters (because they have aura)
  ('Gojo Satoru',      'gojo-satoru',      'Jujutsu Kaisen — The Honored One',       'GS', '#1a237e', 6200),
  ('Toji Fushiguro',   'toji-fushiguro',   'Jujutsu Kaisen — Sorcerer Killer',       'TF', '#212121', 5400),
  ('Itadori Yuji',     'itadori-yuji',     'Jujutsu Kaisen — host of Ryomen Sukuna', 'IY', '#b71c1c', 4100),
  ('Zoro Roronoa',     'zoro-roronoa',     'One Piece — pirate hunter swordsman',    'ZR', '#2e7d32', 5700),
  ('Levi Ackermann',   'levi-ackermann',   'Attack on Titan — humanity''s strongest','LA', '#37474f', 5900),
  ('Naruto Uzumaki',   'naruto-uzumaki',   'Naruto — 7th Hokage & never giving up',  'NU', '#e65100', 5300),
  ('Goku',             'goku',             'Dragon Ball — limitless Saiyan warrior', 'GK', '#1565c0', 5800),
  ('Vegeta',           'vegeta',           'Dragon Ball — Prince of all Saiyans',    'VG', '#311b92', 4600),
  ('Luffy',            'luffy',            'One Piece — King of the Pirates',        'LF', '#c62828', 5500),
  ('Sukuna',           'sukuna',           'Jujutsu Kaisen — King of Curses',        'SK', '#880e4f', 4900),

  -- Music
  ('Travis Scott',     'travis-scott',     'Rapper & Astroworld architect',          'TS', '#4a148c', 2800),
  ('Playboi Carti',    'playboi-carti',    'Rapper & fashion icon',                  'PC', '#b71c1c', 3200),
  ('Ice Spice',        'ice-spice',        'Rapper & NYC it-girl',                   'IC', '#f57f17', 2600),
  ('Kanye West',       'kanye-west',       'Rapper, designer & visionary',           'KW', '#212121', 900),
  ('Lil Uzi Vert',     'lil-uzi-vert',     'Rapper & alien from Mars',               'LU', '#6a1b9a', 2200),
  ('Central Cee',      'central-cee',      'UK drill rapper',                        'CC', '#1a237e', 2400),
  ('Cardi B',          'cardi-b',          'Rapper & internet personality',          'CB', '#880e4f', 1900),
  ('21 Savage',        '21-savage',        'Atlanta rapper & British citizen',       '21', '#212121', 2100),

  -- Sports
  ('Cristiano Ronaldo','cristiano-ronaldo','All-time top scorer | Al Nassr',         'CR', '#c62828', 4400),
  ('Lionel Messi',     'lionel-messi',     'GOAT | Inter Miami',                     'LM', '#1565c0', 4800),
  ('Neymar Jr',        'neymar-jr',        'Brazilian football icon',                'NJ', '#fbc02d', 1500),
  ('Kylian Mbappe',    'kylian-mbappe',    'Real Madrid & France forward',           'KM', '#c62828', 3700),
  ('LeBron James',     'lebron-james',     'NBA legend & billionaire athlete',       'LJ', '#c62828', 3100),
  ('Steph Curry',      'steph-curry',      '4× NBA champion & greatest shooter',    'SC', '#f9a825', 3600),

  -- Culture & other
  ('Andrew Tate',      'andrew-tate',      'Influencer & Top G',                     'AT', '#37474f', 400),
  ('Charli D''Amelio',  'charli-damelio',   'TikTok''s original mega star',            'CD', '#ad1457', 2000),
  ('Addison Rae',      'addison-rae',      'TikTok creator & actress',               'AD', '#e91e63', 1300),
  ('Zendaya',          'zendaya',          'Actress & fashion icon',                 'ZE', '#6a1b9a', 4300),
  ('Timothée Chalamet','timothee-chalamet','Actor & style icon',                     'TC', '#1a237e', 3900),
  ('Sabrina Carpenter','sabrina-carpenter','Pop star & short king ally',             'SB', '#fbc02d', 4000),
  ('Olivia Rodrigo',   'olivia-rodrigo',   'Singer-songwriter & Gen Z voice',        'OR', '#6a1b9a', 3500),
  ('Doja Cat',         'doja-cat',         'Rapper, singer & chaotic icon',          'DC', '#880e4f', 3000),
  ('Tyler the Creator','tyler-the-creator','Rapper, producer & creative director',  'TY', '#2e7d32', 4100),
  ('Bad Bunny',        'bad-bunny',        'Reggaeton king & Puerto Rican icon',     'BB', '#6a1b9a', 3800)
on conflict (slug) do nothing;
