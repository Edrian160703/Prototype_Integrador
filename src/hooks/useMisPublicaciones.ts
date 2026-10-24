import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useOfferEditing, useOfferOwnerQuery } from '../context/ApplicationContext'
import type { OwnedOferta } from '../types/oferta'
import {
  preparePublicacionEdit,
  toPublicacionEditValues,
  type PublicacionEditValues,
} from '../utils/publicacionEditor'

interface UseMisPublicacionesResult {
  publicaciones: OwnedOferta[]
  seleccionada: OwnedOferta | null
  values: PublicacionEditValues | null
  loading: boolean
  saving: boolean
  deletingId: string | null
  message: string
  error: string
  loadPublicaciones: () => Promise<void>
  selectOferta: (oferta: OwnedOferta) => void
  closeEditor: () => void
  submitEdit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  removeOferta: (idOferta: string) => Promise<void>
  updateValue: (field: keyof PublicacionEditValues, value: string) => void
}

export default function useMisPublicaciones(uid: string): UseMisPublicacionesResult {
  const { deleteOferta, updateOferta } = useOfferEditing()
  const { getOfertasByOwner } = useOfferOwnerQuery()
  const [publicaciones, setPublicaciones] = useState<OwnedOferta[]>([])
  const [seleccionada, setSeleccionada] = useState<OwnedOferta | null>(null)
  const [values, setValues] = useState<PublicacionEditValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const requestPublicaciones = useCallback(() => {
    const currentRequestId = ++requestId.current
    return {
      currentRequestId,
      result: getOfertasByOwner(uid),
    }
  }, [getOfertasByOwner, uid])

  const loadPublicaciones = useCallback(async () => {
    setLoading(true)
    setError('')
    const { currentRequestId, result } = requestPublicaciones()
    try {
      const data = await result
      if (currentRequestId === requestId.current) setPublicaciones(data)
    } catch (reason) {
      if (currentRequestId === requestId.current) {
        setError(reason instanceof Error ? reason.message : 'No pudimos cargar tus publicaciones.')
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false)
    }
  }, [requestPublicaciones])

  useEffect(() => {
    let active = true
    const { currentRequestId, result } = requestPublicaciones()
    result
      .then((data) => {
        if (active && currentRequestId === requestId.current) setPublicaciones(data)
      })
      .catch((reason: unknown) => {
        if (active && currentRequestId === requestId.current) {
          setError(reason instanceof Error ? reason.message : 'No pudimos cargar tus publicaciones.')
        }
      })
      .finally(() => {
        if (active && currentRequestId === requestId.current) setLoading(false)
      })
    return () => {
      active = false
      requestId.current += 1
    }
  }, [requestPublicaciones])

  const selectOferta = (oferta: OwnedOferta) => {
    setSeleccionada(oferta)
    setValues(toPublicacionEditValues(oferta))
    setMessage('')
    setError('')
  }

  const closeEditor = () => {
    setSeleccionada(null)
    setValues(null)
  }

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!seleccionada || !values) return
    const result = preparePublicacionEdit(values)
    if (!result.valid) {
      setError(result.message)
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateOferta(seleccionada.id, uid, result.payload)
      closeEditor()
      setMessage('Publicación actualizada correctamente.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la publicación.')
    } finally {
      setSaving(false)
    }
  }

  const removeOferta = async (idOferta: string) => {
    if (deletingId) return
    setDeletingId(idOferta)
    setError('')
    setMessage('')
    try {
      await deleteOferta(idOferta, uid)
      if (seleccionada?.id === idOferta) closeEditor()
      setMessage('Publicación archivada. Se conserva para proteger el historial de reservas.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la publicación.')
    } finally {
      setDeletingId(null)
    }
  }

  const updateValue = (field: keyof PublicacionEditValues, value: string) => {
    setValues((current) => current ? { ...current, [field]: value } : current)
  }

  return {
    publicaciones,
    seleccionada,
    values,
    loading,
    saving,
    deletingId,
    message,
    error,
    loadPublicaciones,
    selectOferta,
    closeEditor,
    submitEdit,
    removeOferta,
    updateValue,
  }
}
