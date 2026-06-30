'use client'

import { Input, Label, TextField } from '@heroui/react'
import type { ComponentProps } from 'react'

interface FormFieldProps extends Omit<ComponentProps<typeof Input>, 'children'> {
  label: string
  fullWidth?: boolean
}

export function FormField({
  label,
  id,
  name,
  fullWidth = true,
  className,
  ...inputProps
}: FormFieldProps) {
  const fieldId = id ?? name

  return (
    <TextField fullWidth={fullWidth} className="w-full">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        fullWidth={fullWidth}
        className={className}
        {...inputProps}
      />
    </TextField>
  )
}
