-- =============================================================================
-- Tagalog for the demo lesson and the technique glossary.
--
-- Shows the bilingual path working end to end and gives Joemarie a reference
-- for the register to write in. Safe to re-run.
-- =============================================================================

update public.techniques set
  name_tl = t.name_tl, description_tl = t.description_tl
from (values
  ('marinating', 'Pag-marinate',
   'Pagbabad ng pagkain sa tinimplang sabaw bago lutuin para sumipsip ito ng lasa at lumambot.'),
  ('sauteing', 'Pagsangkutsa',
   'Mabilisang pagluluto ng pagkain sa kaunting mainit na mantika sa katamtaman hanggang mataas na apoy, hinahalo nang madalas para pantay ang pagkaluto at hindi masunog.'),
  ('simmering', 'Marahang pagpapakulo',
   'Pagluluto ng pagkain sa sabaw na katatapos lang kumulo, kung saan maliliit na bula lang ang umaakyat. Ang mahinang init ang nagpapalambot sa karne at naghahalo sa mga lasa.'),
  ('boiling', 'Pagpapakulo',
   'Pagluluto ng pagkain sa tubig na malakas ang kulo, mga 100°C. Ginagamit sa pasta, itlog, at mga ugat na gulay.'),
  ('frying', 'Pagprito',
   'Pagluluto ng pagkain sa mainit na mantika hanggang maging ginintuang at malutong ang labas.'),
  ('baking', 'Pagbe-bake',
   'Pagluluto ng pagkain sa tuyong init ng oven. Karaniwang ginagamit sa tinapay, cake, at pastry.'),
  ('grilling', 'Pag-ihaw',
   'Pagluluto ng pagkain nang direkta sa mainit na uling o apoy, na nagbibigay ng marka at usok na lasa.'),
  ('steaming', 'Pagpapasingaw',
   'Pagluluto ng pagkain gamit ang singaw ng kumukulong tubig nang hindi ito nadidikit sa tubig. Mas napapanatili nito ang sustansya at kulay kaysa sa pagpapakulo.')
) as t(slug, name_tl, description_tl)
where public.techniques.slug = t.slug;

update public.categories set name_tl = t.name_tl
from (values
  ('poultry', 'Manok at Ibon'),
  ('meat', 'Karne'),
  ('fish', 'Isda'),
  ('vegetables', 'Gulay'),
  ('pasta', 'Pasta'),
  ('baking', 'Pagbe-bake'),
  ('desserts', 'Panghimagas'),
  ('other-cookery-topics', 'Iba pang Paksa sa Pagluluto')
) as t(slug, name_tl)
where public.categories.slug = t.slug;

do $$
declare
  v_recipe uuid;
  v_quiz   uuid;
  v_q      uuid;
