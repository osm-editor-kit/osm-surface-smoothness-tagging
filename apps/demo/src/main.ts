import '@osm-surface-smoothness/id-field/surface-smoothness-field.css'
import { createSurfaceSmoothnessField } from '@osm-surface-smoothness/id-field'
import { select } from 'd3-selection'

// Resolve catalogue asset paths ("images/x.jpg") to bundled URLs from the data package.
const imageMods = import.meta.glob('../../../packages/data/dist/generated/images/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const iconMods = import.meta.glob('../../../packages/data/dist/generated/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const assetByName = new Map<string, string>()
for (const [path, url] of Object.entries({ ...imageMods, ...iconMods })) {
  assetByName.set(path.split('/').pop()!, url as string)
}
const assetUrl = (path: string) => assetByName.get(path.split('/').pop()!) ?? path

// Mock iD tag state.
let tags: Record<string, string | undefined> = { surface: 'asphalt' }

const tagsEl = document.querySelector('#tags')!
function renderTags() {
  const clean = Object.fromEntries(Object.entries(tags).filter(([, v]) => v != null && v !== ''))
  tagsEl.textContent = Object.keys(clean).length ? JSON.stringify(clean, null, 2) : '{}'
}

const field = createSurfaceSmoothnessField({}, { assetUrl }, {}).on('change', (...args) => {
  const patch = args[0] as Record<string, string | undefined>
  tags = { ...tags, ...patch }
  renderTags()
})

select('#field').call(field as never)
field.tags(tags)
renderTags()

// Buttons to simulate the surface context an iD feature would arrive with.
const presets: { label: string; tags: Record<string, string> }[] = [
  { label: 'asphalt', tags: { surface: 'asphalt' } },
  { label: 'sett', tags: { surface: 'sett' } },
  { label: 'gravel', tags: { surface: 'gravel' } },
  { label: 'grass (no quest)', tags: { surface: 'grass' } },
  { label: 'asphalt + good', tags: { surface: 'asphalt', smoothness: 'good' } },
  { label: 'empty', tags: {} },
]
const presetsEl = document.querySelector('#presets')!
for (const preset of presets) {
  const btn = document.createElement('button')
  btn.textContent = preset.label
  btn.addEventListener('click', () => {
    tags = { ...preset.tags }
    field.tags(tags)
    renderTags()
  })
  presetsEl.appendChild(btn)
}
