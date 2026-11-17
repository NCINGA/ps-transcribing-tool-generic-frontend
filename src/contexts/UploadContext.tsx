import { createContext, useContext, useState, type ReactNode } from 'react'
import { uploadFile as apiUploadFile } from '../api'

interface ActiveUpload {
  filename: string
}

interface UploadContextValue {
  activeUpload: ActiveUpload | null
  uploadVersion: number
  startUpload: (file: File) => Promise<void>
}

const UploadContext = createContext<UploadContextValue | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [activeUpload, setActiveUpload] = useState<ActiveUpload | null>(null)
  const [uploadVersion, setUploadVersion] = useState(0)

  const startUpload = async (file: File): Promise<void> => {
    setActiveUpload({ filename: file.name })
    try {
      await apiUploadFile(file)
      setUploadVersion(v => v + 1)
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