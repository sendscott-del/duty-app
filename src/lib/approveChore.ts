import { supabase } from './supabase'
import confetti from 'canvas-confetti'

export async function approveChore(chore: any, parentId: string) {
  await supabase.from('duty_chores').update({
    status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: parentId
  }).eq('id', chore.id)

  await supabase.from('duty_point_transactions').insert({
    profile_id: chore.assigned_to,
    family_id: chore.family_id,
    amount: chore.points,
    reason: `Completed: ${chore.name}`,
    reference_id: chore.id,
    reference_type: 'chore',
    created_by: parentId
  })

  confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } })
}

export async function rejectChore(chore: any, parentId: string, note?: string) {
  await supabase.from('duty_chores').update({
    status: 'rejected',
    approved_by: parentId,
    rejection_note: note ?? null
  }).eq('id', chore.id)
}
