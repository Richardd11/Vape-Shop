import { createClient } from '@/lib/supabase/server'
import PaymentHistory from '@/components/dashboard/PaymentHistory'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, store_orders!inner(customer_name, email, total_amount, payment_method, status, payment_status)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-[var(--color-text-primary)]">Payment History</h1>
      <PaymentHistory payments={payments ?? []} />
    </div>
  )
}
