import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
const targetDir = path.join(rootDir, 'apk')
const target = path.join(targetDir, 'taskrai-debug.apk')

try {
  if (!fs.existsSync(source)) {
    throw new Error(`APK not found: ${source}`)
  }
  fs.mkdirSync(targetDir, { recursive: true })
  fs.copyFileSync(source, target)
  console.log(`APK copied to: ${target}`)
} catch (error) {
  console.error(`APK copy failed: ${error.message}`)
  process.exit(1)
}
