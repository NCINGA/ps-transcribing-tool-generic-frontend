import { createContext, useContext, useState, type ReactNode } from 'react'
import { uploadFile as apiUploadFile } from '../api'
import type { TranscriptLanguage } from '../types'

interface ActiveUpload {
  filename: string
}

interface UploadContextValue {
  activeUpload: ActiveUpload | null
  uploadVersion: number
  startUpload: (file: File, language: TranscriptLanguage) => ReturnType<typeof apiUploadFile>
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null)
  const [uploadVersion, setUploadVersion] = useState(0)

  const startUpload = async (file: File, language: TranscriptLanguage) => {
    setActiveUpload({ filename: file.name })
    try {
      const result = await apiUploadFile(file, language)
      setUploadVersion(v => v + 1)
      return result
    } finally {
      setActiveUpload(null)
    }
  }

  return (
    <UploadContext.Provider value={{ activeUpload, uploadVersion, startUpload }}>
      {children}
    </UploadContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used within UploadProvider')
  return ctx
}