begin
  select id into v_recipe from public.recipes where slug = 'chicken-adobo';
  if v_recipe is null then
    raise notice 'Chicken Adobo not found — run supabase/seed.sql first.';
    return;
  end if;

  update public.recipes set
    title_tl = 'Adobong Manok',
    description_tl = 'Klasikong putaheng Pilipino na manok na nilaga sa toyo, suka, bawang, at dahon ng laurel. '
      || 'Magandang unang aralin ang adobo dahil natututuhan dito ang pag-marinate, pagsangkutsa, at marahang pagpapakulo sa iisang recipe.',
    objectives_tl = array[
      'Matukoy ang mga sangkap na kailangan sa recipe.',
      'Maipaliwanag ang tamang paraan ng pagluluto.',
      'Maisagawa ang wastong kaligtasan at kalinisan sa kusina.',
      'Maisagawa nang tama ang paraan ng pagluluto.'
    ],
    safety_notes_tl = array[
      'Maghugas ng kamay gamit ang sabon at tubig bago humawak ng pagkain.',
      'Panatilihing malinis at tuyo ang lugar na pinagtatrabahuhan.',
      'Gumamit ng malinis na kagamitan sa pagluluto at chopping board.',
      'Hawakan nang maayos ang kutsilyo — humiwa palayo sa iyong katawan.',
      'Iwasan ang cross-contamination: huwag gamitin ang iisang board para sa hilaw na manok at sa gulay.',
      'Siguraduhing lutong-luto ang manok bago ihain.',
      'Itago nang maayos ang natirang sangkap sa lalagyang may takip.'
    ],
    chef_tips_tl = array[
      'Siguraduhing mainit na ang kawali bago ilagay ang mga sangkap.',
      'Huwag haluin agad ang timpla pagkatapos ilagay ang suka — hayaan munang kumulo para mawala ang matalim na lasa.',
      'Pakuluan nang marahan sa mahinang apoy para mas lumambot ang manok.'
    ]
  where id = v_recipe;

  update public.ingredients set quantity_tl = t.q, item_tl = t.i, note_tl = t.n
  from (values
    (1, '1 kilo',      'manok',           'hiniwa sa serving pieces'),
    (2, '½ tasa',      'toyo',            null),
    (3, '½ tasa',      'suka',            null),
    (4, '4 na butil',  'bawang',          'dinurog'),
    (5, '2 piraso',    'dahon ng laurel', null),
    (6, '1 kutsarita', 'paminta',         'buo o giniling'),
    (7, '1 tasa',      'tubig',           null)
  ) as t(ord, q, i, n)
  where public.ingredients.recipe_id = v_recipe
    and public.ingredients.sort_order = t.ord;

  update public.steps set instruction_tl = t.instruction
  from (values
    (1, 'Ihanda at linisin ang lahat ng sangkap.'),
    (2, 'I-marinate ang manok sa toyo at bawang nang hindi bababa sa 30 minuto.'),
    (3, 'Painitin ang kawali at lutuin ang manok hanggang bahagyang mag-brown ang lahat ng gilid.'),
    (4, 'Idagdag ang natitirang sangkap — suka, dahon ng laurel, paminta, at tubig.'),
    (5, 'Pakuluan nang marahan sa mahinang apoy hanggang lutong-luto at malambot ang manok.'),
    (6, 'Ihain nang maayos sa malinis na plato habang mainit.')
  ) as t(num, instruction)
  where public.steps.recipe_id = v_recipe and public.steps.step_number = t.num;

  select id into v_quiz from public.quizzes where recipe_id = v_recipe;
  if v_quiz is null then return; end if;

  update public.quizzes set
    title_tl = 'Adobong Manok — Pagsusulit sa Aralin',
    instructions_tl = 'Basahing mabuti ang bawat tanong at piliin ang pinakamahusay na sagot. Maaari mong ulitin ang pagsusulit para tumaas ang iyong iskor.'
  where id = v_quiz;

  -- Q1
  select id into v_q from public.questions where quiz_id = v_quiz and sort_order = 1;
  update public.questions set prompt_tl = 'Ano ang dapat gawin bago ihanda ang mga sangkap?' where id = v_q;
  update public.choices set body_tl = t.body from (values
    ('A', 'Magluto agad'),
    ('B', 'Maghugas ng kamay at ihanda ang lugar na pagtatrabahuhan'),
    ('C', 'Patayin ang kalan'),
    ('D', 'Ihain ang pagkain')
  ) as t(lbl, body) where public.choices.question_id = v_q and public.choices.label = t.lbl;

  -- Q2
  select id into v_q from public.questions where quiz_id = v_quiz and sort_order = 2;
  update public.questions set
    prompt_tl = 'Aling dalawang likido ang nagbibigay sa Adobong Manok ng natatangi nitong lasa?',
    explanation_tl = 'Ang toyo ang nagbibigay ng maalat na lasa at ang suka naman ang nagbibigay ng asim.'
  where id = v_q;
  update public.choices set body_tl = t.body from (values
    ('A', 'Toyo at suka'),
    ('B', 'Tubig at mantika'),
    ('C', 'Gatas at suka'),
    ('D', 'Toyo at gatas')
  ) as t(lbl, body) where public.choices.question_id = v_q and public.choices.label = t.lbl;

  -- Q3
  select id into v_q from public.questions where quiz_id = v_quiz and sort_order = 3;
  update public.questions set
    prompt_tl = 'Ano ang tawag sa pagbabad ng manok sa toyo at bawang bago lutuin?',
    explanation_tl = 'Sa pag-marinate, sumisipsip ang manok ng lasa at lumalambot ito.'
  where id = v_q;
  update public.choices set body_tl = t.body from (values
    ('A', 'Pagpapakulo'), ('B', 'Pag-ihaw'), ('C', 'Pag-marinate'), ('D', 'Pagpapasingaw')
  ) as t(lbl, body) where public.choices.question_id = v_q and public.choices.label = t.lbl;

  -- Q4
  select id into v_q from public.questions where quiz_id = v_quiz and sort_order = 4;
  update public.questions set
    prompt_tl = 'Bakit dapat iwasang gamitin ang iisang chopping board para sa hilaw na manok at sa gulay?',
    explanation_tl = 'Ito ay tinatawag na cross-contamination at isa ito sa pinakakaraniwang sanhi ng food poisoning.'
  where id = v_q;
  update public.choices set body_tl = t.body from (values
    ('A', 'Nagiging maalat ang gulay'),
    ('B', 'Maaaring makahawa ng bakterya sa gulay'),
    ('C', 'Mas mabilis pumurol ang kutsilyo'),
    ('D', 'Mas maraming tubig ang nagagamit sa paghuhugas')
  ) as t(lbl, body) where public.choices.question_id = v_q and public.choices.label = t.lbl;

  -- Q5
  select id into v_q from public.questions where quiz_id = v_quiz and sort_order = 5;
  update public.questions set
    prompt_tl = 'Ang pagluluto ng adobo sa sabaw na katatapos lang kumulo, na maliliit na bula lang ang umaakyat, ay tinatawag na:',
    explanation_tl = 'Sa marahang pagpapakulo, mahina ang init kaya lumalambot ang manok at naghahalo ang mga lasa.'
  where id = v_q;
  update public.choices set body_tl = t.body from (values
    ('A', 'Pagprito'), ('B', 'Pagbe-bake'), ('C', 'Marahang pagpapakulo'), ('D', 'Pag-ihaw')
  ) as t(lbl, body) where public.choices.question_id = v_q and public.choices.label = t.lbl;

  raise notice 'Tagalog seeded for Chicken Adobo.';
end;
$$;
