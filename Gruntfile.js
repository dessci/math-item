module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: ['dist'],
            test: ['test/base.js']
        },
        connect: {
            root: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        typescript: {
            math_item: {
                src: ['src/math-item.ts'],
                dest: 'dist/math-item.js',
                options: { target: 'es3', sourceMap: true, declaration: true }
            },
            mathjax_tex: {
                src: ['src/mathjax-tex.ts'],
                dest: 'dist/mathjax-tex.js',
                options: { target: 'es3', sourceMap: true }
            },
            mathjax_mml: {
                src: ['src/mathjax-mml.ts'],
                dest: 'dist/mathjax-mml.js',
                options: { target: 'es3', sourceMap: true }
            },
            native_mml: {
                src: ['src/native-mml.ts'],
                dest: 'dist/native-mml.js',
                options: { target: 'es3', sourceMap: true }
            },
            eqnstore_source: {
                src: ['src/eqnstore-source.ts'],
                dest: 'dist/eqnstore-source.js',
                options: { target: 'es3', sourceMap: true }
            },
            autowrap_mathjax: {
                src: ['src/autowrap-mathjax.ts'],
                dest: 'dist/autowrap-mathjax.js',
                options: { target: 'es3', sourceMap: true }
            },
            test: {
                src: ['test/*.ts']
            }
        },
        watch: {
            math_item: {
                files: ['src/utils.ts', 'src/math-item.ts'],
                tasks: ['typescript:math_item']
            },
            mathjax_tex: {
                files: ['dist/math-item.d.ts', 'src/mathjax-tex.ts'],
                tasks: ['typescript:mathjax_tex']
            },
            mathjax_mml: {
                files: ['dist/math-item.d.ts', 'src/mathjax-mml.ts'],
                tasks: ['typescript:mathjax_mml']
            },
            native_mml: {
                files: ['dist/math-item.d.ts', 'src/native-mml.ts'],
                tasks: ['typescript:native_mml']
            },
            eqnstore_source: {
                files: ['dist/math-item.d.ts', 'src/eqnstore-source.ts'],
                tasks: ['typescript:eqnstore_source']
            },
            autowrap_mathjax: {
                files: ['dist/math-item.d.ts', 'src/autowrap-mathjax.ts'],
                tasks: ['typescript:autowrap_mathjax']
            },
            tests: {
                files: ['test/*.ts'],
                tasks: ['typescript:test']
            }
        },
        'saucelabs-mocha': {
            all: {
                options: {
                    //username: process.env.SAUCE_USERNAME,
                    //key: process.env.SAUCE_ACCESS_KEY,
                    urls: ['localhost:8080/test/base.html'],
                    testname: 'math-source test',
                    //'max-duration': 300,
                    browsers: [
                        ['Windows XP', 'internet explorer', 8],
                        ['Windows 7', 'internet explorer', 9],
                        ['Windows 8', 'internet explorer', 10],
                        ['Windows 8.1', 'internet explorer', 11],
                        ['OS X 10.10', 'safari', 8],
                        ['Linux', 'chrome', 40]
                    ]
                }
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-saucelabs');

    grunt.registerTask('default', ['clean', 'typescript:math_item', 'typescript:mathjax_tex',
        'typescript:mathjax_mml', 'typescript:native_mml', 'typescript:eqnstore_source', 'typescript:autowrap_mathjax']);
    grunt.registerTask('build-tests', ['clean:test', 'typescript:math_item', 'typescript:test']);
    grunt.registerTask('serve', ['connect', 'watch']);
    grunt.registerTask('test', ['build-tests', 'connect', 'saucelabs-mocha']);

};
