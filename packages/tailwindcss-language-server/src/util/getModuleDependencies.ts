import fs from 'fs'
import path from 'path'
import resolve from 'resolve'
import detective from 'detective'
import normalizePath from 'normalize-path'

export function getModuleDependencies(modulePath: string): string[] {
  return _getModuleDependencies(modulePath)
    .map(({ file }) => file)
    .filter((file) => file !== modulePath)
    .map((file) => normalizePath(file))
}

function createModule(file) {
  const source = fs.readFileSync(file, 'utf-8')
  const requires = detective(source)

  return { file, requires }
}

function _getModuleDependencies(entryFile) {
  const rootModule = createModule(entryFile)
  const modules = [rootModule]

  // Iterate over the modules, even when new
  // ones are being added
  for (const mdl of modules) {
    mdl.requires
      .filter((dep) => {
        // Only track local modules, not node_modules
        return dep.startsWith('./') || dep.startsWith('../')
      })
      .forEach((dep) => {
        try {
          const basedir = path.dirname(mdl.file)
          const depPath = resolve.sync(dep, { basedir })
          const depModule = createModule(depPath)

          modules.push(depModule)
        } catch (_err) {
          // eslint-disable-next-line no-empty
        }
      })
  }

  return modules
}
