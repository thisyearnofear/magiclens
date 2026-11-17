/** @jsxImportSource react */

import { CaptionsButton as CaptionsButtonPrimitive } from '@videojs/react';
import {
  CaptionsOffIcon as CaptionsOffIconPrimitive,
  CaptionsOnIcon as CaptionsOnIconPrimitive,
} from '@videojs/react/icons/scaffold';

import { cn, resolveClassName } from '@/gilt/lib/resolve-class-name';

import { Button } from './button';
import { ButtonTooltip } from './tooltip';

export function CaptionsToggle() {
  return (
    <ButtonTooltip>
      <CaptionsButton />
    </ButtonTooltip>
  );
}

export type CaptionsButtonProps = Omit<CaptionsButtonPrimitive.Props, 'children'>;

export function CaptionsButton({ className, ...props }: CaptionsButtonProps = {}) {
  return (
    <CaptionsButtonPrimitive
      render={<Button />}
      className={(state) => cn('group/captions media-max-3xs:hidden', resolveClassName(className, state))}
      {...props}
    >
      <CaptionsOffIconPrimitive
        className={cn('col-start-1 row-start-1 size-4.5', 'group-data-active/captions:hidden')}
      />
      <CaptionsOnIconPrimitive
        className={cn('col-start-1 row-start-1 size-4.5', 'hidden group-data-active/captions:block')}
      />
    </CaptionsButtonPrimitive>
  );
}
