CREATE TABLE quizzes (
  id       BIGSERIAL  PRIMARY KEY,
  document JSONB      NOT NULL,
  revision INTEGER    NOT NULL DEFAULT 1
);

CREATE INDEX quizzes_status_idx ON quizzes ((document #>> '{status}'));
