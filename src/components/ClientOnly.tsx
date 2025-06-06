'use client'

import React, { useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children, 
  fallback = <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div> 
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
} 