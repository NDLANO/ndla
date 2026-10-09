CREATE TABLE IF NOT EXISTS saved_quizzes (
    quiz_id uuid NOT NULL,
    feide_id text NOT NULL,
    created timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT saved_quizzes_pkey PRIMARY KEY (quiz_id, feide_id),
    CONSTRAINT saved_quizzes_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS saved_quizzes_feide_id_idx ON saved_quizzes USING btree (feide_id);
