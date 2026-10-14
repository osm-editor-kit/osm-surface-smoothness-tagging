import { catalogue, getSurfaceInfo } from '@osm-editor-kit/surface-smoothness-data'
import { dispatch as d3_dispatch } from 'd3-dispatch'
import { select as d3_select, type Selection } from 'd3-selection'
import {
  orderedSurfaces,
  photoCredit,
  resolveKeys,
  smoothnessChangePatch,
  smoothnessChoices,
  surfaceChangePatch,
  type SmoothnessChoice,
} from './logic.js'
import type {
  FieldTags,
  SurfaceSmoothnessAdapters,
  SurfaceSmoothnessContext,
  SurfaceSmoothnessFieldDefinition,
  SurfaceSmoothnessInstance,
  TagPatch,
  TooltipInfo,
} from './types.js'

// d3 selections + dispatch are loosely typed inside the widget; the public API (types.ts) is strict.
type Sel = Selection<any, any, any, any>
type DispatchLike = {
  call: (type: string, that: unknown, ...args: unknown[]) => void
  on: (type: string, listener?: (...args: unknown[]) => void) => unknown
}
type TextRow = {
  name: 'surface' | 'smoothness'
  key: string
  label: string
  values: string[]
  title: (v: string) => string
}

/**
 * Surface and smoothness, photos first: two tiles side by side (the surface, its smoothness),
 * each with its photo and label, or an empty frame while not set. Clicking a tile opens its
 * picker below: the surface first (all surface photos), and after a surface the smoothness
 * photos for it (or every level with its emoji where there are none). Below the photos, a
 * label | input row takes any value, also one without a photo.
 */
