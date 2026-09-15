update learningpaths
set document = document || jsonb_build_object('status', 'PRIVATE'::text)
where document->>'status' in ('SUBMITTED', 'READY_FOR_SHARING')