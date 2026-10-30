"use client"

import { CATALOG, resolveVehicle, type VehicleSelection } from "@/lib/odometer/catalog"
import { SelectField } from "./primitives"

export function VehicleSelect({
  selection,
  onChange,
}: {
  selection: VehicleSelection
  onChange: (next: VehicleSelection) => void
}) {
  const { make, model, engine } = resolveVehicle(selection)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SelectField
        label="Make"
        value={make.id}
        options={CATALOG.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(makeId) => {
          const nextMake = CATALOG.find((m) => m.id === makeId) ?? CATALOG[0]
          const nextModel = nextMake.models[0]
          onChange({ makeId, modelId: nextModel.id, engineId: nextModel.engines[0].id })
        }}
      />
      <SelectField
        label="Model"
        value={model.id}
        options={make.models.map((m) => ({ value: m.id, label: m.name }))}
        onChange={(modelId) => {
          const nextModel = make.models.find((m) => m.id === modelId) ?? make.models[0]
          onChange({ makeId: make.id, modelId, engineId: nextModel.engines[0].id })
        }}
      />
      <SelectField
        label="Engine"
        value={engine.id}
        options={model.engines.map((en) => ({ value: en.id, label: en.name }))}
        onChange={(engineId) => onChange({ makeId: make.id, modelId: model.id, engineId })}
      />
    </div>
  )
}
