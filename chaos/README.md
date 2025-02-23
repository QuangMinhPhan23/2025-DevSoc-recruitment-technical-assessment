> This question is relevant for **chaos backend**

# DevSoc Subcommittee Recruitment: Chaos Backend

***Complete as many questions as you can.***

## Question 1
You have been given a skeleton function `process_data` in the `data.rs` file.
Complete the parameters and body of the function so that given a JSON request of the form

```json
{
  "data": ["Hello", 1, 5, "World", "!"]
}
```

the handler returns the following JSON:
```json
{
  "string_len": 11,
  "int_sum": 6
}
```

Edit the `DataResponse` and `DataRequest` structs as you need.

## Question 2

### a)
Write (Postgres) SQL `CREATE TABLE` statements to create the following schema.
Make sure to include foreign keys for the relationships that will `CASCADE` upon deletion.
![Database Schema](db_schema.png)

**Answer box:**
```sql
CREATE TABLE forms (
    --     Add columns here
    id SERIAL PRIMARY KEY
    title VARCHAR(255) NOT NULL
    description1 VARCHAR(255) NOT NULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    --     Add columns here
    id SERIAL PRIMARY KEY,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_question_type CHECK (question_type IN ('ShortAnswer', 'MultiSelect', 'MultiChoice'))
);

CREATE TABLE question_options (
    --     Add columns here
    id SERIAL PRIMARY KEY, 
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### b)
Using the above schema, write a (Postgres) SQL `SELECT` query to return all questions in the following format, given the form id `26583`:
```
   id    |   form_id   |           title             |   question_type   |     options
------------------------------------------------------------------------------------------------------------
 2       | 26583       | What is your full name?     | ShortAnswer       | [null]
 3       | 26583       | What languages do you know? | MultiSelect       | {"Rust", "JavaScript", "Python"}
 7       | 26583       | What year are you in?       | MultiChoice       | {"1", "2", "3", "4", "5+"}
```

**Answer box:**
```sql
-- Write query here
SELECT questions.id, questions.form_id, questions.title, questions.question_type,
    CASE 
        --ShortAnswer questions, show [null]
        WHEN questions.question_type = 'ShortAnswer' THEN '[null]'
        --Multi questions, show JSON array of options
        ELSE ARRAY_TO_STRING(ARRAY_AGG(question_options.option_text), ', ')
    END as options
FROM questions
-- Left join because ShortAnswer questions won't have options
LEFT JOIN question_options ON questions.id = question_options.question_id
WHERE questions.form_id = 26583
GROUP BY questions.id, questions.form_id, questions.title, questions.question_type
ORDER BY questions.id;
```