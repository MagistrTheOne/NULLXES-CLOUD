-- The price identity is (product_category, billing_unit, currency).
-- Effective intervals are half-open: [effective_from, effective_until).
-- Stop before changing the schema if published history already conflicts.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM public.pricing_versions AS older
		JOIN public.pricing_versions AS newer
			ON older.id < newer.id
			AND older.product_category = newer.product_category
			AND older.billing_unit = newer.billing_unit
			AND older.currency = newer.currency
			AND tstzrange(older.effective_from, older.effective_until, '[)')
				&& tstzrange(newer.effective_from, newer.effective_until, '[)')
		WHERE older.publication_status = 'published'
			AND newer.publication_status = 'published'
	) THEN
		RAISE EXCEPTION 'Cannot add pricing overlap protection: published price windows overlap. Review and resolve the conflicting rows before retrying.'
			USING ERRCODE = '23P01';
	END IF;
END $$;--> statement-breakpoint

CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint

ALTER TABLE public.pricing_versions
	ADD CONSTRAINT pricing_versions_published_window_excl
	EXCLUDE USING gist (
		product_category WITH =,
		billing_unit WITH =,
		currency WITH =,
		tstzrange(effective_from, effective_until, '[)') WITH &&
	)
	WHERE (publication_status = 'published');
