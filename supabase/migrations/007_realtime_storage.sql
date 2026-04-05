alter publication supabase_realtime add table duty_chores;
alter publication supabase_realtime add table duty_redemptions;
alter publication supabase_realtime add table duty_point_transactions;

insert into storage.buckets (id, name, public) values ('chore-proofs', 'chore-proofs', false);

create policy "kid_upload_proof" on storage.objects for insert
  with check (bucket_id = 'chore-proofs'
    and auth.uid()::text = (storage.foldername(name))[1]);

create policy "family_view_proof" on storage.objects for select
  using (bucket_id = 'chore-proofs');
