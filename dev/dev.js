import fs from 'fs'
import path from 'path'
import * as sass from 'sass'
import * as esbuild from 'esbuild'
import {
    path_resolve,
    path_relative,
    is_prod,
    config,
    output_dir,
    log,
    mkdir,
    copy_dir,
    watch,
} from './utils.js'

const build_manifest = () => {
    log(36, 'i manifest:', 'generating manifest.json')

    const manifest = {
        "manifest_version": 3,
        "name": `${config.name} v${config.version}`,
        "version": config.version,
        "description": config.description,
        "permissions": ["tabs", "storage", "scripting", "activeTab"],
        "host_permissions": config.targets,
        "content_scripts": [
            {
                "matches": config.targets,
                "js": [
                    // "assets/lib/tailwind.min.js",
                    // "assets/lib/lz-string.min.js",
                    // "assets/lib/sweetalert2.all.min.js",
                    "assets/lib/firebase-app-compat.js",
                    "assets/lib/firebase-database-compat.js",
                    "assets/js/content.js"
                ],
                "run_at": "document_end"
            }
        ],
        "web_accessible_resources": [
            {
                "resources": [
                    "assets/css/content.css",
                    "assets/js/inject.js"
                ],
                "matches": config.targets
            }
        ],
        "action": {
            // "default_popup": "popup.html",
            "default_icon": config.icons
        },
        "background": {
            "service_worker": "assets/js/background.js"
        },
        "icons": config.icons
    }

    mkdir(output_dir)
    const dest_file = path.join(output_dir, 'manifest.json')
    fs.writeFileSync(dest_file, JSON.stringify(manifest, null, 2))
    log(32, '+ manifest:', path_relative(dest_file))
}

const build_scss = () => {
    const scss_dir = path_resolve('../src/scss')
    if (!fs.existsSync(scss_dir)) return

    const files = fs.readdirSync(scss_dir).filter(name => /\.scss$/i.test(name) && !name.startsWith('_'))
    const css_out_dir = path.join(output_dir, 'assets/css')
    mkdir(css_out_dir)

    files.forEach(file => {
        const src_file = path.join(scss_dir, file)
        const dest_file = path.join(css_out_dir, file.replace(/\.scss$/i, '.css'))
        try {
            const result = sass.compile(src_file, {
                style: is_prod ? 'compressed' : 'expanded',
            })
            fs.writeFileSync(dest_file, result.css)
            log(32, '+ scss:', path_relative(dest_file))
        } catch (err) {
            log(31, 'x scss error:', err.message)
        }
    })
}

const prerender_html = (lines, tag_name, tag_dir) => {
    const tags = []

    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].indexOf(`<insert-${tag_name}`) > -1) {
            if (lines[i].indexOf('<!--') < 0) {
                tags.push({
                    i,
                    line: lines[i],
                })
            }
        }
    }

    tags.forEach(tag => {
        const file_name = tag.line
            .split(`<insert-${tag_name}-`)[1]
            .split(' />')[0]
            .replace('--', '/')

        const file_path = path_resolve(
            `../src/${tag_dir}/`,
            `${file_name}.html`
        )

        if (fs.existsSync(file_path)) {
            const file_text = fs
                .readFileSync(file_path)
                .toString()
            lines.splice(tag.i, 1, ...file_text.split('\n'))
        }
    })
}

const build_html = async () => {
    const html_src_dir = path_resolve('../src/html')
    if (!fs.existsSync(html_src_dir)) return

    const app_to_build = fs
        .readdirSync(html_src_dir, { recursive: true })
        .filter(name => /\.html$/i.test(name))

    log(
        36,
        'i html:',
        `building ${app_to_build.length} file${app_to_build.length === 1 ? '' : 's'}`
    )

    app_to_build.forEach((app_filename) => {
        const p = path.join(html_src_dir, app_filename)
        if (fs.existsSync(p)) {
            let app_text = fs.readFileSync(p).toString()

            let app_lines = app_text.split('\n')
            prerender_html(app_lines, 'content', 'contents')
            prerender_html(app_lines, 'template', 'templates')
            let depth = 3
            while (depth-- > 0) {
                prerender_html(app_lines, 'component', 'components')
            }
            app_text = app_lines.join('')

            app_text = app_text.replace(/{{VERSION}}/g, config.version)
            app_text = app_text.replace(/{{NAME}}/g, config.name)

            const build_path = path.join(output_dir, app_filename)
            mkdir(path.dirname(build_path), '+ dir')
            fs.writeFileSync(build_path, app_text)
            log(32, '+ html:', path_relative(build_path))
        }
    })
}

const start = async () => {
    log(36, 'i dev:', is_prod ? 'start production packaging' : 'start development runtime')

    build_manifest()
    build_scss()
    await build_html()

    const entrypoints = config.entrypoints
        .map(n => path_resolve(`../src/ts/${n}.ts`))
        .filter(p => fs.existsSync(p))

    const esbuild_config = {
        entryPoints: entrypoints,
        bundle: true,
        minify: is_prod,
        sourcemap: !is_prod,
        outdir: path.join(output_dir, 'assets/js'),
        logLevel: 'silent',
        define: {
            __PROD__: JSON.stringify(is_prod),
        },
        plugins: [{
            name: 'terminal-notifier',
            setup(build) {
                build.onEnd((result) => {
                    const time = new Date().toLocaleTimeString()
                    if (result.errors.length > 0) {
                        log(31, `x esbuild [${time}]:`, `build failed with ${result.errors.length} error(s)`)
                        result.errors.forEach(err => {
                            console.error(`   -> ${err.text}`)
                            if (err.location) {
                                console.error(`      file: ${err.location.file}:${err.location.line}:${err.location.column}`)
                            }
                        })
                        return
                    }
                    log(32, `+ esbuild [${time}]:`, 'scripts compiled and bundled successfully.')
                })
            }
        }]
    }

    if (is_prod) {
        log(35, 'i esbuild:', 'exporting production bundle...')
        try {
            await esbuild.build(esbuild_config)
            log(32, '+ esbuild:', 'production scripts bundled and minified successfully.')
        } catch (err) {
            log(31, 'x esbuild error:', err.message)
        }

        const prod_img_dest = path.join(output_dir, 'assets/img')
        copy_dir(path_resolve('../public/assets/img'), prod_img_dest)
        log(32, '+ sync:', 'production img synchronized.')

        const prod_lib_dest = path.join(output_dir, 'assets/lib')
        copy_dir(path_resolve('../public/assets/lib'), prod_lib_dest)
        log(32, '+ sync:', 'production lib synchronized.')

        log(35, 'SUCCESS:', 'production package generated successfully.')
    } else {
        log(36, 'i esbuild:', 'start watching scripts...')
        try {
            const ctx = await esbuild.context(esbuild_config)
            await ctx.watch()
            log(32, '+ esbuild:', 'watching .ts files successfully.')
        } catch (err) {
            log(31, 'x esbuild watch error:', err.message)
        }

        watch(
            path_resolve('../src'),
            (name) => /\.html$/i.test(name),
            async () => { await build_html() }
        )

        watch(
            path_resolve('../src/scss'),
            (name) => /\.scss$/i.test(name),
            () => { build_scss() }
        )
    }
}

await start()
