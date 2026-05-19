'use client'

import { ReactNode } from 'react'
import { NeoToaster } from '@/components/ui/NeoToaster'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <NeoToaster />
    </>
  )
}
