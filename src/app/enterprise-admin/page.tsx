"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

function EnterpriseAdminContent() {
  const searchParams = useSearchParams()
  
  // Your component logic here
  return (
    <div>
      <h1>Enterprise Admin</h1>
      {/* Add your enterprise admin content here */}
    </div>
  )
}

export default function EnterpriseAdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnterpriseAdminContent />
    </Suspense>
  )
}

