import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

// Get network IP address
function getNetworkIp() {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address
            }
        }
    }
    return 'localhost'
}

const networkIp = getNetworkIp()

// Custom plugin to display URLs on server start
const showUrlsPlugin = () => ({
    name: 'show-urls',
    configureServer(server) {
        server.httpServer?.once('listening', () => {
            const port = 3000

            setTimeout(() => {
                console.log('\n' + '='.repeat(60))
                console.log('  🎓 CAMPUS INTELLIGENCE SYSTEM')
                console.log('='.repeat(60))
                console.log(`\n  📚 Student Login:`)
                console.log(`     Local:   http://localhost:${port}/student/login`)
                console.log(`     Network: http://${networkIp}:${port}/student/login`)
                console.log(`\n  🏛️  Management Login:`)
                console.log(`     Local:   http://localhost:${port}/management/login`)
                console.log(`     Network: http://${networkIp}:${port}/management/login`)
                console.log(`\n  🎨 VBoard (HTTPS - Camera Enabled):`)
                console.log(`     https://${networkIp}:9444/`)
                console.log(`\n  📱 Mobile Scanner (HTTPS):`)
                console.log(`     https://${networkIp}:9443/scanner`)
                console.log('\n' + '='.repeat(60) + '\n')
            }, 100)
        })
    }
})

export default defineConfig({
    plugins: [react(), showUrlsPlugin()],
    server: {
        port: 3000,
        host: '0.0.0.0',
        open: false,
        proxy: {
            '/api/library': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            '/agent-api': {
                target: 'http://localhost:8010',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/agent-api/, '')
            }
        }
    }
})

