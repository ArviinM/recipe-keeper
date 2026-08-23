# Database Design

Entity-relationship diagram for the Recipe Keeper database, generated from the
live schema.

## Diagram

```mermaid
erDiagram
    attempt_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        uuid choice_id FK
        boolean is_correct
    }
    attempts {
        uuid id PK
        uuid student_id FK
        uuid quiz_id FK
        int attempt_number
        int score
        int total_items
        numeric percentage
        boolean passed
        timestamp submitted_at
    }
    categories {
        uuid id PK
        text name
        text slug
        text description
        text icon
        int sort_order
        timestamp created_at
        timestamp updated_at
    }
    choices {
        uuid id PK
        uuid question_id FK
        text label
        text body
        int sort_order
    }
    ingredients {
        uuid id PK
        uuid recipe_id FK
        text quantity
        text item
        text note
        int sort_order
    }
    profiles {
        uuid id PK
        app_role role
        text full_name
        citext username
        citext email
        uuid section_id FK
        boolean is_active
        boolean must_change_password
        timestamp created_at
        timestamp updated_at
    }
    questions {
        uuid id PK
        uuid quiz_id FK
        text prompt
        text explanation
        int points
        int sort_order
        timestamp created_at
        timestamp updated_at
        uuid correct_choice_id FK
    }
    quizzes {
        uuid id PK
        uuid recipe_id FK
        text title
        text instructions
        int passing_percentage
        boolean reveal_answers
        boolean shuffle_questions
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }
    recipe_techniques {
        uuid recipe_id PK
        uuid technique_id PK
        int sort_order
    }
    recipes {
        uuid id PK
        text title
        text slug
        uuid category_id FK
        text description
        text image_path
        text video_url
        text_array objectives
        text_array safety_notes
        text_array chef_tips
        int prep_minutes
        int cook_minutes
        int servings
        text difficulty
        boolean is_published
        int sort_order
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    sections {
        uuid id PK
        smallint grade_level
        text name
        text school_year
        uuid teacher_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    steps {
        uuid id PK
        uuid recipe_id FK
        int step_number
        text instruction
        text image_path
    }
    techniques {
        uuid id PK
        text name
        text slug
        text description
        int sort_order
        timestamp created_at
        timestamp updated_at
    }

    attempts ||--o{ attempt_answers : "records"
    choices ||--o{ attempt_answers : "chose"
    questions ||--o{ attempt_answers : "for"
    quizzes ||--o{ attempts : "scores"
    profiles ||--o{ attempts : "taken by"
    questions ||--o{ choices : "offered for"
    recipes ||--o{ ingredients : "lists"
    sections ||--o{ profiles : "belongs to"
    choices ||--o{ questions : "answered by"
    quizzes ||--o{ questions : "asks"
    recipes ||--o{ quizzes : "assesses"
    recipes ||--o{ recipe_techniques : "links"
    techniques ||--o{ recipe_techniques : "to"
    profiles ||--o{ recipes : "authored by"
    categories ||--o{ recipes : "grouped under"
    profiles ||--o{ sections : "advised by"
    recipes ||--o{ steps : "sequences"```

## Design notes

**Sections carry the grade level.** A student belongs to a section, and the
section records the grade. Storing the grade on the student as well would let
the two drift apart.

**Cooking techniques are a shared glossary.** "Sautéing" is explained once in
`techniques` and linked to each recipe through `recipe_techniques`, rather than
retyped for every recipe that uses it.

**The answer key lives on the question, not the choice.** `questions.correct_choice_id`
points at one row in `choices`. This makes "exactly one correct answer" true by
construction, and means changing the key is a single atomic update.

**Ingredients and steps are separate tables; objectives, safety notes, and tips
are arrays.** Ingredients and steps need ordering, and steps carry their own
photo, so they earn their own tables. The other three are plain bullet lists
that are only ever rendered as a group, so they stay as array columns on
`recipes` rather than three near-empty tables.

**Every attempt is kept.** `attempts` records each submission with its own
`attempt_number`. Progress reports the best score, but the full history is what
shows improvement over time, which is the point of the study.

## Security

Row level security is enabled on all thirteen tables. The policies that matter
most for the research:

| Table | Student access |
|---|---|
| `questions` | none — served through `get_quiz_for_student()`, which omits the answer key |
| `choices` | none — same |
| `attempts` | read own rows only; **no insert policy at all** |
| `attempt_answers` | read own rows only |
| `recipes` | published rows only |
| `profiles` | own row only |

`attempts` has no insert policy on purpose. Rows are created solely by
`submit_quiz_attempt()`, a `SECURITY DEFINER` function that scores the
submission on the server, so a student cannot post themselves a perfect score.
