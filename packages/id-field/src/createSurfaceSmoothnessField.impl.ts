import { catalogue, getSurfaceInfo } from '@osm-editor-kit/surface-smoothness-data'
import { dispatch as d3_dispatch } from 'd3-dispatch'
import { select as d3_select, type Selection } from 'd3-selection'
import {
  COMMON_SURFACES,
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
  SurfaceSmoothnessMode,
  TagPatch,
} from './types.js'

// d3 selections + dispatch are loosely typed inside the widget; the public API (types.ts) is strict.
type Sel = Selection<any, any, any, any>
type DispatchLike = {
  call: (type: string, that: unknown, ...args: unknown[]) => void
  on: (type: string, listener?: (...args: unknown[]) => void) => unknown
}
type Tile = { surface: string } | { more: true }
type TextRow = {
  name: 'surface' | 'smoothness'
  key: string
  label: string
  values: string[]
  title: (v: string) => string
}

/**
 * Surface and smoothness in two steps, photos first:
 * 1. Surface: a grid of photos (the usual surfaces, the rest behind "More"). Once chosen, one
 *    compact row with the photo; clicking it opens the grid again.
 * 2. Smoothness (after a surface): StreetComplete's reference photos for that surface, or every
 *    level with its emoji where there are none. Once chosen, one compact row as well.
 * The `text` mode shows plain inputs instead (any value, also one without a photo).
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
  let _mode: SurfaceSmoothnessMode = 'images'
  /** The grid / cards are open although a value is set ("change" was clicked). */
  let _editSurface = false
  let _editSmoothness = false
  let _allSurfaces = false

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
    _editSurface = false
    _allSurfaces = false
    if (surface === value(keys.surfaceKey)) return render()
    // the smoothness step comes next
    _editSmoothness = false
    emit(surfaceChangePatch(value(keys.smoothnessKey), surface, keys))
  }

  function chooseSmoothness(smoothness: string | undefined) {
    _editSmoothness = false
    emit(smoothnessChangePatch(smoothness, keys))
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
    _root.attr('data-mode', _mode)

    const images = _root.selectAll(':scope > .ssf-images').data(_mode === 'images' ? [0] : [])
    images.exit().remove()
    const imagesRoot = images
      .enter()
      .append('div')
      .attr('class', 'ssf-images')
      .merge(images as any)

    const text = _root.selectAll(':scope > .ssf-text').data(_mode === 'text' ? [0] : [])
    text.exit().remove()
    const textRoot = text
      .enter()
      .append('div')
      .attr('class', 'ssf-text')
      .merge(text as any)

    if (_mode === 'images') renderImages(imagesRoot)
    else renderText(textRoot)
  }

  function renderImages(root: Sel) {
    const surface = value(keys.surfaceKey)
    const smoothness = value(keys.smoothnessKey)

    // step 1: surface
    const step1 = oneChild(root, 'div', 'ssf-step ssf-step-surface')
    if ((!surface && !isMixed(keys.surfaceKey)) || _editSurface) {
      step1.selectAll(':scope > .ssf-summary').remove()
      renderSurfaceGrid(step1, surface)
    } else {
      step1.selectAll(':scope > .ssf-tiles').remove()
      renderSummary(step1, {
        photo: surface ? (getSurfaceInfo(surface)?.icon ?? undefined) : undefined,
        emoji: undefined,
        title: surface ? surfaceTitle(surface) : t('multiple_values', 'Multiple values'),
        tag: surface ? `${keys.surfaceKey}=${surface}` : '',
        onClick: () => {
          _editSurface = true
          render()
        },
      })
    }

    // step 2: smoothness, once there is a surface
    const step2 = root.selectAll(':scope > .ssf-step-smoothness').data(surface ? [0] : [])
    step2.exit().remove()
    const step2Root = step2
      .enter()
      .append('div')
      .attr('class', 'ssf-step ssf-step-smoothness')
      .merge(step2 as any)
    if (!surface) return

    oneChild(step2Root, 'div', 'ssf-step-label').text(t('smoothness', 'Smoothness'))
    const choices = smoothnessChoices(surface)
    if ((!smoothness && !isMixed(keys.smoothnessKey)) || _editSmoothness) {
      step2Root.selectAll(':scope > .ssf-summary').remove()
      renderSmoothnessChoices(step2Root, surface, choices, smoothness)
    } else {
      step2Root.selectAll(':scope > .ssf-cards, :scope > .ssf-levels').remove()
      const choice = choices.find((c) => c.smoothness === smoothness)
      renderSummary(step2Root, {
        photo: choice?.cell?.photo,
        emoji: smoothness
          ? (catalogue.smoothnessLevels[smoothness]?.emoji ?? undefined)
          : undefined,
        title: smoothness ? smoothnessTitle(smoothness) : t('multiple_values', 'Multiple values'),
        tag: smoothness ? `${keys.smoothnessKey}=${smoothness}` : '',
        onClick: () => {
          _editSmoothness = true
          render()
        },
      })
    }
  }

  function renderSummary(
    parent: Sel,
    d: {
      photo: string | undefined
      emoji: string | undefined
      title: string
      tag: string
      onClick: () => void
    },
  ) {
    const button = oneChild(parent, 'button', 'ssf-summary')
      .attr('type', 'button')
      .attr(
        'title',
        photoCredit(d.photo) ? `${t('photo', 'Photo')}: ${photoCredit(d.photo)}` : null,
      )
      .on('click', (event: Event) => {
        event.preventDefault()
        d.onClick()
      })
    button.html('')
    const visual = button.append('span').attr('class', 'ssf-summary-visual')
    if (d.photo) {
      visual.append('img').attr('src', assetUrl(d.photo)).attr('alt', '')
    } else {
      visual
        .append('span')
        .attr('class', 'ssf-summary-emoji')
        .text(d.emoji ?? '')
    }
    const text = button.append('span').attr('class', 'ssf-summary-text')
    text
      .append('span')
      .attr('class', 'ssf-summary-title')
      .text(d.photo && d.emoji ? `${d.emoji} ${d.title}` : d.title)
    text.append('span').attr('class', 'ssf-summary-tag').text(d.tag)
    button.append('span').attr('class', 'ssf-summary-change').text(t('change', 'Change'))
  }

  function renderSurfaceGrid(parent: Sel, current: string | undefined) {
    const all = orderedSurfaces()
    // the current value stays visible, also when it is not a common surface
    const shown = _allSurfaces
      ? all
      : all.filter((s) => COMMON_SURFACES.includes(s) || s === current)
    const tiles: Tile[] = [...shown.map((surface) => ({ surface })), { more: true }]

    const grid = oneChild(parent, 'div', 'ssf-tiles')
    const tile = grid
      .selectAll('button.ssf-tile')
      .data(tiles, (d: any) => ('more' in d ? '_more' : d.surface))
    tile.exit().remove()
    const enter = tile
      .enter()
      .append('button')
      .attr('type', 'button')
      .attr('class', (d: Tile) => ('more' in d ? 'ssf-tile ssf-tile-more' : 'ssf-tile'))
    enter.each(function (this: HTMLButtonElement, d: Tile) {
      const button = d3_select(this)
      const visual = button.append('span').attr('class', 'ssf-tile-visual')
      button.append('span').attr('class', 'ssf-tile-title')
      if ('more' in d) return
      const icon = getSurfaceInfo(d.surface)?.icon
      if (icon)
        visual.append('img').attr('loading', 'lazy').attr('src', assetUrl(icon)).attr('alt', '')
    })
    const merged = enter
      .merge(tile as any)
      .order()
      .classed('selected', (d: Tile) => 'surface' in d && d.surface === current)
      .attr('aria-pressed', (d: Tile) => ('surface' in d ? String(d.surface === current) : null))
      .attr('title', (d: Tile) => {
        if ('more' in d) return null
        const credit = photoCredit(getSurfaceInfo(d.surface)?.icon)
        return `${keys.surfaceKey}=${d.surface}${credit ? `\n${t('photo', 'Photo')}: ${credit}` : ''}`
      })
      .on('click', (event: Event, d: Tile) => {
        event.preventDefault()
        if ('more' in d) {
          _allSurfaces = !_allSurfaces
          render()
        } else {
          chooseSurface(d.surface)
        }
      })
    merged
      .select('.ssf-tile-title')
      .text((d: Tile) =>
        'more' in d
          ? _allSurfaces
            ? t('fewer', 'Fewer')
            : t('more', 'More')
          : surfaceTitle(d.surface),
      )
    merged
      .filter((d: Tile) => 'more' in d)
      .select('.ssf-tile-visual')
      .text(_allSurfaces ? '−' : `+${all.length - shown.length}`)
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

  // ---- text mode ----------------------------------------------------------------

  /** Two rows like iD's directional fields: a label cell, and an input with a suggestion list. */
  function renderText(root: Sel) {
    const rows = oneChild(root, 'ul', 'rows rows-table ssf-text-rows')
    const data: TextRow[] = [
      {
        name: 'surface',
        key: keys.surfaceKey,
        label: t('surface', 'Surface'),
        values: orderedSurfaces(),
        title: surfaceTitle,
      },
      {
        name: 'smoothness',
        key: keys.smoothnessKey,
        label: t('smoothness', 'Smoothness'),
        values: Object.keys(catalogue.smoothnessLevels),
        title: smoothnessTitle,
      },
    ]
    const row = rows.selectAll(':scope > li').data(data, (d: any) => d.key)
    const enter = row.enter().append('li').attr('class', 'labeled-input')
    enter.append('div').attr('class', 'label')
    const cell = enter.append('div').attr('class', 'ssf-text-cell')
    cell
      .append('input')
      .attr('type', 'text')
      .attr('autocomplete', 'off')
      .attr('class', 'ssf-text-input')
    cell.append('ul').attr('class', 'ssf-combo-list').style('display', 'none')

    const merged = enter.merge(row as any)
    merged.select('.label').text((d: TextRow) => d.label)
    const inputs = merged.select('input') as Selection<HTMLInputElement, TextRow, any, any>
    inputs.each((d: TextRow, i: number, nodes: ArrayLike<HTMLInputElement>) => {
      const input = nodes[i]
      if (!input) return
      const current = _tags[d.key]
      if (document.activeElement !== input) {
        input.value = typeof current === 'string' ? d.title(current) : ''
      }
      input.placeholder = Array.isArray(current)
        ? t('multiple_values', 'Multiple values')
        : t(`${d.name}_placeholder`, `${d.title(d.values[0] ?? '')}…`)

      const list = d3_select(input.parentNode as HTMLElement).select('.ssf-combo-list')
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
      d3_select(input)
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
        choose(item.__data__)
      })
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
    // another feature: start again with the compact rows
    _editSurface = false
    _editSmoothness = false
    _allSurfaces = false
    return instance
  }
  instance.focus = () => {
    const node = _root.select('button, input').node() as HTMLElement | null
    node?.focus()
    return instance
  }
  instance.mode = ((mode?: SurfaceSmoothnessMode) => {
    if (mode === undefined) return _mode
    _mode = mode
    render()
    return instance
  }) as SurfaceSmoothnessInstance['mode']
  instance.on = (type: string, listener?: (...args: unknown[]) => void) => {
    dispatch.on(type, listener)
    return instance
  }

  return instance
}
