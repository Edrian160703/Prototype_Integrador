import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession, useUserProfile } from '../context/AuthContext'
import { createOfertaConProducto } from '../bootstrap'
import type { OfertaPayload } from '../types/oferta'

type SubmitStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function usePublicarOferta() {
  const navigate = useNavigate()
  const { user } = useAuthSession()
  const { profile } = useUserProfile()
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const clearStatus = () => {
    if (status !== 'idle') setStatus('idle')
  }

  const showError = (message: string) => {
    setStatus('error')
    setStatusMessage(message)
  }

  const publishOferta = async (payload: OfertaPayload, onPublished: () => void): Promise<boolean> => {
    if (!user || !profile || profile.role !== 'store') {
      showError('Debes iniciar sesión como comercio para publicar una oferta.')
      return false
    }

    setStatus('saving')
    setStatusMessage('')

    try {
      await createOfertaConProducto({ uid: user.uid, payload })
      onPublished()
      setStatus('saved')
      setStatusMessage('✓ Tu oferta fue publicada correctamente.')
      navigate('/explorar', { state: { toastMessage: '¡Oferta publicada exitosamente!' } })
      return true
    } catch (error) {
      showError(error instanceof Error ? error.message : 'No pudimos publicar tu oferta. Inténtalo de nuevo.')
      return false
    }
  }

  return {
    status,
    statusMessage,
    saving: status === 'saving',
    clearStatus,
    showError,
    publishOferta,
  }
}
