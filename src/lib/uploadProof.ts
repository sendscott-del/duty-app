import { supabase } from './supabase'

export async function uploadProof(choreId: string, kidId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${kidId}/${choreId}.${ext}`

  const { error } = await supabase.storage
    .from('chore-proofs')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('chore-proofs')
    .getPublicUrl(path)

  await supabase
    .from('duty_chores')
    .update({
      proof_image_url: publicUrl,
      status: 'submitted',
      proof_submitted_at: new Date().toISOString()
    })
    .eq('id', choreId)

  return publicUrl
}