export function createSurfaceSmoothnessField(
  field: SurfaceSmoothnessFieldDefinition = {},
  context: SurfaceSmoothnessContext = {},
  adapters: SurfaceSmoothnessAdapters = {},
): SurfaceSmoothnessInstance {
  const dispatch = d3_dispatch('change') as unknown as DispatchLike
  const keys = resolveKeys(field)
  const t = adapters.t ?? ((_key: string, fallback: string) => fallback)
  const assetUrl = context.assetUrl ?? ((path: string) => path)

  let _tags: FieldTags = {}
  let _root: Sel = d3_select<any, unknown>(null as any)
  /** The picker open below the two tiles, if any. */
  let _open: 'surface' | 'smoothness' | undefined
  /** Where keyboard focus goes after the next render: a tile, or the open picker. */
  let _focusNext: 'surface' | 'smoothness' | 'picker' | undefined

  const value = (key: string): string | undefined => {
    const v = _tags[key]
    return typeof v === 'string' && v ? v : undefined
  }
  const isMixed = (key: string) => Array.isArray(_tags[key])

  const surfaceTitle = (surface: string) =>
    adapters.optionLabel?.('surface', surface) ?? getSurfaceInfo(surface)?.title ?? surface
  const smoothnessTitle = (smoothness: string) =>
    adapters.optionLabel?.('smoothness', smoothness) ??
    catalogue.smoothnessLevels[smoothness]?.title ??
    smoothness

  /** Tooltip of a tile or card: the full label, the tag, the description, the photo credit. */
  function tooltip(
    key: 'surface' | 'smoothness',
    v: string,
    description: string | null | undefined,
    photo: string | null | undefined,
    surface?: string,
  ): string | null {
    const info: TooltipInfo = {
      key,
      value: v,
      tag: `${key === 'surface' ? keys.surfaceKey : keys.smoothnessKey}=${v}`,
      label: key === 'surface' ? surfaceTitle(v) : smoothnessTitle(v),
      description: adapters.optionDescription?.(key, v, surface) ?? description ?? undefined,
      credit: photoCredit(photo),
    }
    const custom = adapters.tooltip?.(info)
    if (custom !== undefined) return custom
    const credit = info.credit ? `${t('photo', 'Photo')}: ${info.credit}` : undefined
    return [info.label, info.tag, info.description, credit].filter(Boolean).join('\n')
  }

  function emit(patch: TagPatch) {
    _tags = { ..._tags, ...patch }
    render()
    dispatch.call('change', instance, patch)
    applyFocus()
  }

  /** `fromPicker`: chosen in the photos, so keyboard focus moves on with the user. */
  function chooseSurface(surface: string | undefined, fromPicker = false) {
    // the smoothness for this surface comes next
    _open = surface ? 'smoothness' : undefined
    if (fromPicker) _focusNext = surface ? 'picker' : 'surface'
    if (surface === value(keys.surfaceKey)) return update()
    emit(surfaceChangePatch(value(keys.smoothnessKey), surface, keys))
  }

  function chooseSmoothness(smoothness: string | undefined, fromPicker = false) {
    _open = undefined
    if (fromPicker) _focusNext = 'smoothness'
    emit(smoothnessChangePatch(smoothness, keys))
  }

  /** Clicking a tile opens its picker (the surface one first), clicking it again closes it. */
  function toggle(picker: 'surface' | 'smoothness') {
    const needsSurface = picker === 'smoothness' && !value(keys.surfaceKey)
    const next = needsSurface ? 'surface' : picker
    _open = _open === next ? undefined : next
    _focusNext = _open ? 'picker' : picker
    update()
  }

  /** Escape in a picker: close it, back to its tile. */
  function close() {
    const tile = _open
    _open = undefined
    _focusNext = tile
    update()
  }

  function update() {
    render()
    applyFocus()
  }

  function applyFocus() {
    const target = _focusNext
    _focusNext = undefined
    const root = _root.node() as HTMLElement | null
    if (!target || !root) return
    const node =
      target === 'picker'
        ? root.querySelector<HTMLElement>('.ssf-picker button[tabindex="0"]')
        : root.querySelector<HTMLElement>(`.ssf-value-${target}`)
    node?.focus()
  }

  /**
   * Arrow keys in a photo grid (one tab stop per grid): left/right to the neighbour, up/down to
   * the closest one in the row above/below, Home/End to the ends. Escape closes the picker.
   */
  function onGridKeydown(event: KeyboardEvent) {
    const grid = event.currentTarget as HTMLElement
    const items = Array.from(grid.querySelectorAll<HTMLElement>(':scope > button'))
    const current = items.indexOf(event.target as HTMLElement)
    if (current < 0) return
    if (!GRID_KEYS.includes(event.key)) return
    // the host's own arrow keys (iD pans the map with them) must not fire as well, also at an edge
    event.preventDefault()
    event.stopPropagation()
    const next = gridNeighbour(
      items,
      current,
      event.key,
      getComputedStyle(grid).direction === 'rtl',
    )
    if (next === undefined) return
    items.forEach((item, i) => item.setAttribute('tabindex', i === next ? '0' : '-1'))
    items[next]?.focus()
  }

  /**
   * Escape on a photo closes the picker. Listened for on `window` in the capture phase while a
   * picker is open: hosts may catch Escape early on `document` (iD leaves the feature with it).
   */
  function onEscape(event: KeyboardEvent) {
    const root = _root.node() as (HTMLElement & { __ssfOwner?: unknown }) | null
    // The host dropped this field (iD makes new ones without telling the old), or another
    // instance took over its node: stop listening.
    if (!root?.isConnected || root.__ssfOwner !== instance) {
      window.removeEventListener('keydown', onEscape, true)
      _escapeListening = false
      return
    }
    if (event.key !== 'Escape' || !_open) return
    const target = event.target as HTMLElement | null
    const picker = root.querySelector('.ssf-picker')
    if (!target || !picker?.contains(target) || target.tagName !== 'BUTTON') return
    event.preventDefault()
    event.stopImmediatePropagation()
    close()
  }
  let _escapeListening = false
  function listenForEscape() {
    if (typeof window === 'undefined' || Boolean(_open) === _escapeListening) return
    _escapeListening = Boolean(_open)
    if (_escapeListening) window.addEventListener('keydown', onEscape, true)
    else window.removeEventListener('keydown', onEscape, true)
  }

  /** One tab stop per grid: the chosen item, or the first one. */
  function rovingTabindex(items: Sel, isCurrent: (d: any) => boolean) {
    const nodes = items.nodes() as HTMLElement[]
    const chosen = nodes.findIndex((node) => isCurrent((node as any).__data__))
    nodes.forEach((node, i) =>
      node.setAttribute('tabindex', i === Math.max(chosen, 0) ? '0' : '-1'),
    )
  }

  /** A direct child with this class, created once. */
  function oneChild(parent: Sel, tag: string, className: string): Sel {
    const selector = `.${className.split(' ').join('.')}`
    const existing = parent.selectAll(`:scope > ${selector}`).data([0])
    return existing
      .enter()
      .append(tag)
      .attr('class', className)
      .merge(existing as any)
  }

  // ---- rendering --------------------------------------------------------------

  function render() {
    listenForEscape()
    if (_root.empty() || !_root.node()) return
    renderImages(_root)
  }

  function renderImages(root: Sel) {
    const surface = value(keys.surfaceKey)
    const smoothness = value(keys.smoothnessKey)
    const choice = smoothnessChoices(surface).find((c) => c.smoothness === smoothness)
    const mixed = t('multiple_values', 'Multiple values')

    // two tiles side by side: the surface and its smoothness
    const pair = oneChild(root, 'div', 'ssf-pair')
    const surfacePhoto = surface ? (getSurfaceInfo(surface)?.icon ?? undefined) : undefined
    renderValueTile(pair, {
      id: 'surface',
      photo: surfacePhoto,
      emoji: undefined,
      mixed: isMixed(keys.surfaceKey),
      title: isMixed(keys.surfaceKey) ? mixed : surface ? surfaceTitle(surface) : undefined,
      placeholder: t('surface', 'Surface'),
      tooltip: surface ? tooltip('surface', surface, undefined, surfacePhoto) : null,
    })
    renderValueTile(pair, {
      id: 'smoothness',
      photo: choice?.cell?.photo,
      emoji: smoothness ? (catalogue.smoothnessLevels[smoothness]?.emoji ?? undefined) : undefined,
      mixed: isMixed(keys.smoothnessKey),
      title: isMixed(keys.smoothnessKey)
        ? mixed
        : smoothness
          ? smoothnessTitle(smoothness)
          : undefined,
      placeholder: t('smoothness', 'Smoothness'),
      tooltip: smoothness
        ? tooltip('smoothness', smoothness, choice?.cell?.description, choice?.cell?.photo, surface)
        : null,
    })

    // the open picker, below the tiles
    const picker = root.selectAll(':scope > .ssf-picker').data(_open ? [_open] : [], (d: any) => d)
    picker.exit().remove()
    const pickerRoot = picker
      .enter()
      .append('div')
      .attr('class', (d: string) => `ssf-picker ssf-picker-${d}`)
      .merge(picker as any)
    if (_open === 'surface') renderSurfaceGrid(pickerRoot, surface)
    if (_open === 'smoothness' && surface) {
      renderSmoothnessChoices(pickerRoot, surface, smoothnessChoices(surface), smoothness)
    }
    if (_open) renderPickerRow(pickerRoot, _open)
  }

  /** One of the two tiles: photo (or emoji, or an empty placeholder), the label below. */
  function renderValueTile(
    parent: Sel,
    d: {
      id: 'surface' | 'smoothness'
      photo: string | undefined
      emoji: string | undefined
      mixed: boolean
      title: string | undefined
      placeholder: string
      tooltip: string | null
    },
  ) {
    const button = oneChild(parent, 'button', `ssf-value ssf-value-${d.id}`)
      .attr('type', 'button')
      .classed('empty', !d.title)
      .classed('mixed', d.mixed)
      .classed('open', _open === d.id)
      .attr('aria-expanded', String(_open === d.id))
      .attr('title', d.tooltip)
      .on('click', (event: Event) => {
        event.preventDefault()
        toggle(d.id)
      })
    button.html('')
    const visual = button.append('span').attr('class', 'ssf-value-visual')
    if (d.photo) visual.append('img').attr('src', assetUrl(d.photo)).attr('alt', '')
    else if (d.emoji) visual.append('span').attr('class', 'ssf-value-emoji').text(d.emoji)
    button
      .append('span')
      .attr('class', 'ssf-value-title')
      .text(d.title ? `${d.photo && d.emoji ? `${d.emoji} ` : ''}${d.title}` : d.placeholder)
  }

  function renderSurfaceGrid(parent: Sel, current: string | undefined) {
    const grid = oneChild(parent, 'div', 'ssf-tiles').on('keydown', onGridKeydown)
    const tile = grid.selectAll('button.ssf-tile').data(orderedSurfaces(), (d: any) => d)
    tile.exit().remove()
    const enter = tile.enter().append('button').attr('type', 'button').attr('class', 'ssf-tile')
    enter.each(function (this: HTMLButtonElement, surface: string) {
      const button = d3_select(this)
      const visual = button.append('span').attr('class', 'ssf-tile-visual')
      const icon = getSurfaceInfo(surface)?.icon
      if (icon) {
        visual.append('img').attr('loading', 'lazy').attr('src', assetUrl(icon)).attr('alt', '')
      }
      button.append('span').attr('class', 'ssf-tile-title').text(surfaceTitle(surface))
    })
    const tiles = enter
      .merge(tile as any)
      .order()
      .classed('selected', (surface: string) => surface === current)
      .attr('aria-pressed', (surface: string) => String(surface === current))
      .attr('title', (surface: string) =>
        tooltip('surface', surface, undefined, getSurfaceInfo(surface)?.icon),
      )
      .on('click', (event: Event, surface: string) => {
        event.preventDefault()
        chooseSurface(surface, true)
      })
    rovingTabindex(tiles, (surface: string) => surface === current)
  }

  function renderSmoothnessChoices(
    parent: Sel,
    surface: string,
    choices: SmoothnessChoice[],
    current: string | undefined,
  ) {
    const withPhotos = choices.some((c) => c.cell)
    parent.selectAll(withPhotos ? ':scope > .ssf-levels' : ':scope > .ssf-cards').remove()
    const list = oneChild(parent, 'div', withPhotos ? 'ssf-cards' : 'ssf-levels').on(
      'keydown',
      onGridKeydown,
    )

    // keyed by surface: a new surface brings new photos
    const card = list
      .selectAll('button.ssf-card')
      .data(choices, (d: any) => `${surface}/${(d as SmoothnessChoice).smoothness}`)
    card.exit().remove()
    const enter = card.enter().append('button').attr('type', 'button').attr('class', 'ssf-card')
    enter.each(function (this: HTMLButtonElement, d: SmoothnessChoice) {
      const button = d3_select(this)
      if (d.cell) {
        button
          .append('img')
          .attr('class', 'ssf-card-photo')
          .attr('loading', 'lazy')
          .attr('src', assetUrl(d.cell.photo))
          .attr('alt', '')
      }
      const head = button.append('span').attr('class', 'ssf-card-head')
      head
        .append('span')
        .attr('class', 'ssf-card-emoji')
        .text(d.level?.emoji ?? '')
      head.append('span').attr('class', 'ssf-card-title').text(smoothnessTitle(d.smoothness))
    })
    const cards = enter
      .merge(card as any)
      .order()
      .classed('selected', (d: SmoothnessChoice) => d.smoothness === current)
      .attr('aria-pressed', (d: SmoothnessChoice) => String(d.smoothness === current))
      .attr('title', (d: SmoothnessChoice) =>
        tooltip('smoothness', d.smoothness, d.cell?.description, d.cell?.photo, surface),
      )
      .on('click', (event: Event, d: SmoothnessChoice) => {
        event.preventDefault()
        // choosing the current value again removes it
        chooseSmoothness(d.smoothness === current ? undefined : d.smoothness, true)
      })
    rovingTabindex(cards, (d: SmoothnessChoice) => d.smoothness === current)
  }

  // ---- the label | input row below an open picker ---------------------------------

  /** Values for a dropdown: the catalogue's (in grid order), then the host's other options. */
  function dropdownValues(name: 'surface' | 'smoothness'): string[] {
    const own = name === 'surface' ? orderedSurfaces() : Object.keys(catalogue.smoothnessLevels)
    const host = adapters.options?.(name) ?? []
    return [...own, ...host.filter((v) => !own.includes(v))]
  }

  function textRow(name: 'surface' | 'smoothness'): TextRow {
    return name === 'surface'
      ? {
          name,
          key: keys.surfaceKey,
          label: t('surface', 'Surface'),
          values: dropdownValues('surface'),
          title: surfaceTitle,
        }
      : {
          name,
          key: keys.smoothnessKey,
          label: t('smoothness', 'Smoothness'),
          values: dropdownValues('smoothness'),
          title: smoothnessTitle,
        }
  }

  /**
   * Below the photos: a label | input row like iD's directional fields, for the same key.
   * It takes any value, also one without a photo.
   */
  function renderPickerRow(picker: Sel, name: 'surface' | 'smoothness') {
    const d = textRow(name)
    const rows = oneChild(picker, 'ul', 'rows rows-table ssf-picker-row')
    const row = oneChild(rows, 'li', 'labeled-input')
    oneChild(row, 'div', 'label').text(d.label)
    const cell = oneChild(row, 'div', 'ssf-text-cell')
    const node = cell.node() as HTMLElement | null
    if (adapters.renderInput && node) {
      adapters.renderInput(node, name, _tags[d.key], (next) => {
        if (next === value(d.key)) return
        if (name === 'surface') chooseSurface(next)
        else chooseSmoothness(next)
      })
    } else {
      renderDropdown(cell, d)
    }
  }

  /** An input with a suggestion list in `cell`; choosing works like clicking a photo. */
  function renderDropdown(cell: Sel, d: TextRow) {
    const inputSel = oneChild(cell, 'input', 'ssf-text-input')
      .attr('type', 'text')
      .attr('autocomplete', 'off')
    const list = oneChild(cell, 'ul', 'ssf-combo-list')
    const input = inputSel.node() as HTMLInputElement | null
    if (!input) return

    const current = _tags[d.key]
    if (document.activeElement !== input) {
      input.value = typeof current === 'string' ? d.title(current) : ''
      list.style('display', 'none')
    }
    input.placeholder = Array.isArray(current)
      ? t('multiple_values', 'Multiple values')
      : t(`${d.name}_placeholder`, `${d.title(d.values[0] ?? '')}…`)

    const choose = (next: string | undefined) => {
      if (next === (typeof _tags[d.key] === 'string' ? _tags[d.key] : undefined)) return
      if (d.key === keys.surfaceKey) chooseSurface(next)
      else chooseSmoothness(next)
    }
    const commit = () => {
      const typed = input.value.trim()
      // a known title stands for its value, anything else is a raw tag value
      const known = d.values.find(
        (v) => v === typed || d.title(v).toLowerCase() === typed.toLowerCase(),
      )
      choose(typed ? (known ?? typed) : undefined)
    }
    inputSel
      .on('focus input', () => openList(list, d, input.value))
      .on('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          input.blur()
        } else if (event.key === 'Escape') {
          list.style('display', 'none')
        }
      })
      .on('blur', () => {
        list.style('display', 'none')
        commit()
      })
    list.on('mousedown', (event: Event) => {
      const item = (event.target as HTMLElement).closest('li') as
        | (HTMLElement & { __data__?: string })
        | null
      if (!item?.__data__) return
      event.preventDefault()
      input.value = d.title(item.__data__)
      list.style('display', 'none')
      input.blur()
      choose(item.__data__)
    })
  }

  function openList(list: Sel, d: TextRow, query: string) {
    const q = query.trim().toLowerCase()
    const items = d.values.filter(
      (v) => !q || v.toLowerCase().includes(q) || d.title(v).toLowerCase().includes(q),
    )
    list.style('display', items.length ? 'block' : 'none')
    const li = list.selectAll('li').data(items, (v: any) => v)
    li.exit().remove()
    const enter = li.enter().append('li').attr('class', 'ssf-combo-item')
    enter.append('span').attr('class', 'ssf-combo-title')
    enter.append('span').attr('class', 'ssf-combo-code')
    const merged = enter.merge(li as any).order()
    merged.select('.ssf-combo-title').text((v: string) => d.title(v))
    merged.select('.ssf-combo-code').text((v: string) => v)
  }

  // ---- instance (iD field interface) --------------------------------------------

  const instance = ((selection: Sel) => {
    const sel = selection.selectAll('.surface-smoothness-field').data([0])
    _root = sel
      .enter()
      .append('div')
      .attr('class', 'surface-smoothness-field')
      .merge(sel as any)
    // the instance that draws into this node now (see onEscape)
    const node = _root.node() as (HTMLElement & { __ssfOwner?: unknown }) | null
    if (node) node.__ssfOwner = instance
    render()
  }) as unknown as SurfaceSmoothnessInstance

  instance.tags = (tags: FieldTags) => {
    _tags = tags ?? {}
    render()
    return instance
  }
  instance.entityIDs = () => {
    // another feature: start again with the closed tiles
    _open = undefined
    listenForEscape()
    return instance
  }
  instance.focus = () => {
    const node = _root.select('button, input').node() as HTMLElement | null
    node?.focus()
    return instance
  }
  instance.on = (type: string, listener?: (...args: unknown[]) => void) => {
    dispatch.on(type, listener)
    return instance
  }

  return instance
}

const GRID_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']

/**
 * The item an arrow key (or Home/End) moves to in a wrapping grid of `items`, by their position
 * on screen; undefined for other keys or at an edge.
 */
export function gridNeighbour(
  items: HTMLElement[],
  current: number,
  key: string,
  rtl = false,
): number | undefined {
  const last = items.length - 1
  const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = rtl ? 'ArrowRight' : 'ArrowLeft'
  if (key === 'Home') return 0
  if (key === 'End') return last
  if (key === forward) return current < last ? current + 1 : undefined
  if (key === back) return current > 0 ? current - 1 : undefined
  if (key !== 'ArrowDown' && key !== 'ArrowUp') return undefined
  const from = items[current]?.getBoundingClientRect()
  if (!from) return undefined
  const down = key === 'ArrowDown'
  let best: number | undefined
  let bestScore = Infinity
  items.forEach((item, i) => {
    const box = item.getBoundingClientRect()
    const rowDistance = down ? box.top - from.top : from.top - box.top
    if (rowDistance < 1) return
    // the nearest row first, then the closest column in it
    const score = rowDistance * 10_000 + Math.abs(box.left - from.left)
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}
