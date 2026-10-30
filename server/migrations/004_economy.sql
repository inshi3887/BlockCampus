CREATE TABLE wallets(account_id uuid PRIMARY KEY REFERENCES accounts(id), gold_copper bigint NOT NULL DEFAULT 0 CHECK(gold_copper>=0 AND gold_copper%10000=0), silver_copper bigint NOT NULL DEFAULT 0 CHECK(silver_copper>=0 AND silver_copper%100=0), copper bigint NOT NULL DEFAULT 0 CHECK(copper>=0), points integer NOT NULL DEFAULT 0 CHECK(points>=0), level integer NOT NULL DEFAULT 1);
CREATE TABLE receipts(account_id uuid REFERENCES accounts(id), key uuid, action text NOT NULL, result jsonb NOT NULL, PRIMARY KEY(account_id,key));
CREATE TABLE ledger(id bigserial PRIMARY KEY,account_id uuid REFERENCES accounts(id),reason text NOT NULL,delta jsonb NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE inventory(account_id uuid REFERENCES accounts(id),sku text,PRIMARY KEY(account_id,sku));
CREATE TABLE daily_drops(account_id uuid REFERENCES accounts(id),day text,kind text CHECK(kind IN ('normal','ad')),count integer NOT NULL DEFAULT 0,PRIMARY KEY(account_id,day,kind));
CREATE TABLE photo_events(id uuid PRIMARY KEY,account_id uuid REFERENCES accounts(id),landmark text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),normal_claimed boolean NOT NULL DEFAULT false,ad_claimed boolean NOT NULL DEFAULT false);
CREATE TABLE lessons(id uuid PRIMARY KEY,account_id uuid REFERENCES accounts(id),room text NOT NULL,seat integer NOT NULL CHECK(seat BETWEEN 1 AND 50),speed numeric NOT NULL,started_at timestamptz NOT NULL DEFAULT now(),last_seen timestamptz NOT NULL DEFAULT now(),confirmed_at timestamptz NOT NULL DEFAULT now(),watched_seconds double precision NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'active');
CREATE UNIQUE INDEX one_active_lesson ON lessons(account_id) WHERE status='active';
CREATE UNIQUE INDEX one_active_seat ON lessons(room,seat) WHERE status='active';
