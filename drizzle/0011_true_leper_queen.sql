-- Only add the recommendations_enabled column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'recommendations_enabled'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "recommendations_enabled" boolean DEFAULT false NOT NULL;
    END IF;
END $$;