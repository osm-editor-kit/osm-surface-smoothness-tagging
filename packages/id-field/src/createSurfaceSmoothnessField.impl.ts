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

  function emit(patch: TagPatch) {
    _tags = { ..._tags, ...patch }
    render()
    dispatch.call('change', instance, patch)
  }

  function chooseSurface(surface: string | undefined) {
    // the smoothness for this surface comes next
    _open = surface ? 'smoothness' : undefined
    if (surface === value(keys.surfaceKey)) return render()
    emit(surfaceChangePatch(value(keys.smoothnessKey), surface, keys))
  }

  function chooseSmoothness(smoothness: string | undefined) {
    _open = undefined
    emit(smoothnessChangePatch(smoothness, keys))
  }

  /** Clicking a tile opens its picker (the surface one first), clicking it again closes it. */
  function toggle(picker: 'surface' | 'smoothness') {
    const needsSurface = picker === 'smoothness' && !value(keys.surfaceKey)
    const next = needsSurface ? 'surface' : picker
    _open = _open === next ? undefined : next
    render()
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
    renderValueTile(pair, {
      id: 'surface',
      photo: surface ? (getSurfaceInfo(surface)?.icon ?? undefined) : undefined,
      emoji: undefined,
      title: isMixed(keys.surfaceKey) ? mixed : surface ? surfaceTitle(surface) : undefined,
      placeholder: t('surface', 'Surface'),
      tag: surface ? `${keys.surfaceKey}=${surface}` : undefined,
    })
    renderValueTile(pair, {
      id: 'smoothness',
      photo: choice?.cell?.photo,
      emoji: smoothness ? (catalogue.smoothnessLevels[smoothness]?.emoji ?? undefined) : undefined,
      title: isMixed(keys.smoothnessKey)
        ? mixed
        : smoothness
          ? smoothnessTitle(smoothness)
          : undefined,
      placeholder: t('smoothness', 'Smoothness'),
      tag: smoothness ? `${keys.smoothnessKey}=${smoothness}` : undefined,
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
      title: string | undefined
      placeholder: string
      tag: string | undefined
    },
  ) {
    const button = oneChild(parent, 'button', `ssf-value ssf-value-${d.id}`)
      .attr('type', 'button')
      .classed('empty', !d.title)
      .classed('open', _open === d.id)
      .attr('aria-expanded', String(_open === d.id))
      .attr(
        'title',
        [d.tag, photoCredit(d.photo) ? `${t('photo', 'Photo')}: ${photoCredit(d.photo)}` : '']
          .filter(Boolean)
          .join('\n') || null,
      )
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
    const grid = oneChild(parent, 'div', 'ssf-tiles')
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
    enter
      .merge(tile as any)
      .order()
      .classed('selected', (surface: string) => surface === current)
      .attr('aria-pressed', (surface: string) => String(surface === current))
      .attr('title', (surface: string) => {
        const credit = photoCredit(getSurfaceInfo(surface)?.icon)
        return `${keys.surfaceKey}=${surface}${credit ? `\n${t('photo', 'Photo')}: ${credit}` : ''}`
      })
      .on('click', (event: Event, surface: string) => {
        event.preventDefault()
        chooseSurface(surface)
      })
  }

  function renderSmoothnessChoices(
    parent: Sel,
    surface: string,
    choices: SmoothnessChoice[],
    current: string | undefined,
  ) {
    const withPhotos = choices.some((c) => c.cell)
    parent.selectAll(withPhotos ? ':scope > .ssf-levels' : ':scope > .ssf-cards').remove()
    const list = oneChild(parent, 'div', withPhotos ? 'ssf-cards' : 'ssf-levels')

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
    enter
      .merge(card as any)
      .order()
      .classed('selected', (d: SmoothnessChoice) => d.smoothness === current)
      .attr('aria-pressed', (d: SmoothnessChoice) => String(d.smoothness === current))
      .attr('title', (d: SmoothnessChoice) => {
        const lines = [`${keys.smoothnessKey}=${d.smoothness}`]
        if (d.cell?.description) lines.push(d.cell.description)
        const credit = photoCredit(d.cell?.photo)
        if (credit) lines.push(`${t('photo', 'Photo')}: ${credit}`)
        return lines.join('\n')
      })
      .on('click', (event: Event, d: SmoothnessChoice) => {
        event.preventDefault()
        // choosing the current value again removes it
        chooseSmoothness(d.smoothness === current ? undefined : d.smoothness)
      })
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
    renderDropdown(oneChild(row, 'div', 'ssf-text-cell'), d)
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
