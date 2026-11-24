ALTER TABLE folders
    ALTER COLUMN feide_id SET NOT NULL,
    ALTER COLUMN "rank" SET NOT NULL;

ALTER TABLE resources
    ALTER COLUMN feide_id SET NOT NULL,
    ALTER COLUMN "path" SET NOT NULL,
    ALTER COLUMN resource_type SET NOT NULL,
    ALTER COLUMN created SET NOT NULL,
    ALTER COLUMN "document" SET NOT NULL;

ALTER TABLE resource_connections
    ALTER COLUMN "rank" SET NOT NULL;

ALTER TABLE saved_shared_folder
    ALTER COLUMN "rank" SET NOT NULL;
