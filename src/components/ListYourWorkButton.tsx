'use client'

import { useOnboarding } from '@/context/OnboardingContext'

interface ListYourWorkButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function ListYourWorkButton({
  className = 'btn-primary text-xs px-4 py-2',
  children = 'List your work',
}: ListYourWorkButtonProps) {
  const { openModal } = useOnboarding()

  return (
    <button
      type="button"
      onClick={openModal}
      className={className}
    >
      {children}
    </button>
  )
}
