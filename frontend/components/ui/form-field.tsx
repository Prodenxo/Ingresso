'use client'

import { Input, Label, TextField } from '@heroui/react'
import type { ComponentProps } from 'react'

interface FormFieldProps extends Omit<ComponentProps<typeof Input>, 'children' | 'isDisabled'> {
  label: string
  fullWidth?: boolean
  isDisabled?: boolean
}

export function FormField({
  label,
  id,
  name,
  fullWidth = true,
  className,
  isDisabled,
  disabled,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id ?? name
  const inputDisabled = isDisabled ?? disabled

  return (
    <TextField
      fullWidth={fullWidth}
      className="w-full"
      isDisabled={inputDisabled}
    >
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        fullWidth={fullWidth}
        className={className}
        disabled={inputDisabled}
        {...inputProps}
      />
    </TextField>
  )
}
