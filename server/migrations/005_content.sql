CREATE TABLE uploads(id uuid PRIMARY KEY,account_id uuid REFERENCES accounts(id),object_key text UNIQUE NOT NULL,url text NOT NULL,mime text NOT NULL,status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE posts(id uuid PRIMARY KEY,account_id uuid REFERENCES accounts(id),channel text NOT NULL CHECK(channel IN ('forum','friends')),body text NOT NULL,upload_id uuid REFERENCES uploads(id),photo_event uuid REFERENCES photo_events(id),ad_slot text,status text NOT NULL DEFAULT 'pending',created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX post_feed ON posts(channel,status,created_at);
CREATE TABLE comments(id uuid PRIMARY KEY,post_id uuid REFERENCES posts(id),account_id uuid REFERENCES accounts(id),body text NOT NULL,status text NOT NULL DEFAULT 'pending',created_at timestamptz DEFAULT now());
CREATE TABLE likes(post_id uuid REFERENCES posts(id),account_id uuid REFERENCES accounts(id),PRIMARY KEY(post_id,account_id));
CREATE TABLE reports(id uuid PRIMARY KEY,post_id uuid REFERENCES posts(id),account_id uuid REFERENCES accounts(id),reason text NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE moderation_log(id bigserial PRIMARY KEY,operator_id uuid REFERENCES accounts(id),target uuid,decision text,created_at timestamptz DEFAULT now());
