-- =============================================================================
-- Recipe Keeper — demo content
--
-- One fully filled-in lesson, taken from the worked example in the
-- specification, so there is a reference to copy when authoring the real
-- recipes. Safe to re-run, and safe to delete once real content exists.
--
-- Apply with:  psql "$DATABASE_URL" -f supabase/seed.sql
-- or paste into the Supabase SQL editor.
-- =============================================================================

do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  ---------------------------------------------------------------------------
  -- Recipe
  ---------------------------------------------------------------------------
  insert into public.recipes (
    title, slug, category_id, description, video_url,
    objectives, safety_notes, chef_tips,
    prep_minutes, cook_minutes, servings, difficulty,
    is_published, sort_order
  )
  values (
    'Chicken Adobo',
    'chicken-adobo',
    (select id from public.categories where slug = 'poultry'),
    'A classic Filipino dish of chicken simmered in soy sauce, vinegar, garlic, and bay leaves. '
      || 'Adobo is a good first lesson because it teaches marinating, sautéing, and simmering in one recipe.',
    null,
    array[
      'Identify the ingredients needed for the recipe.',
      'Explain the correct cooking procedure.',
      'Apply proper kitchen safety and sanitation.',
      'Perform the cooking procedure correctly.'
    ],
    array[
      'Wash your hands with soap and water before handling food.',
      'Keep the work area clean and dry at all times.',
      'Use clean cooking utensils and cutting boards.',
      'Handle knives properly — cut away from your body.',
      'Avoid cross-contamination: never use the same board for raw chicken and vegetables.',
      'Make sure the chicken is cooked all the way through before serving.',
      'Store leftover ingredients properly in a covered container.'
    ],
    array[
      'Make sure the pan is properly heated before adding the ingredients.',
      'Do not stir the mixture right after adding the vinegar — let it boil first so the sharp taste cooks off.',
      'Simmer over low heat for a more tender chicken.'
    ],
    15, 45, 4, 'easy',
    true, 1
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  ---------------------------------------------------------------------------
  -- Techniques used
  ---------------------------------------------------------------------------
  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('marinating', 1), ('sauteing', 2), ('simmering', 3)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  ---------------------------------------------------------------------------
  -- Ingredients
  ---------------------------------------------------------------------------
  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, sort_order)
  values
    (v_recipe, '1 kg',       'chicken',    'cut into serving pieces', 1),
    (v_recipe, '½ cup',      'soy sauce',  null,                      2),
    (v_recipe, '½ cup',      'vinegar',    null,                      3),
    (v_recipe, '4 cloves',   'garlic',     'crushed',                 4),
    (v_recipe, '2 pieces',   'bay leaves', null,                      5),
    (v_recipe, '1 teaspoon', 'pepper',     'whole or ground',         6),
    (v_recipe, '1 cup',      'water',      null,                      7);

  ---------------------------------------------------------------------------
  -- Procedure
  ---------------------------------------------------------------------------
  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction)
  values
    (v_recipe, 1, 'Prepare and clean all ingredients.'),
    (v_recipe, 2, 'Marinate the chicken with soy sauce and garlic for at least 30 minutes.'),
    (v_recipe, 3, 'Heat the pan and cook the chicken until lightly browned on all sides.'),
    (v_recipe, 4, 'Add the remaining ingredients — vinegar, bay leaves, pepper, and water.'),
    (v_recipe, 5, 'Simmer over low heat until the chicken is completely cooked and tender.'),
    (v_recipe, 6, 'Serve properly on a clean plate while hot.');

  ---------------------------------------------------------------------------
  -- Quiz
  ---------------------------------------------------------------------------
  insert into public.quizzes (recipe_id, title, instructions, passing_percentage, is_published)
  values (
    v_recipe,
    'Chicken Adobo — Lesson Quiz',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    75,
    true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  -- Q1 — the worked example from the specification
  insert into public.questions (quiz_id, prompt, sort_order)
  values (v_quiz, 'What should be done before preparing the ingredients?', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, sort_order) values
    (v_q, 'A', 'Start cooking immediately',                1),
    (v_q, 'B', 'Wash hands and prepare the work area',     2),
    (v_q, 'C', 'Turn off the stove',                       3),
    (v_q, 'D', 'Serve the food',                           4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  -- Q2
  insert into public.questions (quiz_id, prompt, explanation, sort_order)
  values (v_quiz,
          'Which two liquids give Chicken Adobo its characteristic taste?',
          'Soy sauce provides the salty, savoury flavour and vinegar provides the sourness.',
          2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, sort_order) values
    (v_q, 'A', 'Soy sauce and vinegar',   1),
    (v_q, 'B', 'Water and cooking oil',   2),
    (v_q, 'C', 'Milk and vinegar',        3),
    (v_q, 'D', 'Soy sauce and milk',      4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  -- Q3
  insert into public.questions (quiz_id, prompt, explanation, sort_order)
  values (v_quiz,
          'What is the correct term for soaking the chicken in soy sauce and garlic before cooking?',
          'Marinating lets the chicken absorb flavour and become more tender.',
          3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, sort_order) values
    (v_q, 'A', 'Boiling',     1),
    (v_q, 'B', 'Grilling',    2),
    (v_q, 'C', 'Marinating',  3),
    (v_q, 'D', 'Steaming',    4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  -- Q4
  insert into public.questions (quiz_id, prompt, explanation, sort_order)
  values (v_quiz,
          'Why should you avoid using the same cutting board for raw chicken and vegetables?',
          'This is called cross-contamination and it is one of the most common causes of food poisoning.',
          4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, sort_order) values
    (v_q, 'A', 'It makes the vegetables taste salty',            1),
    (v_q, 'B', 'It can spread harmful bacteria to the vegetables', 2),
    (v_q, 'C', 'It makes the knife dull faster',                 3),
    (v_q, 'D', 'It uses more water when washing',                4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  -- Q5
  insert into public.questions (quiz_id, prompt, explanation, sort_order)
  values (v_quiz,
          'Cooking the adobo in liquid just below boiling, with only small bubbles rising, is called:',
          'Simmering uses gentle heat, which keeps the chicken tender and lets the flavours blend.',
          5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, sort_order) values
    (v_q, 'A', 'Frying',     1),
    (v_q, 'B', 'Baking',     2),
    (v_q, 'C', 'Simmering',  3),
    (v_q, 'D', 'Grilling',   4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Chicken Adobo (recipe %, quiz %)', v_recipe, v_quiz;
end;
$$;
