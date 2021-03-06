import 'isomorphic-unfetch' // eslint-disable-line import/no-unassigned-import
import {groupBy, sortBy, defaults, pick} from 'lodash'

const SOURCE_PRIORITIES = {
  'ministere-sante': 1,
  'sante-publique-france': 2,
  'agences-regionales-sante': 3,
  prefectures: 4,
  'lperez-historical-data': 5
}

export async function fetchJson(url) {
  const response = await fetch(url)
  if (response && response.ok) {
    return response.json()
  }
}

function consolidate(records) {
  const territoriesGroups = groupBy(records, r => `${r.date}-${r.code}`)

  return Object.keys(territoriesGroups).map(id => {
    return pick(sortBy(territoriesGroups[id], r => SOURCE_PRIORITIES[r.sourceType])
      .reduce((acc, row) => {
        defaults(acc, row)
        return acc
      }, {}), ['casConfirmes', 'deces', 'reanimation', 'hospitalises', 'gueris', 'date', 'code', 'nom'])
  })
}

function filterRecords(records) {
  const {START_DATE, ALLOWED_SOURCES} = process.env
  const filters = []

  if (START_DATE) {
    filters.push(r => r.date >= START_DATE)
  }

  if (ALLOWED_SOURCES) {
    filters.push(r => ALLOWED_SOURCES.split(',').includes(r.sourceType))
  }

  return records.filter(r => filters.every(filter => filter(r)))
}

export const getData = async () => {
  const records = await fetchJson('https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.json')

  return consolidate(filterRecords(records))
}
