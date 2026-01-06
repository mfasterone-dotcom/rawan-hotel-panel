'use client';

import * as React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const PhoneInputComponent = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  ...props
}: PhoneInputProps) => {
  const handleChange = (val: string | undefined) => {
    onChange?.(val);
  };

  return (
    <div className={cn('relative', className)}>
      <PhoneInput
        international
        defaultCountry='US'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors',
          'focus-within:ring-1 focus-within:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'md:text-sm',
          // Style the phone input container
          '[&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-2',
          // Style the country select button
          '[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center',
          '[&_.PhoneInputCountryIcon]:border-0 [&_.PhoneInputCountryIcon]:rounded',
          '[&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:border-none [&_.PhoneInputCountrySelect]:outline-none [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelect]:text-foreground',
          '[&_.PhoneInputCountrySelect]:focus:outline-none',
          // Style the input field
          '[&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:ring-0 [&_.PhoneInputInput]:flex-1',
          '[&_.PhoneInputInput]:placeholder:text-muted-foreground',
          '[&_.PhoneInputInput]:focus:outline-none',
        )}
        {...props}
      />
    </div>
  );
};

PhoneInputComponent.displayName = 'PhoneInput';

export { PhoneInputComponent as PhoneInput };
