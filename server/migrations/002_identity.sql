CREATE TABLE identities(account_id uuid PRIMARY KEY REFERENCES accounts(id), identity_hash text NOT NULL UNIQUE, birth_date date NOT NULL, verified_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE play_days(account_id uuid REFERENCES accounts(id), day text, seconds integer NOT NULL DEFAULT 0, last_seen timestamptz, PRIMARY KEY(account_id,day));
