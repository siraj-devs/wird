INSERT INTO categories (name)
VALUES
  ('إدراك تكبيرة الإحرام جماعة'),
  ('السنن الرواتب'),
  ('الأذكار')
ON CONFLICT (name) DO NOTHING;


INSERT INTO tasks (name, category_id, days)
SELECT t.name, c.id, t.days
FROM (
  VALUES
    ('صلاة الفجر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('صلاة الظهر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('صلاة العصر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('صلاة المغرب', ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('صلاة العشاء', ARRAY[1,2,3,4,5,6,7]::INTEGER[])
) AS t(name, days)
JOIN categories c ON c.name = 'إدراك تكبيرة الإحرام جماعة'
ON CONFLICT (name) DO NOTHING;

INSERT INTO tasks (name, category_id, days)
SELECT t.name, c.id, t.days
FROM (
  VALUES
    ('ركعتين قبل الفجر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('أربع ركعات قبل الظهر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('ركعتين بعد الظهر',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('ركعتين بعد المغرب',  ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('ركعتين بعد العشاء',  ARRAY[1,2,3,4,5,6,7]::INTEGER[])
) AS t(name, days)
JOIN categories c ON c.name = 'السنن الرواتب'
ON CONFLICT (name) DO NOTHING;

INSERT INTO tasks (name, category_id, days)
SELECT t.name, c.id, t.days
FROM (
  VALUES
    ('الصباح', ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('المساء', ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('النوم', ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
    ('الاستيقاظ', ARRAY[1,2,3,4,5,6,7]::INTEGER[])
) AS t(name, days)
JOIN categories c ON c.name = 'الأذكار'
ON CONFLICT (name) DO NOTHING;


INSERT INTO tasks (name, days)
VALUES
  ('قيام الثلث الأخير من الليل', ARRAY[3,6]::INTEGER[]),
  ('الصوم', ARRAY[3,6]::INTEGER[]),
  ('قراءة نصف حزب من القرآن الكريم', ARRAY[1,2,3,4,5,6,7]::INTEGER[]),
  ('قراءة تفسير القرآن الكريم', ARRAY[1,2,3,4,5]::INTEGER[])
ON CONFLICT (name) DO NOTHING;
