import ProjectNode from './ProjectNode'
import ModuleNode from './ModuleNode'
import GenerateNode from './GenerateNode'
import ValidateNode from './ValidateNode'
import ConditionNode from './ConditionNode'
import OutputNode from './OutputNode'
import DataModelNode from './DataModelNode'
import ApiNode from './ApiNode'
import EnvNode from './EnvNode'
import TestNode from './TestNode'
import ExampleNode from './ExampleNode'

export const nodeTypes = {
  project: ProjectNode,
  module: ModuleNode,
  generate: GenerateNode,
  validate: ValidateNode,
  condition: ConditionNode,
  output: OutputNode,
  'data-model': DataModelNode,
  api: ApiNode,
  env: EnvNode,
  test: TestNode,
  example: ExampleNode,
}
