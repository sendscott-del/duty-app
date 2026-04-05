-- Allow deleting point transactions (needed for undo)
create policy "points_delete" on duty_point_transactions for delete
  using (true);
