import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { deleteOferta, getOfertasByOwner, updateOferta } from '../bootstrap'
import type { OfertaPayload } from '../types/oferta'
import type { OwnedOferta } from '../services/ofertaService'

export interface PublicacionEditValues {
  nombre_producto: string
  id_categoria: string
  descripcion: string
  precio_original: string
  precio_oferta: string
  cantidad_disponible: string
  horario_recojo: string
  fecha_limite: string
  imagen_url: string
}

function toLocalDateTime(value: Date): string {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function valuesFor(oferta: OwnedOferta): PublicacionEditValues {
  const data = oferta.data
  return {
    nombre_producto: data.nombre_producto,
    id_categoria: data.id_categoria,
    descripcion: data.descripcion,
    precio_original: String(data.precio_original),
    precio_oferta: String(data.precio_oferta),
    cantidad_disponible: String(data.cantidad_disponible),
    horario_recojo: data.horario_recojo,
    fecha_limite: toLocalDateTime(data.fecha_limite),
    imagen_url: data.imagen_url ?? '',
  }
}

interface UseMisPublicacionesResult {
  publicaciones: OwnedOferta[]
  seleccionada: OwnedOferta | null
  values: PublicacionEditValues | null
  loading: boolean
  saving: boolean
  message: string
  error: string
  loadPublicaciones: () => Promise<void>
  selectOferta: (oferta: OwnedOferta) => void
  closeEditor: () => void
  submitEdit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  removeOferta: (oferta: OwnedOferta) => Promise<void>
  updateValue: (field: keyof PublicacionEditValues, value: string) => void
}

export default function useMisPublicaciones(uid: string): UseMisPublicacionesResult {
  const [publicaciones, setPublicaciones] = useState<OwnedOferta[]>([])
  const [seleccionada, setSeleccionada] = useState<OwnedOferta | null>(null)
  const [values, setValues] = useState<PublicacionEditValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const loadPublicaciones = useCallback(async () => {
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const data = await getOfertasByOwner(uid)
      if (currentRequestId === requestId.current) setPublicaciones(data)
    } catch (reason) {
      if (currentRequestId === requestId.current) {
        setError(reason instanceof Error ? reason.message : 'No pudimos cargar tus publicaciones.')
      }
    } finally {
      if (currentRequestId === requestId.current) setLoading(false)
    }
  }, [uid])

  useEffect(() => {
    void loadPublicaciones()
    return () => {
      requestId.current += 1
    }
  }, [loadPublicaciones])

  const selectOferta = (oferta: OwnedOferta) => {
    setSeleccionada(oferta)
    setValues(valuesFor(oferta))
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
    if (Number(values.precio_oferta) >= Number(values.precio_original)) {
      setError('El precio de oferta debe ser menor al precio original.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload: Omit<OfertaPayload, 'estado'> = {
        ...values,
        nombre_producto: values.nombre_producto.trim(),
        descripcion: values.descripcion.trim(),
        precio_original: Number(values.precio_original),
        precio_oferta: Number(values.precio_oferta),
        cantidad_disponible: Number(values.cantidad_disponible),
        horario_recojo: values.horario_recojo.trim(),
      }
      await updateOferta(seleccionada.id, uid, payload)
      closeEditor()
      setMessage('Publicación actualizada correctamente.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar la publicación.')
    } finally {
      setSaving(false)
    }
  }

  const removeOferta = async (oferta: OwnedOferta) => {
    const confirmed = window.confirm(`¿Eliminar "${oferta.data.nombre_producto}"? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setError('')
    setMessage('')
    try {
      await deleteOferta(oferta.id, uid)
      if (seleccionada?.id === oferta.id) closeEditor()
      setMessage('Publicación eliminada.')
      await loadPublicaciones()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la publicación.')
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
