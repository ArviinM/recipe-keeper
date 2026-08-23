-- =============================================================================
-- Filipino starter library for the Grade 9 Cookery module.
--
-- One lesson per category, each complete in English and Tagalog with
-- objectives, ingredients, procedure, techniques, safety reminders, chef's tips
-- and a five-item quiz.
--
-- These are a starting point, not finished research content: the teacher should
-- review the wording and add his own photographs before the study runs.
-- Safe to re-run.
-- =============================================================================


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Sinigang na Baboy', 'Sinigang na Baboy', 'sinigang-na-baboy',
    (select id from public.categories where slug = 'meat'),
    'A sour Filipino soup of pork simmered with tamarind and vegetables. It teaches simmering and how souring agents change the taste of a dish.', 'Maasim na sabaw ng baboy na niluto sa sampalok at gulay. Dito natututuhan ang marahang pagpapakulo at kung paano nagbabago ang lasa ng putahe dahil sa pampaasim.',
    array['Identify the ingredients needed for Sinigang na Baboy.', 'Explain why the souring agent is added at the right time.', 'Apply proper kitchen safety and sanitation.', 'Cook a pork sinigang with a balanced sour taste.'], array['Matukoy ang mga sangkap na kailangan sa Sinigang na Baboy.', 'Maipaliwanag kung bakit sa tamang oras idinadagdag ang pampaasim.', 'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.', 'Makapagluto ng sinigang na baboy na tama ang timpla ng asim.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Add the kangkong at the very end so it stays green and crisp.', 'Taste before adding more souring agent — you cannot take sourness back out.', 'Skim the foam off the top for a clearer broth.'], array['Huling-huli ilagay ang kangkong para manatiling berde at malutong.', 'Tikman muna bago dagdagan ng pampaasim — hindi na maaalis ang asim kapag sumobra.', 'Alisin ang bula sa ibabaw para mas linaw ang sabaw.'],
    15, 50, 5, 'easy', true, 2
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '1 kg', 'pork belly', 'cut into serving pieces', '1 kilo', 'liyempo', 'hiniwa sa serving pieces', 1),
    (v_recipe, '1 pack', 'tamarind soup mix', 'or fresh sampaloc', '1 pakete', 'pampaasim na sampalok', 'o sariwang sampalok', 2),
    (v_recipe, '1 piece', 'onion', 'quartered', '1 piraso', 'sibuyas', 'hiniwa sa apat', 3),
    (v_recipe, '2 pieces', 'tomatoes', 'quartered', '2 piraso', 'kamatis', 'hiniwa sa apat', 4),
    (v_recipe, '1 bunch', 'kangkong', 'leaves separated', '1 bigkis', 'kangkong', 'hiwalay ang dahon', 5),
    (v_recipe, '6 pieces', 'string beans', 'cut into 2 inches', '6 piraso', 'sitaw', 'hiniwa nang 2 pulgada', 6),
    (v_recipe, '2 pieces', 'radish', 'sliced', '2 piraso', 'labanos', 'hiniwa', 7),
    (v_recipe, '8 cups', 'water', null, '8 tasa', 'tubig', null, 8);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Boil the water, then add the pork, onion and tomatoes.', 'Pakuluan ang tubig, pagkatapos ilagay ang baboy, sibuyas at kamatis.'),
    (v_recipe, 2, 'Simmer over low heat until the pork is tender, about 40 minutes.', 'Pakuluan nang marahan sa mahinang apoy hanggang lumambot ang baboy, mga 40 minuto.'),
    (v_recipe, 3, 'Add the radish and string beans and cook until almost soft.', 'Idagdag ang labanos at sitaw at lutuin hanggang halos lumambot.'),
    (v_recipe, 4, 'Stir in the tamarind mix and season with salt or fish sauce.', 'Ihalo ang pampaasim na sampalok at timplahan ng asin o patis.'),
    (v_recipe, 5, 'Add the kangkong last and turn off the heat immediately.', 'Huling ilagay ang kangkong at agad patayin ang apoy.'),
    (v_recipe, 6, 'Serve hot with rice.', 'Ihain nang mainit kasama ng kanin.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('boiling', 1), ('simmering', 2)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Sinigang na Baboy — Lesson Quiz',
    'Sinigang na Baboy — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which ingredient makes sinigang sour?', 'Aling sangkap ang nagpapaasim sa sinigang?', 'Tamarind, or sampaloc, is the traditional souring agent.', 'Ang sampalok ang tradisyonal na pampaasim.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Tamarind', 'Sampalok', 1),
    (v_q, 'B', 'Vinegar', 'Suka', 2),
    (v_q, 'C', 'Soy sauce', 'Toyo', 3),
    (v_q, 'D', 'Sugar', 'Asukal', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'When should the kangkong be added?', 'Kailan dapat ilagay ang kangkong?', 'Adding it last keeps it green and crisp instead of overcooked.', 'Kapag huling inilagay, nananatili itong berde at malutong.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'At the very beginning', 'Sa pinakaumpisa', 1),
    (v_q, 'B', 'With the pork', 'Kasabay ng baboy', 2),
    (v_q, 'C', 'At the very end', 'Sa pinakahuli', 3),
    (v_q, 'D', 'After serving', 'Pagkatapos ihain', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Cooking in liquid just below boiling is called:', 'Ang pagluluto sa sabaw na katatapos lang kumulo ay tinatawag na:', 'Gentle heat keeps the pork tender.', 'Ang mahinang init ang nagpapalambot sa baboy.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Frying', 'Pagprito', 1),
    (v_q, 'B', 'Simmering', 'Marahang pagpapakulo', 2),
    (v_q, 'C', 'Grilling', 'Pag-ihaw', 3),
    (v_q, 'D', 'Baking', 'Pagbe-bake', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why should you taste before adding more souring mix?', 'Bakit dapat tikman muna bago dagdagan ng pampaasim?', 'You can always add more, but you cannot take it out.', 'Puwedeng dagdagan, pero hindi na maaalis.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It cooks faster', 'Mas mabilis maluto', 1),
    (v_q, 'B', 'Sourness cannot be removed once added', 'Hindi na maaalis ang asim kapag naidagdag na', 2),
    (v_q, 'C', 'It changes the colour', 'Nagbabago ang kulay', 3),
    (v_q, 'D', 'It saves water', 'Nakakatipid sa tubig', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which is a correct safety practice while cooking sinigang?', 'Alin ang tamang gawi sa kaligtasan habang nagluluto ng sinigang?', 'Handles turned inward cannot be knocked over.', 'Hindi matatabig ang kaldero kapag nakapasok ang hawakan.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Turn pot handles outward', 'Ipalabas ang hawakan ng kaldero', 1),
    (v_q, 'B', 'Turn pot handles inward', 'Ipasok papaloob ang hawakan ng kaldero', 2),
    (v_q, 'C', 'Leave the stove unattended', 'Iwanan ang kalan', 3),
    (v_q, 'D', 'Use the same board for meat and vegetables', 'Gamitin ang iisang board sa karne at gulay', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Sinigang na Baboy';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Pinakbet', 'Pinakbet', 'pinakbet',
    (select id from public.categories where slug = 'vegetables'),
    'A vegetable dish from the Ilocos region flavoured with shrimp paste. It teaches sautéing and how to cook vegetables without turning them mushy.', 'Putaheng gulay mula sa Ilocos na tinimplahan ng bagoong. Dito natututuhan ang pagsangkutsa at kung paano lutuin ang gulay nang hindi nalalata.',
    array['Identify the vegetables used in pinakbet.', 'Explain the correct order of adding vegetables.', 'Apply proper kitchen safety and sanitation.', 'Cook pinakbet with vegetables that keep their shape.'], array['Matukoy ang mga gulay na ginagamit sa pinakbet.', 'Maipaliwanag ang tamang pagkakasunod-sunod ng paglalagay ng gulay.', 'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.', 'Makapagluto ng pinakbet na hindi nalalata ang gulay.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Add the vegetables from hardest to softest so nothing overcooks.', 'Shake the pan instead of stirring, so the vegetables keep their shape.', 'Soak sliced ampalaya in salted water first if you want it less bitter.'], array['Ilagay ang gulay mula sa pinakamatigas hanggang pinakamalambot para walang masyadong maluto.', 'Alugin ang kawali sa halip na haluin, para hindi madurog ang gulay.', 'Ibabad muna ang hiniwang ampalaya sa tubig na may asin kung ayaw mo ng masyadong mapait.'],
    15, 25, 4, 'easy', true, 3
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '2 tablespoons', 'cooking oil', null, '2 kutsara', 'mantika', null, 1),
    (v_recipe, '4 cloves', 'garlic', 'minced', '4 na butil', 'bawang', 'tinadtad', 2),
    (v_recipe, '1 piece', 'onion', 'sliced', '1 piraso', 'sibuyas', 'hiniwa', 3),
    (v_recipe, '2 tablespoons', 'shrimp paste', 'bagoong', '2 kutsara', 'bagoong', null, 4),
    (v_recipe, '1 piece', 'ampalaya', 'sliced', '1 piraso', 'ampalaya', 'hiniwa', 5),
    (v_recipe, '1 piece', 'eggplant', 'sliced', '1 piraso', 'talong', 'hiniwa', 6),
    (v_recipe, '6 pieces', 'okra', 'trimmed', '6 piraso', 'okra', 'ginupit ang dulo', 7),
    (v_recipe, '1 cup', 'squash', 'cubed', '1 tasa', 'kalabasa', 'hiniwa sa cubes', 8);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Heat the oil and sauté the garlic and onion until fragrant.', 'Painitin ang mantika at igisa ang bawang at sibuyas hanggang bumango.'),
    (v_recipe, 2, 'Add the shrimp paste and cook for one minute.', 'Idagdag ang bagoong at lutuin nang isang minuto.'),
    (v_recipe, 3, 'Add the squash first because it takes longest to soften.', 'Unahin ang kalabasa dahil ito ang pinakamatagal lumambot.'),
    (v_recipe, 4, 'Add the okra, eggplant and ampalaya. Do not stir too much.', 'Idagdag ang okra, talong at ampalaya. Huwag masyadong haluin.'),
    (v_recipe, 5, 'Cover and cook over low heat until the vegetables are just tender.', 'Takpan at lutuin sa mahinang apoy hanggang katamtaman ang lambot ng gulay.'),
    (v_recipe, 6, 'Serve hot with rice.', 'Ihain nang mainit kasama ng kanin.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('sauteing', 1), ('simmering', 2)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Pinakbet — Lesson Quiz',
    'Pinakbet — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which vegetable should be added first?', 'Aling gulay ang dapat unahing ilagay?', 'Squash takes the longest to soften.', 'Ang kalabasa ang pinakamatagal lumambot.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Ampalaya', 'Ampalaya', 1),
    (v_q, 'B', 'Squash', 'Kalabasa', 2),
    (v_q, 'C', 'Okra', 'Okra', 3),
    (v_q, 'D', 'Eggplant', 'Talong', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What gives pinakbet its salty flavour?', 'Ano ang nagbibigay ng alat sa pinakbet?', 'Bagoong is the traditional seasoning.', 'Ang bagoong ang tradisyonal na pampalasa.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Shrimp paste', 'Bagoong', 1),
    (v_q, 'B', 'Sugar', 'Asukal', 2),
    (v_q, 'C', 'Vinegar', 'Suka', 3),
    (v_q, 'D', 'Milk', 'Gatas', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why shake the pan instead of stirring?', 'Bakit mas mainam alugin ang kawali kaysa haluin?', 'Too much stirring breaks the vegetables apart.', 'Nadudurog ang gulay kapag sobrang hinalo.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It cooks faster', 'Mas mabilis maluto', 1),
    (v_q, 'B', 'The vegetables keep their shape', 'Hindi nadudurog ang gulay', 2),
    (v_q, 'C', 'It uses less oil', 'Mas kaunti ang mantika', 3),
    (v_q, 'D', 'It is quieter', 'Mas tahimik', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Cooking quickly in a little hot oil is called:', 'Ang mabilisang pagluluto sa kaunting mainit na mantika ay tinatawag na:', 'Sautéing builds the flavour base of the dish.', 'Ang pagsangkutsa ang nagbibigay ng pundasyon ng lasa.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Boiling', 'Pagpapakulo', 1),
    (v_q, 'B', 'Steaming', 'Pagpapasingaw', 2),
    (v_q, 'C', 'Sautéing', 'Pagsangkutsa', 3),
    (v_q, 'D', 'Baking', 'Pagbe-bake', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What should you do before handling any food?', 'Ano ang dapat gawin bago humawak ng anumang pagkain?', 'Handwashing is the first rule of kitchen sanitation.', 'Ang paghuhugas ng kamay ang unang tuntunin sa kalinisan.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Start cooking immediately', 'Magluto agad', 1),
    (v_q, 'B', 'Wash your hands with soap and water', 'Maghugas ng kamay gamit ang sabon at tubig', 2),
    (v_q, 'C', 'Turn off the stove', 'Patayin ang kalan', 3),
    (v_q, 'D', 'Serve the food', 'Ihain ang pagkain', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Pinakbet';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Pancit Bihon', 'Pancit Bihon', 'pancit-bihon',
    (select id from public.categories where slug = 'pasta'),
    'Rice noodles stir-fried with vegetables and meat, served at almost every Filipino celebration. It teaches sautéing and how to cook noodles without breaking them.', 'Bihon na iginisa kasama ng gulay at karne, laging nasa handaan ng mga Pilipino. Dito natututuhan ang pagsangkutsa at kung paano lutuin ang pansit nang hindi nadudurog.',
    array['Identify the ingredients needed for pancit bihon.', 'Explain why the noodles are soaked before cooking.', 'Apply proper kitchen safety and sanitation.', 'Cook pancit bihon with separate, non-sticky noodles.'], array['Matukoy ang mga sangkap na kailangan sa pancit bihon.', 'Maipaliwanag kung bakit ibinabad muna ang bihon bago lutuin.', 'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.', 'Makapagluto ng pancit bihon na hindi magkadikit ang sabaw.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Soak the noodles, do not boil them, or they will turn mushy.', 'Use tongs and lift the noodles rather than stirring hard.', 'Cut the vegetables the same size so they cook evenly.'], array['Ibabad lang ang bihon, huwag pakuluan, dahil malalata ito.', 'Gumamit ng sipit at angatin ang pansit sa halip na haluing malakas.', 'Pantay-pantayin ang laki ng hiniwang gulay para sabay-sabay maluto.'],
    20, 25, 6, 'medium', true, 4
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '250 g', 'rice noodles', 'bihon', '250 g', 'bihon', null, 1),
    (v_recipe, '2 tablespoons', 'cooking oil', null, '2 kutsara', 'mantika', null, 2),
    (v_recipe, '4 cloves', 'garlic', 'minced', '4 na butil', 'bawang', 'tinadtad', 3),
    (v_recipe, '1 piece', 'onion', 'sliced', '1 piraso', 'sibuyas', 'hiniwa', 4),
    (v_recipe, '200 g', 'chicken breast', 'sliced thinly', '200 g', 'dibdib ng manok', 'hiniwa nang manipis', 5),
    (v_recipe, '1 cup', 'cabbage', 'shredded', '1 tasa', 'repolyo', 'hiniwa nang manipis', 6),
    (v_recipe, '1 piece', 'carrot', 'cut into strips', '1 piraso', 'karot', 'hiniwa nang pahaba', 7),
    (v_recipe, '3 tablespoons', 'soy sauce', null, '3 kutsara', 'toyo', null, 8),
    (v_recipe, '2 cups', 'chicken broth', null, '2 tasa', 'sabaw ng manok', null, 9);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Soak the bihon in water for 10 minutes, then drain.', 'Ibabad ang bihon sa tubig nang 10 minuto, pagkatapos patuluin.'),
    (v_recipe, 2, 'Heat the oil and sauté the garlic and onion.', 'Painitin ang mantika at igisa ang bawang at sibuyas.'),
    (v_recipe, 3, 'Add the chicken and cook until it is no longer pink.', 'Idagdag ang manok at lutuin hanggang mawala ang pagkahilaw.'),
    (v_recipe, 4, 'Add the carrot and cabbage and stir-fry briefly.', 'Idagdag ang karot at repolyo at bahagyang igisa.'),
    (v_recipe, 5, 'Pour in the broth and soy sauce, then bring to a boil.', 'Ibuhos ang sabaw at toyo, pagkatapos pakuluan.'),
    (v_recipe, 6, 'Add the drained noodles and toss until the liquid is absorbed.', 'Ilagay ang pinatuyong bihon at haluin hanggang maupos ang sabaw.'),
    (v_recipe, 7, 'Serve hot with calamansi on the side.', 'Ihain nang mainit na may kalamansi sa gilid.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('sauteing', 1), ('boiling', 2)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Pancit Bihon — Lesson Quiz',
    'Pancit Bihon — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What should you do to the bihon before cooking?', 'Ano ang dapat gawin sa bihon bago lutuin?', 'Soaking softens the noodles without making them mushy.', 'Lumalambot ang bihon sa pagbabad nang hindi nalalata.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Boil it for 10 minutes', 'Pakuluan nang 10 minuto', 1),
    (v_q, 'B', 'Soak it in water', 'Ibabad sa tubig', 2),
    (v_q, 'C', 'Fry it in oil', 'Iprito sa mantika', 3),
    (v_q, 'D', 'Freeze it', 'Ilagay sa freezer', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why cut the vegetables to the same size?', 'Bakit dapat pantay-pantay ang laki ng hiniwang gulay?', 'Even sizes mean everything finishes cooking together.', 'Pantay ang laki, sabay ang pagkaluto.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'So they cook evenly', 'Para sabay-sabay maluto', 1),
    (v_q, 'B', 'So they look expensive', 'Para magmukhang mahal', 2),
    (v_q, 'C', 'So they weigh less', 'Para gumaan', 3),
    (v_q, 'D', 'So they last longer', 'Para tumagal', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which liquid gives pancit its colour and salt?', 'Aling likido ang nagbibigay ng kulay at alat sa pansit?', 'Soy sauce provides both the colour and the savoury taste.', 'Ang toyo ang nagbibigay ng kulay at linamnam.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Vinegar', 'Suka', 1),
    (v_q, 'B', 'Milk', 'Gatas', 2),
    (v_q, 'C', 'Soy sauce', 'Toyo', 3),
    (v_q, 'D', 'Coconut milk', 'Gata', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why avoid stirring the noodles too hard?', 'Bakit dapat iwasan ang malakas na paghahalo ng pansit?', 'Rice noodles are delicate and break easily.', 'Malambot ang bihon at madaling madurog.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It makes noise', 'Maingay', 1),
    (v_q, 'B', 'The noodles break apart', 'Nadudurog ang pansit', 2),
    (v_q, 'C', 'It burns the pan', 'Nasusunog ang kawali', 3),
    (v_q, 'D', 'It cools the food', 'Lumalamig ang pagkain', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why must raw chicken and vegetables use different boards?', 'Bakit magkaiba dapat ang board para sa hilaw na manok at gulay?', 'This is cross-contamination, a common cause of food poisoning.', 'Ito ang cross-contamination, karaniwang sanhi ng food poisoning.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It looks tidier', 'Mas maayos tingnan', 1),
    (v_q, 'B', 'To avoid spreading bacteria', 'Para hindi kumalat ang bakterya', 2),
    (v_q, 'C', 'To save water', 'Para makatipid sa tubig', 3),
    (v_q, 'D', 'To keep knives sharp', 'Para hindi pumurol ang kutsilyo', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Pancit Bihon';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Escabecheng Isda', 'Escabecheng Isda', 'escabecheng-isda',
    (select id from public.categories where slug = 'fish'),
    'Fried fish topped with a sweet and sour sauce. It teaches frying and how to balance sweet, sour and salty in one sauce.', 'Piniritong isda na nilagyan ng maasim-matamis na sarsa. Dito natututuhan ang pagprito at kung paano tinitimpla ang tamis, asim at alat sa iisang sarsa.',
    array['Identify the ingredients needed for escabeche.', 'Explain how to fry fish safely.', 'Apply proper kitchen safety and sanitation.', 'Prepare a balanced sweet and sour sauce.'], array['Matukoy ang mga sangkap na kailangan sa escabeche.', 'Maipaliwanag kung paano ligtas na magprito ng isda.', 'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.', 'Makagawa ng sarsang tama ang timpla ng tamis at asim.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Dry the fish well before frying — wet fish makes hot oil splatter.', 'Lower the fish away from you so any splash goes in the other direction.', 'Taste the sauce before thickening it; adjust the sugar or vinegar then.'], array['Patuyuin nang husto ang isda bago iprito — nagtatalsik ang mainit na mantika kapag basa.', 'Ilagay ang isda palayo sa iyo para pataas ang talsik sa kabilang direksyon.', 'Tikman ang sarsa bago palaputin; doon mo iayos ang asukal o suka.'],
    20, 30, 4, 'medium', true, 5
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '1 whole', 'fish', 'tilapia or lapu-lapu, cleaned', '1 buo', 'isda', 'tilapia o lapu-lapu, nilinis', 1),
    (v_recipe, '1 cup', 'cooking oil', 'for frying', '1 tasa', 'mantika', 'pangprito', 2),
    (v_recipe, '1/2 cup', 'vinegar', null, '1/2 tasa', 'suka', null, 3),
    (v_recipe, '1/4 cup', 'sugar', null, '1/4 tasa', 'asukal', null, 4),
    (v_recipe, '1 piece', 'carrot', 'cut into strips', '1 piraso', 'karot', 'hiniwa nang pahaba', 5),
    (v_recipe, '1 piece', 'bell pepper', 'sliced', '1 piraso', 'bell pepper', 'hiniwa', 6),
    (v_recipe, '1 thumb', 'ginger', 'sliced', '1 hinlalaki', 'luya', 'hiniwa', 7),
    (v_recipe, '1 tablespoon', 'cornstarch', 'dissolved in water', '1 kutsara', 'cornstarch', 'tinunaw sa tubig', 8);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Pat the fish completely dry and season it with salt.', 'Punasan nang husto ang isda hanggang matuyo at budburan ng asin.'),
    (v_recipe, 2, 'Heat the oil and fry the fish until golden on both sides.', 'Painitin ang mantika at iprito ang isda hanggang maging ginintuan ang magkabilang gilid.'),
    (v_recipe, 3, 'Set the fish aside on a plate lined with paper towel.', 'Ilagay ang isda sa platong may papel na pantanggal ng mantika.'),
    (v_recipe, 4, 'In another pan, sauté the ginger, then add the vinegar and sugar.', 'Sa ibang kawali, igisa ang luya, pagkatapos ilagay ang suka at asukal.'),
    (v_recipe, 5, 'Add the carrot and bell pepper and simmer for two minutes.', 'Idagdag ang karot at bell pepper at pakuluan nang marahan ng dalawang minuto.'),
    (v_recipe, 6, 'Pour in the dissolved cornstarch and stir until the sauce thickens.', 'Ibuhos ang tinunaw na cornstarch at haluin hanggang lumapot ang sarsa.'),
    (v_recipe, 7, 'Pour the sauce over the fried fish and serve.', 'Ibuhos ang sarsa sa ibabaw ng piniritong isda at ihain.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('frying', 1), ('sauteing', 2), ('simmering', 3)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Escabecheng Isda — Lesson Quiz',
    'Escabecheng Isda — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why must the fish be dried before frying?', 'Bakit dapat patuyuin ang isda bago iprito?', 'Water hitting hot oil causes dangerous splattering.', 'Nagtatalsik ang mainit na mantika kapag tinamaan ng tubig.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It cooks faster', 'Mas mabilis maluto', 1),
    (v_q, 'B', 'Wet fish makes hot oil splatter', 'Nagtatalsik ang mainit na mantika kapag basa', 2),
    (v_q, 'C', 'It tastes sweeter', 'Mas tumatamis', 3),
    (v_q, 'D', 'It uses less oil', 'Mas kaunti ang mantika', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which two ingredients make the sauce sweet and sour?', 'Aling dalawang sangkap ang nagpapaasim at nagpapatamis ng sarsa?', 'Vinegar gives the sourness and sugar balances it.', 'Ang suka ang nagpapaasim, ang asukal ang nagbabalanse.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Vinegar and sugar', 'Suka at asukal', 1),
    (v_q, 'B', 'Soy sauce and water', 'Toyo at tubig', 2),
    (v_q, 'C', 'Milk and salt', 'Gatas at asin', 3),
    (v_q, 'D', 'Oil and garlic', 'Mantika at bawang', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What thickens the escabeche sauce?', 'Ano ang nagpapalapot sa sarsa ng escabeche?', 'Cornstarch dissolved in water thickens the sauce.', 'Ang cornstarch na tinunaw sa tubig ang nagpapalapot.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Flour', 'Harina', 1),
    (v_q, 'B', 'Cornstarch', 'Cornstarch', 2),
    (v_q, 'C', 'Sugar', 'Asukal', 3),
    (v_q, 'D', 'Vinegar', 'Suka', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Cooking food in hot oil until golden is called:', 'Ang pagluluto sa mainit na mantika hanggang maging ginintuan ay tinatawag na:', 'Frying gives the fish its crisp golden surface.', 'Ang pagprito ang nagbibigay ng malutong na balat.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Frying', 'Pagprito', 1),
    (v_q, 'B', 'Steaming', 'Pagpapasingaw', 2),
    (v_q, 'C', 'Boiling', 'Pagpapakulo', 3),
    (v_q, 'D', 'Grilling', 'Pag-ihaw', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which direction should you lower fish into hot oil?', 'Saang direksyon dapat ilagay ang isda sa mainit na mantika?', 'Lowering it away sends any splash in the other direction.', 'Palayo ang talsik kapag palayo mo inilagay.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Toward yourself', 'Papunta sa iyo', 1),
    (v_q, 'B', 'Away from yourself', 'Palayo sa iyo', 2),
    (v_q, 'C', 'Drop it from high up', 'Ihulog mula sa mataas', 3),
    (v_q, 'D', 'It does not matter', 'Wala namang pinagkaiba', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Escabecheng Isda';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Ginisang Munggo', 'Ginisang Munggo', 'ginisang-munggo',
    (select id from public.categories where slug = 'other-cookery-topics'),
    'Mung beans simmered until soft and sautéed with garlic and vegetables. A cheap, high-protein dish that teaches boiling and sautéing together.', 'Munggo na pinakuluan hanggang lumambot at iginisa sa bawang at gulay. Murang putaheng mataas sa protina na nagtuturo ng pagpapakulo at pagsangkutsa.',
    array['Identify the ingredients needed for ginisang munggo.', 'Explain why the mung beans are boiled before sautéing.', 'Apply proper kitchen safety and sanitation.', 'Cook ginisang munggo with soft, well-seasoned beans.'], array['Matukoy ang mga sangkap na kailangan sa ginisang munggo.', 'Maipaliwanag kung bakit pinakukuluan muna ang munggo bago igisa.', 'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.', 'Makapagluto ng ginisang munggo na malambot at tama ang timpla.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Boil the beans first — sautéing alone will never soften them.', 'Add the malunggay at the end so it does not turn dark.', 'Add more water if the dish becomes too thick as it simmers.'], array['Pakuluan muna ang munggo — hindi ito lalambot sa pagsangkutsa lang.', 'Huling ilagay ang malunggay para hindi mangitim.', 'Dagdagan ng tubig kung lumapot nang husto habang kumukulo.'],
    10, 45, 5, 'easy', true, 6
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '1 cup', 'mung beans', 'washed', '1 tasa', 'munggo', 'hinugasan', 1),
    (v_recipe, '6 cups', 'water', null, '6 tasa', 'tubig', null, 2),
    (v_recipe, '2 tablespoons', 'cooking oil', null, '2 kutsara', 'mantika', null, 3),
    (v_recipe, '4 cloves', 'garlic', 'minced', '4 na butil', 'bawang', 'tinadtad', 4),
    (v_recipe, '1 piece', 'onion', 'chopped', '1 piraso', 'sibuyas', 'tinadtad', 5),
    (v_recipe, '2 pieces', 'tomatoes', 'chopped', '2 piraso', 'kamatis', 'tinadtad', 6),
    (v_recipe, '1 bunch', 'malunggay leaves', null, '1 bigkis', 'dahon ng malunggay', null, 7),
    (v_recipe, '2 tablespoons', 'fish sauce', null, '2 kutsara', 'patis', null, 8);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Boil the mung beans in water until they are soft and start to break apart.', 'Pakuluan ang munggo sa tubig hanggang lumambot at magsimulang mabuka.'),
    (v_recipe, 2, 'In a separate pan, heat the oil and sauté the garlic, onion and tomatoes.', 'Sa ibang kawali, painitin ang mantika at igisa ang bawang, sibuyas at kamatis.'),
    (v_recipe, 3, 'Pour the cooked mung beans into the sautéed mixture.', 'Ibuhos ang lutong munggo sa iginisang timpla.'),
    (v_recipe, 4, 'Season with fish sauce and simmer for five minutes.', 'Timplahan ng patis at pakuluan nang marahan ng limang minuto.'),
    (v_recipe, 5, 'Add the malunggay leaves and turn off the heat.', 'Ilagay ang dahon ng malunggay at patayin ang apoy.'),
    (v_recipe, 6, 'Serve hot with rice.', 'Ihain nang mainit kasama ng kanin.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('boiling', 1), ('sauteing', 2), ('simmering', 3)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Ginisang Munggo — Lesson Quiz',
    'Ginisang Munggo — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why are the mung beans boiled before sautéing?', 'Bakit pinakukuluan muna ang munggo bago igisa?', 'Sautéing alone will never soften dried beans.', 'Hindi lalambot ang tuyong munggo sa pagsangkutsa lang.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'To make them soft', 'Para lumambot', 1),
    (v_q, 'B', 'To make them sweet', 'Para tumamis', 2),
    (v_q, 'C', 'To change their colour', 'Para magbago ang kulay', 3),
    (v_q, 'D', 'To remove the smell', 'Para mawala ang amoy', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'When should the malunggay be added?', 'Kailan dapat ilagay ang malunggay?', 'Adding it last keeps it green instead of dark.', 'Nananatiling berde kapag huling inilagay.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'At the beginning', 'Sa umpisa', 1),
    (v_q, 'B', 'With the water', 'Kasabay ng tubig', 2),
    (v_q, 'C', 'At the end', 'Sa huli', 3),
    (v_q, 'D', 'After serving', 'Pagkatapos ihain', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What is used to season ginisang munggo?', 'Ano ang ginagamit na pampalasa sa ginisang munggo?', 'Patis gives the dish its salty, savoury taste.', 'Ang patis ang nagbibigay ng alat at linamnam.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Fish sauce', 'Patis', 1),
    (v_q, 'B', 'Sugar', 'Asukal', 2),
    (v_q, 'C', 'Vinegar', 'Suka', 3),
    (v_q, 'D', 'Coconut milk', 'Gata', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Mung beans are a good source of:', 'Ang munggo ay magandang pagkukunan ng:', 'Mung beans are an inexpensive source of protein.', 'Murang pagkukunan ng protina ang munggo.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Protein', 'Protina', 1),
    (v_q, 'B', 'Oil', 'Mantika', 2),
    (v_q, 'C', 'Sugar', 'Asukal', 3),
    (v_q, 'D', 'Salt', 'Asin', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What should you do with leftover ingredients?', 'Ano ang dapat gawin sa natirang sangkap?', 'Covered storage keeps food safe from contamination.', 'Ligtas sa dumi ang pagkaing may takip.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Leave them on the counter', 'Iwanan sa lamesa', 1),
    (v_q, 'B', 'Store them in a covered container', 'Itago sa lalagyang may takip', 2),
    (v_q, 'C', 'Throw them on the floor', 'Itapon sa sahig', 3),
    (v_q, 'D', 'Mix them with cooked food', 'Ihalo sa lutong pagkain', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Ginisang Munggo';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Leche Flan', 'Leche Flan', 'leche-flan',
    (select id from public.categories where slug = 'desserts'),
    'A steamed custard with a caramel top, served at Filipino celebrations. It teaches steaming and how to make caramel safely.', 'Pinasingawang custard na may karamelo sa ibabaw, laging nasa handaan ng mga Pilipino. Dito natututuhan ang pagpapasingaw at ang ligtas na paggawa ng karamelo.',
    array['Identify the ingredients needed for leche flan.', 'Explain why the mixture is strained before steaming.', 'Apply proper kitchen safety when making caramel.', 'Steam a leche flan with a smooth, firm texture.'], array['Matukoy ang mga sangkap na kailangan sa leche flan.', 'Maipaliwanag kung bakit sinasala ang timpla bago pasingawan.', 'Maisagawa ang kaligtasan sa kusina sa paggawa ng karamelo.', 'Makapagluto ng leche flan na makinis at matatag ang tekstura.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Mix gently — beating hard puts bubbles in the custard.', 'Straining is what makes the texture smooth.', 'Melted sugar is far hotter than boiling water; never touch it.'], array['Dahan-dahan lang maghalo — nagkakabula ang custard kapag malakas ang paghahalo.', 'Ang pagsala ang nagpapakinis ng tekstura.', 'Mas mainit ang tunaw na asukal kaysa kumukulong tubig; huwag itong hawakan.'],
    20, 40, 6, 'medium', true, 7
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '10 pieces', 'egg yolks', null, '10 piraso', 'pula ng itlog', null, 1),
    (v_recipe, '1 can', 'condensed milk', '390 g', '1 lata', 'condensed milk', '390 g', 2),
    (v_recipe, '1 can', 'evaporated milk', '370 ml', '1 lata', 'evaporated milk', '370 ml', 3),
    (v_recipe, '1 teaspoon', 'vanilla extract', null, '1 kutsarita', 'vanilla extract', null, 4),
    (v_recipe, '1/2 cup', 'sugar', 'for the caramel', '1/2 tasa', 'asukal', 'para sa karamelo', 5),
    (v_recipe, '2 tablespoons', 'water', 'for the caramel', '2 kutsara', 'tubig', 'para sa karamelo', 6);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Melt the sugar and water in the llanera over low heat until golden.', 'Tunawin ang asukal at tubig sa llanera sa mahinang apoy hanggang maging ginintuan.'),
    (v_recipe, 2, 'Tilt the llanera to spread the caramel, then set it aside to cool.', 'Ikiling ang llanera para kumalat ang karamelo, pagkatapos itabi para lumamig.'),
    (v_recipe, 3, 'Mix the egg yolks, condensed milk, evaporated milk and vanilla gently.', 'Dahan-dahang haluin ang pula ng itlog, condensed milk, evaporated milk at vanilla.'),
    (v_recipe, 4, 'Strain the mixture to remove any lumps.', 'Salain ang timpla para maalis ang anumang buo-buo.'),
    (v_recipe, 5, 'Pour the mixture over the cooled caramel and cover with foil.', 'Ibuhos ang timpla sa ibabaw ng lumamig na karamelo at takpan ng foil.'),
    (v_recipe, 6, 'Steam over medium heat for about 35 minutes until set.', 'Pasingawan sa katamtamang apoy nang mga 35 minuto hanggang tumigas.'),
    (v_recipe, 7, 'Cool completely, then turn it over onto a plate to serve.', 'Palamigin nang husto, pagkatapos baligtarin sa plato bago ihain.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('steaming', 1)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Leche Flan — Lesson Quiz',
    'Leche Flan — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why is the mixture strained before steaming?', 'Bakit sinasala ang timpla bago pasingawan?', 'Straining is what gives leche flan its smooth texture.', 'Ang pagsala ang nagpapakinis ng leche flan.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'To make it sweeter', 'Para tumamis', 1),
    (v_q, 'B', 'To remove lumps and make it smooth', 'Para maalis ang buo-buo at makinis ito', 2),
    (v_q, 'C', 'To cool it down', 'Para lumamig', 3),
    (v_q, 'D', 'To add air', 'Para magkahangin', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Cooking with the steam of boiling water is called:', 'Ang pagluluto gamit ang singaw ng kumukulong tubig ay tinatawag na:', 'Steam cooks the custard gently and evenly.', 'Marahan at pantay ang pagkaluto ng custard sa singaw.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Frying', 'Pagprito', 1),
    (v_q, 'B', 'Grilling', 'Pag-ihaw', 2),
    (v_q, 'C', 'Steaming', 'Pagpapasingaw', 3),
    (v_q, 'D', 'Baking', 'Pagbe-bake', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why should you mix the custard gently?', 'Bakit dapat dahan-dahan lang haluin ang custard?', 'Beating hard traps air bubbles in the finished flan.', 'Nagkakabula ang flan kapag malakas ang paghahalo.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'To avoid bubbles', 'Para hindi magkabula', 1),
    (v_q, 'B', 'To save time', 'Para makatipid sa oras', 2),
    (v_q, 'C', 'To make it thicker', 'Para lumapot', 3),
    (v_q, 'D', 'To cool it faster', 'Para mas mabilis lumamig', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Which part of the egg is used in leche flan?', 'Aling parte ng itlog ang ginagamit sa leche flan?', 'Leche flan uses egg yolks, which make it rich.', 'Pula ng itlog ang ginagamit, kaya malinamnam ito.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'The white only', 'Puti lamang', 1),
    (v_q, 'B', 'The yolk only', 'Pula lamang', 2),
    (v_q, 'C', 'The shell', 'Balat', 3),
    (v_q, 'D', 'The whole egg always', 'Laging buong itlog', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why must melted sugar be handled carefully?', 'Bakit dapat maingat sa tunaw na asukal?', 'Caramel causes serious burns; never touch it.', 'Malubhang paso ang dulot ng karamelo; huwag hawakan.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It is much hotter than boiling water', 'Mas mainit ito kaysa kumukulong tubig', 1),
    (v_q, 'B', 'It is very cold', 'Napakalamig nito', 2),
    (v_q, 'C', 'It is poisonous', 'Nakakalason ito', 3),
    (v_q, 'D', 'It stains clothes', 'Nakakamantsa ito', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Leche Flan';
end;
$$;


do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
  v_c      uuid;
begin
  insert into public.recipes (
    title, title_tl, slug, category_id, description, description_tl,
    objectives, objectives_tl, safety_notes, safety_notes_tl,
    chef_tips, chef_tips_tl, prep_minutes, cook_minutes, servings,
    difficulty, is_published, sort_order
  ) values (
    'Bibingka', 'Bibingka', 'bibingka',
    (select id from public.categories where slug = 'baking'),
    'A rice cake baked with coconut milk and topped with salted egg and cheese, traditionally eaten at Christmas. It teaches baking and measuring accurately.', 'Kakanin na hinurno kasama ang gata at nilalagyan ng itlog na maalat at keso, kinakain tuwing Pasko. Dito natututuhan ang pagbe-bake at tamang pagsukat.',
    array['Identify the ingredients needed for bibingka.', 'Explain why baking needs accurate measurements.', 'Apply proper kitchen safety when using an oven.', 'Bake a bibingka that is cooked through and evenly browned.'], array['Matukoy ang mga sangkap na kailangan sa bibingka.', 'Maipaliwanag kung bakit kailangan ng tumpak na sukat sa pagbe-bake.', 'Maisagawa ang kaligtasan sa paggamit ng oven.', 'Makapaghurno ng bibingkang lutong-luto at pantay ang pagkabrown.'],
    array['Wash your hands with soap and water before handling food.', 'Keep the work area clean and dry at all times.', 'Use clean cooking utensils and cutting boards.', 'Handle knives properly — cut away from your body.', 'Avoid cross-contamination: never use the same board for raw meat and vegetables.', 'Turn pot handles inward so they cannot be knocked over.', 'Store leftover ingredients properly in a covered container.'], array['Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.', 'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.', 'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.', 'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.', 'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na karne at sa gulay.', 'Ipasok papaloob ang hawakan ng kaldero para hindi ito matabig.', 'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'],
    array['Measure exactly — baking does not forgive guesswork the way stewing does.', 'Always use dry oven mitts; a wet cloth carries heat straight to your hand.', 'The bibingka is done when a toothpick comes out clean.'], array['Sukatin nang tama — hindi kayang palampasin ng pagbe-bake ang hula-hula, di gaya ng nilaga.', 'Laging gumamit ng tuyong oven mitts; dumidiretso ang init sa kamay kapag basa ang tela.', 'Luto na ang bibingka kapag malinis ang labas ng palito.'],
    20, 30, 6, 'medium', true, 8
  )
  on conflict (slug) do update set title = excluded.title
  returning id into v_recipe;

  delete from public.ingredients where recipe_id = v_recipe;
  insert into public.ingredients (recipe_id, quantity, item, note, quantity_tl, item_tl, note_tl, sort_order) values
    (v_recipe, '2 cups', 'rice flour', null, '2 tasa', 'galapong o rice flour', null, 1),
    (v_recipe, '1 tablespoon', 'baking powder', null, '1 kutsara', 'baking powder', null, 2),
    (v_recipe, '1/2 cup', 'sugar', null, '1/2 tasa', 'asukal', null, 3),
    (v_recipe, '2 pieces', 'eggs', 'beaten', '2 piraso', 'itlog', 'binati', 4),
    (v_recipe, '1 cup', 'coconut milk', null, '1 tasa', 'gata', null, 5),
    (v_recipe, '1/4 cup', 'butter', 'melted', '1/4 tasa', 'mantikilya', 'tinunaw', 6),
    (v_recipe, '1 piece', 'salted egg', 'sliced, for topping', '1 piraso', 'itlog na maalat', 'hiniwa, pantaas', 7),
    (v_recipe, '1/2 cup', 'cheese', 'grated, for topping', '1/2 tasa', 'keso', 'kinudkod, pantaas', 8);

  delete from public.steps where recipe_id = v_recipe;
  insert into public.steps (recipe_id, step_number, instruction, instruction_tl) values
    (v_recipe, 1, 'Preheat the oven to 180 degrees Celsius.', 'Painitin muna ang oven sa 180 degrees Celsius.'),
    (v_recipe, 2, 'Line the baking pan with banana leaves.', 'Lagyan ng dahon ng saging ang lalagyang pang-bake.'),
    (v_recipe, 3, 'Mix the rice flour, baking powder and sugar in a bowl.', 'Paghaluin ang galapong, baking powder at asukal sa mangkok.'),
    (v_recipe, 4, 'Add the beaten eggs, coconut milk and melted butter, and mix until smooth.', 'Idagdag ang binating itlog, gata at tinunaw na mantikilya, at haluin hanggang makinis.'),
    (v_recipe, 5, 'Pour the batter into the pan and bake for 20 minutes.', 'Ibuhos ang timpla sa lalagyan at i-bake nang 20 minuto.'),
    (v_recipe, 6, 'Top with salted egg and cheese, then bake for 10 minutes more.', 'Lagyan ng itlog na maalat at keso, pagkatapos i-bake pa nang 10 minuto.'),
    (v_recipe, 7, 'Brush with butter and serve warm.', 'Pahiran ng mantikilya at ihain habang mainit-init.');

  delete from public.recipe_techniques where recipe_id = v_recipe;
  insert into public.recipe_techniques (recipe_id, technique_id, sort_order)
  select v_recipe, t.id, x.ord
  from (values ('baking', 1)) as x(slug, ord)
  join public.techniques t on t.slug = x.slug;

  insert into public.quizzes (recipe_id, title, title_tl, instructions, instructions_tl, passing_percentage, is_published)
  values (
    v_recipe,
    'Bibingka — Lesson Quiz',
    'Bibingka — Pagsusulit sa Aralin',
    'Read each question carefully and choose the best answer. You may retake this quiz to improve your score.',
    'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.',
    75, true
  )
  on conflict (recipe_id) do update set title = excluded.title
  returning id into v_quiz;

  delete from public.questions where quiz_id = v_quiz;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why must ingredients be measured accurately in baking?', 'Bakit kailangang tumpak ang sukat ng sangkap sa pagbe-bake?', 'Baking relies on reactions that need correct proportions.', 'Nakasalalay ang pagbe-bake sa reaksyong nangangailangan ng tamang sukat.', 1)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'It costs less', 'Mas mura', 1),
    (v_q, 'B', 'The chemical reaction needs the right amounts', 'Kailangan ng tamang dami para tumama ang reaksyon', 2),
    (v_q, 'C', 'It looks neater', 'Mas maayos tingnan', 3),
    (v_q, 'D', 'It cooks faster', 'Mas mabilis maluto', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'What liquid gives bibingka its Filipino flavour?', 'Anong likido ang nagbibigay ng lasang Pilipino sa bibingka?', 'Coconut milk, or gata, is what makes it distinctly Filipino.', 'Ang gata ang nagbibigay ng natatanging lasang Pilipino.', 2)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Coconut milk', 'Gata', 1),
    (v_q, 'B', 'Vinegar', 'Suka', 2),
    (v_q, 'C', 'Soy sauce', 'Toyo', 3),
    (v_q, 'D', 'Water', 'Tubig', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'A';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'How do you check if the bibingka is cooked?', 'Paano malalaman kung luto na ang bibingka?', 'A clean toothpick means the centre is cooked through.', 'Malinis na palito, luto na ang gitna.', 3)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Smell it', 'Amuyin', 1),
    (v_q, 'B', 'Insert a toothpick and see if it comes out clean', 'Isaksak ang palito at tingnan kung malinis paglabas', 2),
    (v_q, 'C', 'Press the oven door', 'Diinan ang pinto ng oven', 3),
    (v_q, 'D', 'Wait one hour', 'Maghintay ng isang oras', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Cooking with the dry heat of an oven is called:', 'Ang pagluluto sa tuyong init ng oven ay tinatawag na:', 'Baking surrounds the food with dry heat.', 'Napapaligiran ng tuyong init ang pagkain sa pagbe-bake.', 4)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'Steaming', 'Pagpapasingaw', 1),
    (v_q, 'B', 'Boiling', 'Pagpapakulo', 2),
    (v_q, 'C', 'Baking', 'Pagbe-bake', 3),
    (v_q, 'D', 'Frying', 'Pagprito', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'C';
  update public.questions set correct_choice_id = v_c where id = v_q;

  insert into public.questions (quiz_id, prompt, prompt_tl, explanation, explanation_tl, sort_order)
  values (v_quiz, 'Why should oven mitts be dry?', 'Bakit dapat tuyo ang oven mitts?', 'Steam travels through wet fabric and burns quickly.', 'Dumaraan ang singaw sa basang tela at mabilis makapaso.', 5)
  returning id into v_q;
  insert into public.choices (question_id, label, body, body_tl, sort_order) values
    (v_q, 'A', 'They look cleaner', 'Mas malinis tingnan', 1),
    (v_q, 'B', 'Wet cloth carries heat straight to your hand', 'Dumidiretso ang init sa kamay kapag basa ang tela', 2),
    (v_q, 'C', 'They last longer', 'Mas tumatagal', 3),
    (v_q, 'D', 'They weigh less', 'Mas magaan', 4);
  select id into v_c from public.choices where question_id = v_q and label = 'B';
  update public.questions set correct_choice_id = v_c where id = v_q;

  raise notice 'Seeded Bibingka';
end;
$$;
