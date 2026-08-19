import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeNotificationReadState1783000000000 implements MigrationInterface {
  name = 'NormalizeNotificationReadState1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH duplicate_groups AS (
        SELECT notification_id, user_id, MIN(id::text)::uuid AS keep_id
        FROM notification_recipients
        GROUP BY notification_id, user_id
        HAVING COUNT(*) > 1
      ), merged_state AS (
        SELECT
          recipient.notification_id,
          recipient.user_id,
          MIN(recipient.read_at) FILTER (WHERE recipient.read_at IS NOT NULL) AS read_at,
          MIN(recipient.dismissed_at) FILTER (WHERE recipient.dismissed_at IS NOT NULL) AS dismissed_at
        FROM notification_recipients recipient
        INNER JOIN duplicate_groups duplicate
          ON duplicate.notification_id = recipient.notification_id
         AND duplicate.user_id = recipient.user_id
        GROUP BY recipient.notification_id, recipient.user_id
      )
      UPDATE notification_recipients recipient
      SET
        read_at = merged_state.read_at,
        dismissed_at = merged_state.dismissed_at,
        updated_at = now()
      FROM duplicate_groups duplicate
      INNER JOIN merged_state
        ON merged_state.notification_id = duplicate.notification_id
       AND merged_state.user_id = duplicate.user_id
      WHERE recipient.id = duplicate.keep_id
    `);

    await queryRunner.query(`
      DELETE FROM notification_recipients recipient
      USING (
        SELECT notification_id, user_id, MIN(id::text)::uuid AS keep_id
        FROM notification_recipients
        GROUP BY notification_id, user_id
        HAVING COUNT(*) > 1
      ) duplicate
      WHERE recipient.notification_id = duplicate.notification_id
        AND recipient.user_id = duplicate.user_id
        AND recipient.id <> duplicate.keep_id
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_notification_recipients_notification_user'
        ) THEN
          ALTER TABLE notification_recipients
          ADD CONSTRAINT uq_notification_recipients_notification_user
          UNIQUE (notification_id, user_id);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      WITH notification_duplicates AS (
        SELECT
          (metadata ->> 'eventKey') AS event_key,
          MIN(id::text)::uuid AS keep_id,
          ARRAY_AGG(id) AS notification_ids
        FROM notifications
        WHERE metadata ? 'eventKey'
        GROUP BY metadata ->> 'eventKey'
        HAVING COUNT(*) > 1
      ), moved_recipients AS (
        INSERT INTO notification_recipients (
          notification_id,
          user_id,
          read_at,
          dismissed_at,
          created_at,
          updated_at
        )
        SELECT
          duplicate.keep_id,
          recipient.user_id,
          MIN(recipient.read_at) FILTER (WHERE recipient.read_at IS NOT NULL),
          MIN(recipient.dismissed_at) FILTER (WHERE recipient.dismissed_at IS NOT NULL),
          MIN(recipient.created_at),
          now()
        FROM notification_duplicates duplicate
        INNER JOIN notification_recipients recipient
          ON recipient.notification_id = ANY(duplicate.notification_ids)
        GROUP BY duplicate.keep_id, recipient.user_id
        ON CONFLICT (notification_id, user_id) DO UPDATE
        SET
          read_at = COALESCE(notification_recipients.read_at, EXCLUDED.read_at),
          dismissed_at = COALESCE(notification_recipients.dismissed_at, EXCLUDED.dismissed_at),
          updated_at = now()
        RETURNING notification_id
      )
      DELETE FROM notifications notification
      USING notification_duplicates duplicate
      WHERE notification.id = ANY(duplicate.notification_ids)
        AND notification.id <> duplicate.keep_id
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_event_key
      ON notifications ((metadata ->> 'eventKey'))
      WHERE metadata ? 'eventKey'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_notifications_event_key`);
  }
}
