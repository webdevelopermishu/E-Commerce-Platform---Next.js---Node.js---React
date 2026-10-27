import * as migration_20261026_084826_initial from './20261026_084826_initial'
import * as migration_20261026_090000_integrity_constraints from './20261026_090000_integrity_constraints'

export const migrations = [
  {
    up: migration_20261026_084826_initial.up,
    down: migration_20261026_084826_initial.down,
    name: '20261026_084826_initial',
  },
  {
    up: migration_20261026_090000_integrity_constraints.up,
    down: migration_20261026_090000_integrity_constraints.down,
    name: '20261026_090000_integrity_constraints',
  },
]
