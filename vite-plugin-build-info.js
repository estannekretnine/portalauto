export default function buildInfo() {
  return {
    name: 'build-info',
    generateBundle() {
      const buildTime = new Date().toISOString()
      const buildDate = new Date().toLocaleString('sr-RS', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Europe/Belgrade'
      })
      
      const buildInfo = {
        timestamp: buildTime,
        date: buildDate,
        version: process.env.npm_package_version || '0.0.0'
      }
      
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify(buildInfo, null, 2)
      })
    }
  }
}

