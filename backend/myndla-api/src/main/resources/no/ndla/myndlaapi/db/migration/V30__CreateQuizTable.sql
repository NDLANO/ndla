CREATE TABLE IF NOT EXISTS quizzes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id text NOT NULL,
    revision integer NOT NULL DEFAULT 1,
    document jsonb NOT NULL,
    CONSTRAINT quizzes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS quizzes_owner_id_idx ON quizzes USING btree (owner_id);
