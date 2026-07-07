import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PaymentDetails from '@/components/dashboard/PaymentDetails'

export const dynamic = 'force-dynamic'

export default async function PaymentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, store_orders!inner(*)')
    .eq('id', params.id)
    .single()

  if (!payment) notFound()

  return <PaymentDetails payment={payment} />
}
