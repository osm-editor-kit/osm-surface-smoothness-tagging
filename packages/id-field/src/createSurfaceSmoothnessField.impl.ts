import {
  catalogue,
  getSmoothnessOptionsForSurface,
  getSurfaceInfo,
} from '@osm-surface-smoothness/data'
import { dispatch as d3_dispatch } from 'd3-dispatch'
import { select as d3_select, type Selection } from 'd3-selection'
import { resolveKeys, smoothnessChangePatch, surfaceChangePatch } from './logic.js'
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
type SurfaceItem = (typeof catalogue.surfaces)[string]
type SmoothnessOption = ReturnType<typeof getSmoothnessOptionsForSurface>[number]

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

  const surfaceValue = (): string | undefined => {
    const v = _tags[keys.surfaceKey]
    return typeof v === 'string' && v ? v : undefined
  }
  const smoothnessValue = (): string | undefined => {
    const v = _tags[keys.smoothnessKey]
    return typeof v === 'string' && v ? v : undefined
  }

  function emit(patch: TagPatch) {
    _tags = { ..._tags, ...patch }
    render()
    dispatch.call('change', instance, patch)
  }

  function chooseSurface(value: string | undefined) {
    emit(surfaceChangePatch(smoothnessValue(), value, keys))
  }
  function chooseSmoothness(value: string) {
    const next = smoothnessValue() === value ? undefined : value
    emit(smoothnessChangePatch(next, keys))
  }

  // ---- skeleton + rendering ----------------------------------------------

  function ensureSkeleton() {
    if (!_root.select('.ssf-surface').empty()) return

    const surface = _root.append('div').attr('class', 'ssf-section ssf-surface')
    surface.append('label').attr('class', 'ssf-label').text(t('surface', 'Surface'))
    const combo = surface.append('div').attr('class', 'ssf-combo')
    combo
      .append('input')
      .attr('class', 'ssf-surface-input')
      .attr('type', 'text')
      .attr('autocomplete', 'off')
      .attr('placeholder', t('surface_placeholder', 'e.g. asphalt'))
      .on('focus', function (this: HTMLInputElement) {
        openSurfaceList(this.value)
      })
      .on('input', function (this: HTMLInputElement) {
        openSurfaceList(this.value)
      })
      .on('keydown', function (this: HTMLInputElement, event: KeyboardEvent) {
        if (event.key === 'Enter') {
          event.preventDefault()
          chooseSurface(this.value.trim() || undefined)
          closeSurfaceList()
        } else if (event.key === 'Escape') {
          closeSurfaceList()
        }
      })
      .on('blur', () => window.setTimeout(closeSurfaceList, 150))
    combo.append('ul').attr('class', 'ssf-combo-list').style('display', 'none')

    const smoothness = _root.append('div').attr('class', 'ssf-section ssf-smoothness')
    smoothness.append('label').attr('class', 'ssf-label').text(t('smoothness', 'Smoothness'))
    smoothness.append('div').attr('class', 'ssf-grid')
    smoothness.append('div').attr('class', 'ssf-hint')
  }

  function openSurfaceList(query: string) {
    const q = query.trim().toLowerCase()
    const items = Object.values(catalogue.surfaces).filter(
      (s) =>
        !q || s.osmValue.toLowerCase().includes(q) || (s.title ?? '').toLowerCase().includes(q),
    )
    const list = _root.select('.ssf-combo-list').style('display', items.length ? 'block' : 'none')
    const li = list.selectAll('li').data(items, (d) => (d as SurfaceItem).osmValue)
    li.exit().remove()
    const enter = li
      .enter()
      .append('li')
      .attr('class', 'ssf-combo-item')
      .on('mousedown', (event: Event, d) => {
        event.preventDefault() // keep input focus until selection is applied
        const picked = d as SurfaceItem
        chooseSurface(picked.osmValue)
        // The input keeps focus (preventDefault), so render()'s activeElement guard
        // won't sync it — set the committed value explicitly so the box doesn't keep
        // showing the user's typed prefix instead of the chosen surface.
        _root.select('.ssf-surface-input').property('value', picked.osmValue)
        closeSurfaceList()
      })
    const merged = enter.merge(li as any)
    merged.classed('selected', (d) => (d as SurfaceItem).osmValue === surfaceValue())
    merged.html('')
    merged.each(function (this: HTMLLIElement, d) {
      const s = d as SurfaceItem
      const item = d3_select(this)
      if (s.icon) {
        item
          .append('img')
          .attr('class', 'ssf-combo-icon')
          .attr('src', assetUrl(s.icon))
          .attr('alt', '')
      }
      item
        .append('span')
        .attr('class', 'ssf-combo-title')
        .text(s.title ?? s.osmValue)
      item.append('span').attr('class', 'ssf-combo-code').text(s.osmValue)
    })
  }

  function closeSurfaceList() {
    _root.select('.ssf-combo-list').style('display', 'none')
  }

  function render() {
    if (_root.empty() || !_root.node()) return
    ensureSkeleton()

    const surface = surfaceValue()
    const input = _root.select('.ssf-surface-input')
    if (!input.empty() && document.activeElement !== input.node()) {
      input.property('value', surface ?? '')
    }
    renderSmoothness(surface)
  }

  function renderSmoothness(surface: string | undefined) {
    const grid = _root.select('.ssf-grid')
    const hint = _root.select('.ssf-hint')
    const info = surface ? getSurfaceInfo(surface) : undefined
    const options = surface ? getSmoothnessOptionsForSurface(surface) : []

    if (!surface) {
      grid.style('display', 'none').selectAll('*').remove()
      hint
        .style('display', 'block')
        .text(t('pick_surface', 'Pick a surface to see smoothness options.'))
      return
    }
    if (!options.length) {
      grid.style('display', 'none').selectAll('*').remove()
      const label = info?.title ?? surface
      hint
        .style('display', 'block')
        .text(t('no_smoothness', `No smoothness reference photos for ${label}.`))
      return
    }
    hint.style('display', 'none')
    grid.style('display', 'grid')

    // Key includes the surface: a card's photo is per (surface, smoothness), so a
    // surface change re-creates the cards (fresh photos), while a smoothness toggle
    // on the same surface reuses them and only flips `.selected` below — avoiding a
    // full DOM rebuild + image refetch on every click.
    const cards = grid
      .selectAll('button.ssf-card')
      .data(options, (d) => `${surface}/${(d as SmoothnessOption).smoothness}`)
    cards.exit().remove()
    const enter = cards
      .enter()
      .append('button')
      .attr('type', 'button')
      .attr('class', 'ssf-card')
      .on('click', (_event: Event, d) => chooseSmoothness((d as SmoothnessOption).smoothness))
    enter.each(function (this: HTMLButtonElement, d) {
      const o = d as SmoothnessOption
      const card = d3_select(this)
      card
        .append('img')
        .attr('class', 'ssf-card-photo')
        .attr('loading', 'lazy')
        .attr('src', assetUrl(o.cell.photo))
        .attr('alt', '')
      const head = card.append('div').attr('class', 'ssf-card-head')
      head
        .append('span')
        .attr('class', 'ssf-card-emoji')
        .text(o.level?.emoji ?? '')
      head
        .append('span')
        .attr('class', 'ssf-card-title')
        .text(o.level?.title ?? o.smoothness)
      card.append('div').attr('class', 'ssf-card-value').text(o.smoothness)
      if (o.cell.description) {
        card.append('div').attr('class', 'ssf-card-desc').text(o.cell.description)
      }
    })
    enter
      .merge(cards as any)
      .classed('selected', (d) => (d as SmoothnessOption).smoothness === smoothnessValue())
      .attr('aria-pressed', (d) =>
        (d as SmoothnessOption).smoothness === smoothnessValue() ? 'true' : 'false',
      )
  }

  // ---- instance (iD field interface) -------------------------------------

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
  instance.entityIDs = () => instance
  instance.focus = () => {
    const node = _root.select('.ssf-surface-input').node() as HTMLInputElement | null
    node?.focus()
    return instance
  }
  instance.on = (type: string, listener?: (...args: unknown[]) => void) => {
    dispatch.on(type, listener)
    return instance
  }

  return instance
}
