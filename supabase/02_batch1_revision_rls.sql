-- Pedagang Handal v1.3: revisi untuk deteksi konflik perangkat.
-- Jalankan SETELAH 01_create_product_snapshots.sql, hanya pada proyek Pedagang Handal.
BEGIN;
ALTER TABLE public.product_snapshots ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_snapshots_revision_positive'
      AND conrelid = 'public.product_snapshots'::regclass
  ) THEN
    ALTER TABLE public.product_snapshots ADD CONSTRAINT product_snapshots_revision_positive CHECK (revision >= 1);
  END IF;
END $$;
ALTER TABLE public.product_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_snapshots FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_snapshots TO authenticated;
DROP POLICY IF EXISTS ph_snapshots_select_own ON public.product_snapshots;
CREATE POLICY ph_snapshots_select_own ON public.product_snapshots FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ph_snapshots_insert_own ON public.product_snapshots;
CREATE POLICY ph_snapshots_insert_own ON public.product_snapshots FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ph_snapshots_update_own ON public.product_snapshots;
CREATE POLICY ph_snapshots_update_own ON public.product_snapshots FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ph_snapshots_delete_own ON public.product_snapshots;
CREATE POLICY ph_snapshots_delete_own ON public.product_snapshots FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
COMMIT;

-- Verifikasi:
-- SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='product_snapshots';
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='product_snapshots';
