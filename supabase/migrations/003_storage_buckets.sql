-- Storage buckets for registration payment proofs, sponsor logos, study guides

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
  ),
  (
    'sponsor-logos',
    'sponsor-logos',
    true,
    2097152,
    ARRAY['image/png', 'image/svg+xml', 'image/webp']
  ),
  (
    'study-guides',
    'study-guides',
    false,
    10485760,
    ARRAY['application/pdf']
  )
ON CONFLICT (id) DO NOTHING;
