'use client'

import React, { createContext, useContext, useState } from 'react'
import EditorOnboardingModal from '@/components/EditorOnboardingModal'

interface OnboardingContextType {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
  setIsOnboardingOpen: (open: boolean) => void
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
  setIsOnboardingOpen: () => {},
})

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        setIsOnboardingOpen: setIsOpen,
      }}
    >
      {children}
      <EditorOnboardingModal isOpen={isOpen} onClose={closeModal} />
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => useContext(OnboardingContext)
export const useOnboardingModal = () => useContext(OnboardingContext)
