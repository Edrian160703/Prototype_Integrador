import { useState } from 'react'

export type ProfileEditStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function useProfileEditLifecycle<T>(initialValues: T) {
  const [baseline, setBaseline] = useState(initialValues)
  const [form, setForm] = useState(baseline)
  const [status, setStatus] = useState<ProfileEditStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline)
  const saving = status === 'saving'

  const touch = () => setStatus((current) => (current === 'saving' ? current : 'idle'))

  const discard = () => {
    setForm(baseline)
    setStatus('idle')
  }

  const beginSave = () => {
    setStatus('saving')
    setErrorMessage('')
  }

  const saveSucceeded = (values: T) => {
    setBaseline(values)
    setForm((current) =>
      JSON.stringify(current) === JSON.stringify(values) ? values : current,
    )
    setStatus('saved')
  }

  const saveFailed = (error: unknown, fallbackMessage: string) => {
    setErrorMessage(error instanceof Error ? error.message : fallbackMessage)
    setStatus('error')
  }

  return {
    form,
    setForm,
    status,
    errorMessage,
    dirty,
    saving,
    touch,
    discard,
    beginSave,
    saveSucceeded,
    saveFailed,
  }
}
