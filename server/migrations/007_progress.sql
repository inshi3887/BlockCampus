CREATE TABLE discoveries(account_id uuid REFERENCES accounts(id),landmark text,created_at timestamptz DEFAULT now(),PRIMARY KEY(account_id,landmark));
ALTER TABLE photo_events ADD COLUMN upload_id uuid REFERENCES uploads(id);
ALTER TABLE photo_events ADD COLUMN campaign_id uuid REFERENCES ads(id);
ALTER TABLE lessons ADD COLUMN hidden_at timestamptz;
