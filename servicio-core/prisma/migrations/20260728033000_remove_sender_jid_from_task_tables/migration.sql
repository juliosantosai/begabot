-- Drop sender and jid from Task and TaskLog tables as they are no longer needed
ALTER TABLE "Task" DROP COLUMN IF EXISTS sender;
ALTER TABLE "Task" DROP COLUMN IF EXISTS jid;
ALTER TABLE "TaskLog" DROP COLUMN IF EXISTS sender;
ALTER TABLE "TaskLog" DROP COLUMN IF EXISTS jid;
