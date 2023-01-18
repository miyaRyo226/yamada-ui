import {
  ui,
  forwardRef,
  useMultiComponentStyle,
  omitThemeProps,
  CSSUIObject,
  HTMLUIProps,
  ThemeProps,
} from '@yamada-ui/core'
import { Popover, PopoverTrigger } from '@yamada-ui/popover'
import { cx, getValidChildren, handlerAll, isArray, omitObject } from '@yamada-ui/utils'
import { cloneElement, FC, ReactElement, useCallback, useMemo } from 'react'
import { SelectIcon, SelectClearIcon, SelectIconProps } from './select-icon'
import { SelectList, SelectListProps } from './select-list'
import {
  Value,
  useSelect,
  UseSelectProps,
  SelectDescendantsContextProvider,
  SelectProvider,
  useSelectContext,
} from './use-select'
import { OptionGroup, Option, UIOption } from './'

type Format = (value: string, index: number) => string

type MultiSelectOptions = {
  data?: UIOption[]
  tag?: FC<{
    value: string | number
    displayValue: string
    index: number
    onRemove: () => void
  }>
  format?: Format
  separator?: string
  isClearable?: boolean
  focusBorderColor?: string
  errorBorderColor?: string
  list?: Omit<SelectListProps, 'children'>
  icon?: SelectIconProps
  clearIcon?: SelectIconProps
}

export type MultiSelectProps = ThemeProps<'Select'> &
  Omit<UseSelectProps<(string | number)[]>, 'placeholderInOptions' | 'isEmpty'> &
  MultiSelectOptions

export const MultiSelect = forwardRef<MultiSelectProps, 'div'>((props, ref) => {
  const styles = useMultiComponentStyle('Select', props)
  let {
    className,
    defaultValue = [],
    tag,
    format,
    separator,
    isClearable = true,
    noOfLines = 1,
    data = [],
    color,
    h,
    height,
    minH,
    minHeight,
    closeOnSelect = false,
    list,
    icon,
    clearIcon,
    children,
    ...computedProps
  } = omitThemeProps(props)

  const validChildren = getValidChildren(children)
  let computedChildren: ReactElement[] = []

  if (!validChildren.length && data.length) {
    computedChildren = data.map(({ label, value, ...props }, i) => {
      if (!isArray(value)) {
        return (
          <Option key={i} value={value} {...props}>
            {label}
          </Option>
        )
      } else {
        return (
          <OptionGroup key={i} label={label as string} {...(props as HTMLUIProps<'ul'>)}>
            {value.map(({ label, value, ...props }, i) =>
              !isArray(value) ? (
                <Option key={i} value={value} {...props}>
                  {label}
                </Option>
              ) : null,
            )}
          </OptionGroup>
        )
      }
    })
  }

  const isEmpty = !validChildren.length && !computedChildren.length

  const {
    value,
    setValue,
    setDisplayValue,
    descendants,
    formControlProps,
    getPopoverProps,
    getContainerProps,
    getFieldProps,
    placeholder,
    ...rest
  } = useSelect<(string | number)[]>({
    ...computedProps,
    defaultValue,
    placeholderInOptions: false,
    closeOnSelect,
    isEmpty,
  })

  h = h ?? height
  minH = minH ?? minHeight

  const onClear = useCallback(() => {
    setValue([])
    setDisplayValue(undefined)
  }, [setDisplayValue, setValue])

  const css: CSSUIObject = {
    position: 'relative',
    w: '100%',
    h: 'fit-content',
    color,
    ...styles.container,
  }

  return (
    <SelectDescendantsContextProvider value={descendants}>
      <SelectProvider value={{ ...rest, value, placeholder, styles }}>
        <Popover {...getPopoverProps()}>
          <ui.div className='ui-multi-select-container' __css={css} {...getContainerProps()}>
            <PopoverTrigger>
              <MultiSelectField
                tag={tag}
                format={format}
                separator={separator}
                noOfLines={noOfLines}
                h={h}
                minH={minH}
                {...getFieldProps({}, ref)}
              />
            </PopoverTrigger>

            {isClearable && value.length ? (
              <SelectClearIcon
                {...clearIcon}
                onClick={handlerAll(clearIcon?.onClick, onClear)}
                {...omitObject(formControlProps, ['id'])}
              />
            ) : (
              <SelectIcon {...icon} {...omitObject(formControlProps, ['id'])} />
            )}

            {!isEmpty ? <SelectList {...list}>{children ?? computedChildren}</SelectList> : null}
          </ui.div>
        </Popover>
      </SelectProvider>
    </SelectDescendantsContextProvider>
  )
})

type MultiSelectFieldProps = HTMLUIProps<'div'> &
  Pick<MultiSelectOptions, 'tag' | 'format' | 'separator'>

const defaultFormat: Format = (value) => value

const MultiSelectField = forwardRef<MultiSelectFieldProps, 'div'>(
  (
    { className, tag, format = defaultFormat, separator = ',', noOfLines, h, minH, ...rest },
    ref,
  ) => {
    const { value, displayValue, onChange, placeholder, styles } = useSelectContext()

    const cloneChildren = useMemo(() => {
      if (!displayValue?.length) return <ui.span noOfLines={noOfLines}>{placeholder}</ui.span>

      if (tag) {
        return (
          <ui.span noOfLines={noOfLines}>
            {(displayValue as string[]).map((displayValue, index) => {
              const el = tag({
                value: (value as Value[])[index],
                displayValue,
                index,
                onRemove: () => onChange((value as Value[])[index]),
              })

              return el
                ? cloneElement(el, {
                    key: index,
                    style: {
                      marginBlockStart: '0.125rem',
                      marginBlockEnd: '0.125rem',
                      marginInlineEnd: '0.25rem',
                    },
                  })
                : null
            })}
          </ui.span>
        )
      } else {
        return (
          <ui.span noOfLines={noOfLines}>
            {(displayValue as string[]).map((value, index) => {
              const isLast = displayValue.length === index + 1

              return (
                <ui.span key={index} display='inline-block' me='0.25rem'>
                  {format(value, index)}
                  {!isLast ? separator : null}
                </ui.span>
              )
            })}
          </ui.span>
        )
      }
    }, [displayValue, format, noOfLines, onChange, placeholder, separator, tag, value])

    const css: CSSUIObject = {
      paddingEnd: '2rem',
      h,
      minH,
      display: 'flex',
      alignItems: 'center',
      ...styles.field,
    }

    return (
      <ui.div
        ref={ref}
        className={cx('ui-multi-select-field', className)}
        __css={css}
        py={displayValue?.length && tag ? '0.125rem' : undefined}
        {...rest}
      >
        {cloneChildren}
      </ui.div>
    )
  },
)
