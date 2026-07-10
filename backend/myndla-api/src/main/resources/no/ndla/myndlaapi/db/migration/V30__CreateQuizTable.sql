CREATE TABLE quizzes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id text NOT NULL,
    document jsonb NOT NULL,
    CONSTRAINT quizzes_pkey PRIMARY KEY (id)
);

CREATE INDEX quizzes_owner_id_idx ON quizzes USING btree (owner_id);
