-- =============================================================================
-- Recipe Keeper — reference data
--
-- Categories and the technique glossary are not demo content: the app needs
-- them to function, so they ship as a migration rather than a seed file.
-- Categories follow section 15 of the specification.
-- =============================================================================

insert into public.categories (name, slug, description, sort_order) values
  ('Poultry',              'poultry',              'Chicken, duck, and other fowl dishes.',        1),
  ('Meat',                 'meat',                 'Pork, beef, and other meat dishes.',           2),
  ('Fish',                 'fish',                 'Fish and other seafood dishes.',               3),
  ('Vegetables',           'vegetables',           'Vegetable-based dishes.',                      4),
  ('Pasta',                'pasta',                'Noodle and pasta dishes.',                     5),
  ('Baking',               'baking',               'Breads, pastries, and other baked products.',  6),
  ('Desserts',             'desserts',             'Sweets and after-meal dishes.',                7),
  ('Other Cookery Topics', 'other-cookery-topics', 'Additional lessons in Cookery.',               8)
on conflict (slug) do nothing;

-- Explanations are written for a Grade 9 reading level, per section 6 of the
-- specification.
insert into public.techniques (name, slug, description, sort_order) values
  ('Sautéing',  'sauteing',
   'Cooking food quickly in a small amount of hot oil over medium to high heat, stirring often so it cooks evenly without burning.', 1),
  ('Boiling',   'boiling',
   'Cooking food in water that is bubbling rapidly at about 100°C. Used for pasta, eggs, and root vegetables.', 2),
  ('Simmering', 'simmering',
   'Cooking food in liquid that is just below boiling, with only small bubbles rising. Gentle heat keeps meat tender and lets flavours blend.', 3),
  ('Frying',    'frying',
   'Cooking food in hot oil until the outside turns golden and crisp. Deep-frying covers the food in oil; pan-frying uses only a shallow layer.', 4),
  ('Baking',    'baking',
   'Cooking food with the dry heat of an oven. Commonly used for bread, cakes, and pastries.', 5),
  ('Grilling',  'grilling',
   'Cooking food directly over hot coals or a flame, giving it grill marks and a smoky flavour.', 6),
  ('Steaming',  'steaming',
   'Cooking food using the steam from boiling water without letting the food touch the water. It keeps more nutrients and colour than boiling.', 7),
  ('Marinating','marinating',
   'Soaking food in a seasoned liquid before cooking so it absorbs flavour and becomes more tender.', 8)
on conflict (slug) do nothing;
